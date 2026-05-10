import {
  query,
  SYSTEM_PROMPT_DYNAMIC_BOUNDARY,
  type ModelUsage,
  type Options,
  type SDKResultSuccess,
} from "@anthropic-ai/claude-agent-sdk";
import { modelForTier, priceCall } from "./cost";
import type { CallCost, Tier } from "./types";

/**
 * Thin wrapper around the Claude Agent SDK's `query()` for the demo.
 *
 *  - Tier → model mapping via {@link modelForTier}.
 *  - System prompts are split into a *static* prefix (cacheable, anchored to
 *    a specialist's role/bio) and an optional *dynamic* suffix (per-run
 *    context). The runtime joins them with `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`
 *    so Anthropic's prompt cache hits across repeated demo runs.
 *  - No tools, no settings sources, no permission prompts — these loops are
 *    text-in / text-out. Specialists do not touch the filesystem.
 *  - Captures `SDKResultSuccess.modelUsage` and turns it into
 *    {@link CallCost} entries via {@link priceCall}; that's the entire bridge
 *    between live token usage and the savings ledger.
 *
 * **Demo only.** The SDK reads the operator's local Claude credentials
 * (subscription auth). No `ANTHROPIC_API_KEY` is referenced. Production
 * would swap this file for direct `@anthropic-ai/sdk` Messages calls — the
 * {@link RunAgentResult} shape stays identical, so callers don't change.
 */

export type SystemPromptParts = {
  /** The durable, cacheable prefix — role description, voice, constraints. */
  static: string;
  /** Optional per-run context — brief slice, citations, prior outputs. */
  dynamic?: string;
};

export type RunAgentArgs = {
  tier: Tier;
  systemPrompt: SystemPromptParts;
  prompt: string;
  /** Specialist handle (or "liaison"); labels resulting {@link CallCost}s. */
  handle: string;
  /** Work-item id when this run is attached to one. */
  itemId?: string;
  /** JSON schema for structured output. Used by the Liaison's decomposition. */
  schema?: Record<string, unknown>;
  /** Cap the agent loop (default 4 — specialists are effectively single-turn). */
  maxTurns?: number;
  /** Caller's abort signal. Propagated into the SDK's AbortController. */
  signal?: AbortSignal;
};

export type RunAgentResult = {
  /** Final assistant string (from `SDKResultSuccess.result`). */
  text: string;
  /** Parsed structured output if `schema` was passed; otherwise undefined. */
  structured?: unknown;
  /** Per-model cost entries (single element for a one-turn run). */
  callCosts: CallCost[];
  /** Wall-clock duration reported by the SDK. */
  durationMs: number;
};

/**
 * Run a single specialist (or the Liaison) once and harvest its cost.
 * Throws if the SDK's terminal message is anything but `subtype: 'success'` —
 * the orchestrator catches and falls back to canned content per work item.
 */
export async function runAgent(args: RunAgentArgs): Promise<RunAgentResult> {
  const model = modelForTier(args.tier);
  const abortController = bridgeSignal(args.signal);

  const options: Options = {
    model,
    systemPrompt: buildSystemPrompt(args.systemPrompt),
    maxTurns: args.maxTurns ?? 4,
    tools: [],
    settingSources: [],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
  };
  if (args.schema) {
    options.outputFormat = { type: "json_schema", schema: args.schema };
  }
  if (abortController) {
    options.abortController = abortController;
  }

  let result: SDKResultSuccess | undefined;
  let failureSubtype: string | undefined;

  for await (const msg of query({ prompt: args.prompt, options })) {
    if (msg.type !== "result") continue;
    if (msg.subtype === "success") {
      result = msg;
    } else {
      failureSubtype = msg.subtype;
    }
  }

  if (!result) {
    throw new Error(
      `agent-runtime: query() ended without success (handle=${args.handle}, tier=${args.tier}, reason=${failureSubtype ?? "no_result"})`,
    );
  }

  return {
    text: result.result,
    structured: result.structured_output,
    callCosts: costsFromModelUsage(result.modelUsage, {
      tier: args.tier,
      handle: args.handle,
      itemId: args.itemId,
    }),
    durationMs: result.duration_ms,
  };
}

function buildSystemPrompt(parts: SystemPromptParts): string | string[] {
  return parts.dynamic
    ? [parts.static, SYSTEM_PROMPT_DYNAMIC_BOUNDARY, parts.dynamic]
    : parts.static;
}

function bridgeSignal(signal: AbortSignal | undefined): AbortController | undefined {
  if (!signal) return undefined;
  const ac = new AbortController();
  if (signal.aborted) {
    ac.abort(signal.reason);
    return ac;
  }
  signal.addEventListener("abort", () => ac.abort(signal.reason), { once: true });
  return ac;
}

/**
 * Convert the SDK's per-model usage breakdown into {@link CallCost} rows the
 * cost ledger understands. Each model in `modelUsage` becomes one row; for a
 * single-turn specialist there is typically exactly one entry.
 *
 * The SDK reports four token buckets separately:
 *   - `inputTokens` — fresh, uncached input
 *   - `cacheReadInputTokens` — cache hits (priced ~10× cheaper)
 *   - `cacheCreationInputTokens` — cache writes (priced at input rate; Anthropic
 *     actually charges a small premium, but at demo scales the rounding noise
 *     is well under the savings we're showing)
 *   - `outputTokens` — generated tokens
 *
 * {@link priceCall} expects `inputTokens` to be the *total* input including
 * cache reads, plus `cachedInputTokens` for the cheap portion. We fold cache
 * creation in with fresh input to keep the wrapper simple.
 */
export function costsFromModelUsage(
  modelUsage: Record<string, ModelUsage>,
  meta: { tier: Tier; handle: string; itemId?: string },
): CallCost[] {
  const out: CallCost[] = [];
  for (const [model, u] of Object.entries(modelUsage)) {
    const fresh = u.inputTokens + u.cacheCreationInputTokens;
    const cached = u.cacheReadInputTokens;
    const total = fresh + cached;
    const { costCents, naiveCostCents } = priceCall({
      tier: meta.tier,
      inputTokens: total,
      outputTokens: u.outputTokens,
      cachedInputTokens: cached,
    });
    out.push({
      itemId: meta.itemId,
      handle: meta.handle,
      model,
      tier: meta.tier,
      inputTokens: total,
      outputTokens: u.outputTokens,
      cachedInputTokens: cached,
      costCents,
      naiveCostCents,
    });
  }
  return out;
}
