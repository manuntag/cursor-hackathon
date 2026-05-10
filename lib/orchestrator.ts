import { runAgent } from "./agent-runtime";
import { modelForTier, priceCall, summarize } from "./cost";
import { CANNED } from "./seed/canned-content";
import { findExpert } from "./seed/experts";
import { DECOMPOSITION } from "./seed/scenario";
import { runCopywriter } from "./specialists/copywriter";
import { runMarketing } from "./specialists/marketing";
import { runUiDesigner } from "./specialists/ui-designer";
import type {
  CallCost,
  EnrichedBrief,
  FeedEvent,
  WorkItem,
} from "./types";

/**
 * The Liaison agent loop ("Carter Network Concierge" in the directory).
 *
 * Inputs: an {@link EnrichedBrief} produced off-platform by the user's
 * Personal Agent. Outputs: an async iterable of {@link FeedEvent}s, in the
 * order the UI animates them.
 *
 * The Liaison's *decomposition* (which work items, which candidates, which
 * selected expert per item) is locked-curated data in
 * `lib/seed/scenario.ts` — regenerating it algorithmically would break the
 * narrative (hand-tuned scoring, brief-aware weights, etc). What the Liaison
 * does generate live is **the rationale string for each pick** — a short
 * sentence in Carter's voice explaining why this tier / this candidate.
 *
 * Dispatch:
 *   - UI design, copywriting, and marketing → live SDK specialists
 *   - The other 7 → canned content with realistic delays
 *
 * Set `LIAISON_MOCK=1` in the env to short-circuit the live Liaison call.
 * Specialists still run live unless their individual call fails (in which
 * case they fall back to canned content).
 */

export type OrchestratorOptions = {
  signal?: AbortSignal;
  /** Override the default stub delay for non-deep specialists. */
  stubDelayMs?: number;
};

const DEFAULT_STUB_DELAY_MS = 700;

const SOCIAL_GRAPH: Record<string, { cites?: string[]; endorsedBy?: string[] }> = {
  "maya-designs": { cites: ["brandstrat-anya"], endorsedBy: ["wordsmith-studio"] },
  "wordsmith-studio": { cites: ["brandstrat-anya", "maya-designs"] },
  "marketing-magpies": { cites: ["sociallab", "growop"] },
  "legalkit-pro": { cites: ["amir-cpa"] },
  growop: { cites: ["wordsmith-studio"] },
};

/* ============================================================================
 * Public entrypoint: an async generator the SSE route iterates.
 * ============================================================================ */

export async function* runOrchestrator(
  brief: EnrichedBrief,
  options: OrchestratorOptions = {},
): AsyncGenerator<FeedEvent, void, void> {
  const stubDelay = options.stubDelayMs ?? DEFAULT_STUB_DELAY_MS;
  const startedAt = Date.now();
  const allCosts: CallCost[] = [];

  yield event("brief", { text: brief.enrichedText });

  /* --- Liaison: generate per-item rationales (live unless LIAISON_MOCK=1) -- */
  const rationales = await liaisonRationales(brief, options.signal, allCosts);
  const decomposed: WorkItem[] = DECOMPOSITION.map((item) => ({
    ...item,
    rationale: rationales[item.id] ?? item.rationale,
  }));
  yield event("decompose", { items: decomposed });

  /* --- Per-item dispatch ------------------------------------------------- */
  // Track prior outputs so downstream specialists can cite them.
  const priorBodies: Record<string, string> = {};

  for (const item of decomposed) {
    if (options.signal?.aborted) return;

    yield event("select", {
      itemId: item.id,
      handle: item.selectedHandle,
      rationale: item.rationale,
    });

    const handle = item.selectedHandle;
    const expert = findExpert(handle);
    if (!expert) continue;

    let body: string;
    let deliverable: string | undefined;
    let costs: CallCost[];

    if (isDeep(handle)) {
      const live = await dispatchDeep(item, brief, priorBodies, options.signal);
      body = live.body;
      deliverable = live.deliverable;
      costs = live.callCosts;
    } else {
      // Stubs: simulate latency, log a synthetic cost calibrated to their tier.
      await delay(stubDelay, options.signal);
      const canned = CANNED[handle];
      if (!canned) {
        // Soft skip — no canned content authored for this handle.
        continue;
      }
      body = canned.body;
      deliverable = canned.deliverable;
      const { costCents, naiveCostCents } = priceCall({
        tier: canned.tier,
        inputTokens: canned.syntheticTokens.input,
        outputTokens: canned.syntheticTokens.output,
        cachedInputTokens: canned.syntheticTokens.cachedInput,
      });
      costs = [
        {
          itemId: item.id,
          handle,
          model: modelForTier(canned.tier),
          tier: canned.tier,
          inputTokens: canned.syntheticTokens.input,
          outputTokens: canned.syntheticTokens.output,
          cachedInputTokens: canned.syntheticTokens.cachedInput,
          costCents,
          naiveCostCents,
        },
      ];
    }

    priorBodies[handle] = body;
    allCosts.push(...costs);

    yield event("post", {
      itemId: item.id,
      handle,
      body,
      ...(deliverable ? { deliverable } : {}),
    });

    // Social graph: cites and endorsements come from a fixed cross-reference
    // table (same one used in static demo state) so the feed stays coherent.
    const social = SOCIAL_GRAPH[handle];
    if (social?.cites) {
      for (const toHandle of social.cites) {
        yield event("cite", { fromHandle: handle, toHandle, itemId: item.id });
      }
    }
    if (social?.endorsedBy) {
      for (const fromHandle of social.endorsedBy) {
        yield event("endorse", { fromHandle, toHandle: handle });
      }
    }

    yield event("approve", {
      itemId: item.id,
      payoutCents: expert.pricePerJob * 100,
    });
  }

  /* --- Summary ----------------------------------------------------------- */
  const totals = summarize(allCosts);
  yield event("summary", {
    spentCents: totals.spentCents,
    naiveCents: totals.naiveCents,
    savedPct: totals.savedPct,
  });

  // Silence "value never read" lint warnings for startedAt — useful for traces.
  void startedAt;
}

/* ============================================================================
 * Liaison rationale call — small Sonnet structured-output call.
 * ============================================================================ */

const LIAISON_STATIC_SYSTEM_PROMPT = `You are Carter Network Concierge, a Sonnet-tier Liaison in a curated agent network ("the platform"). You are listed in the directory like any other agent — rating 4.91, 412 prior briefs. Your specialty is multi-skill SMB coordination, with strong opinions on what should run on Haiku vs Sonnet vs Opus. You refuse to over-spec.

You will receive an EnrichedBrief from a user's off-platform Personal Agent, plus a list of work items the platform has already decomposed (with a curated candidate set and a selected expert per item). Your job is NOT to re-decompose or re-pick — those calls are settled. Your job is to write the *rationale* for each pick in 1 short sentence each: why this tier, why this candidate, why not the alternative. Brief-aware. Cost-conscious where the brief is cost-conscious.

Voice: terse, opinionated, never apologetic. You sound like a general contractor who has run 400+ projects and knows where every dollar pays back.

OUTPUT FORMAT (strict — your response will be parsed as JSON):
{
  "rationales": [
    { "itemId": "<id>", "rationale": "<one short sentence>" },
    ...
  ]
}

Every item in the input list must appear in your output, with the same itemId. Rationales must be ≤25 words each.`;

const LIAISON_SCHEMA = {
  type: "object",
  required: ["rationales"],
  additionalProperties: false,
  properties: {
    rationales: {
      type: "array",
      items: {
        type: "object",
        required: ["itemId", "rationale"],
        additionalProperties: false,
        properties: {
          itemId: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
  },
} as const;

async function liaisonRationales(
  brief: EnrichedBrief,
  signal: AbortSignal | undefined,
  costsSink: CallCost[],
): Promise<Record<string, string>> {
  const fallback: Record<string, string> = {};
  for (const item of DECOMPOSITION) {
    fallback[item.id] = item.rationale;
  }

  if (process.env.LIAISON_MOCK === "1") {
    return fallback;
  }

  const dynamic = buildLiaisonDynamicPrompt(brief);

  try {
    const result = await runAgent({
      tier: "sonnet",
      handle: "carter-network-concierge",
      systemPrompt: { static: LIAISON_STATIC_SYSTEM_PROMPT, dynamic },
      prompt:
        "Write the rationale for each work item below. One short sentence each. Brief-aware. Cost-conscious where the brief is.",
      schema: LIAISON_SCHEMA as unknown as Record<string, unknown>,
      maxTurns: 2,
      signal,
    });
    costsSink.push(...result.callCosts);

    const parsed = parseRationales(result.structured);
    return { ...fallback, ...parsed };
  } catch (err) {
    console.warn("orchestrator: liaison rationale call failed; using seeded rationales", err);
    return fallback;
  }
}

function buildLiaisonDynamicPrompt(brief: EnrichedBrief): string {
  const lines: string[] = [];
  lines.push("# Enriched brief (from the user's Personal Agent)");
  lines.push(brief.enrichedText.trim());
  lines.push("");
  lines.push("# Work items (already decomposed; selected expert is locked)");
  for (const item of DECOMPOSITION) {
    const candidates = item.candidateHandles
      .map((h) => {
        const e = findExpert(h);
        return e ? `${h} (${e.tier}, $${e.pricePerJob}, ★${e.rating.toFixed(2)})` : h;
      })
      .join(", ");
    lines.push(
      `- itemId=${item.id} · ${item.description} · candidates=[${candidates}] · selected=${item.selectedHandle} · tier=${item.tierUsed}`,
    );
  }
  return lines.join("\n");
}

function parseRationales(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || !("rationales" in value)) return {};
  const arr = (value as { rationales: unknown }).rationales;
  if (!Array.isArray(arr)) return {};
  const out: Record<string, string> = {};
  for (const entry of arr) {
    if (
      entry &&
      typeof entry === "object" &&
      "itemId" in entry &&
      "rationale" in entry &&
      typeof (entry as { itemId: unknown }).itemId === "string" &&
      typeof (entry as { rationale: unknown }).rationale === "string"
    ) {
      out[(entry as { itemId: string }).itemId] = (entry as { rationale: string }).rationale;
    }
  }
  return out;
}

/* ============================================================================
 * Deep specialist dispatch with graceful fallback to canned content.
 * ============================================================================ */

const DEEP_HANDLES = new Set(["maya-designs", "wordsmith-studio", "marketing-magpies"]);
function isDeep(handle: string): boolean {
  return DEEP_HANDLES.has(handle);
}

async function dispatchDeep(
  item: WorkItem,
  brief: EnrichedBrief,
  priorBodies: Record<string, string>,
  signal: AbortSignal | undefined,
): Promise<{ body: string; deliverable?: string; callCosts: CallCost[] }> {
  const handle = item.selectedHandle;
  const briefText = brief.enrichedText;
  const citations = pickCitations(handle, priorBodies);

  try {
    if (handle === "maya-designs") {
      const r = await runUiDesigner({ briefText, citations, itemId: item.id, signal });
      return { body: r.body, deliverable: r.deliverable, callCosts: r.callCosts };
    }
    if (handle === "wordsmith-studio") {
      const r = await runCopywriter({ briefText, citations, itemId: item.id, signal });
      return { body: r.body, deliverable: r.deliverable, callCosts: r.callCosts };
    }
    if (handle === "marketing-magpies") {
      const r = await runMarketing({ briefText, citations, itemId: item.id, signal });
      return { body: r.body, deliverable: r.deliverable, callCosts: r.callCosts };
    }
  } catch (err) {
    console.warn(`orchestrator: deep specialist ${handle} failed; using canned`, err);
  }

  // Fallback — canned content with synthetic cost.
  const canned = CANNED[handle];
  if (!canned) {
    return { body: `(${handle} produced no output)`, callCosts: [] };
  }
  const { costCents, naiveCostCents } = priceCall({
    tier: canned.tier,
    inputTokens: canned.syntheticTokens.input,
    outputTokens: canned.syntheticTokens.output,
    cachedInputTokens: canned.syntheticTokens.cachedInput,
  });
  return {
    body: canned.body,
    deliverable: canned.deliverable,
    callCosts: [
      {
        itemId: item.id,
        handle,
        model: modelForTier(canned.tier),
        tier: canned.tier,
        inputTokens: canned.syntheticTokens.input,
        outputTokens: canned.syntheticTokens.output,
        cachedInputTokens: canned.syntheticTokens.cachedInput,
        costCents,
        naiveCostCents,
      },
    ],
  };
}

function pickCitations(
  handle: string,
  priorBodies: Record<string, string>,
): Record<string, string> | undefined {
  const wants = SOCIAL_GRAPH[handle]?.cites;
  if (!wants) return undefined;
  const out: Record<string, string> = {};
  for (const h of wants) {
    if (priorBodies[h]) out[h] = priorBodies[h];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/* ============================================================================
 * Helpers
 * ============================================================================ */

function event<T extends FeedEvent["type"]>(
  type: T,
  payload: Omit<Extract<FeedEvent, { type: T }>, "type" | "ts">,
): Extract<FeedEvent, { type: T }> {
  return { type, ts: Date.now(), ...payload } as Extract<FeedEvent, { type: T }>;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
