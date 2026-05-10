import { runAgent } from "../agent-runtime";
import type { CallCost } from "../types";

/**
 * Deep specialist: **Marketing Magpies** (Sonnet, Marketing Strategist).
 *
 * Local-first launch strategy. Anchored to the bio in `lib/seed/experts.ts`.
 * On Sonnet, not Opus — the savings story depends on the Liaison's choice
 * to route this work to Sonnet (the curated rationale: "Local-first launch
 * is template-friendly").
 */

export const HANDLE = "marketing-magpies";

const STATIC_SYSTEM_PROMPT = `You are Marketing Magpies, a Sonnet-tier marketing strategist in a curated agent network ("the platform"). Your bio: "Specializes in 30/60/90-day plans for independent retail. Doesn't do paid media — pairs with a media buyer."

Craft rules (non-negotiable):
- 30/60/90-day structure, always. Each phase has 1–3 concrete tactics, not aspirations.
- Sequence matters more than volume: soft launch before press, press before paid, paid never before Day 60.
- Local first: hand-picked neighbors, neighborhood institutions, walk-in cafes — before broad reach.
- You do NOT propose paid media before Day 60. If the brief asks for it, refuse and explain why.
- When the brief mentions co-collaborators (a social-media agent, a bizdev agent, a copywriter) pair tactics to their deliverables and cite them by @handle.

You will receive a brief slice from a Liaison. The slice may include prior outputs from other specialists.

OUTPUT FORMAT (strict — your response will be parsed as JSON):
{
  "body": "1–3 sentences summarizing the plan in first person, present tense. Lead with the sequencing logic, not the tactics.",
  "deliverableHtml": "A single <div class=\\"text-[12.5px] leading-relaxed\\"> with: (1) a <div class=\\"font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1\\"> kicker like '30/60/90 — abridged', (2) a <ul class=\\"space-y-1\\"> with one <li> per phase, each starting with a <strong>Day X–Y</strong> · then the tactic, (3) a final <div class=\\"mt-2 text-[var(--muted)]\\">…</div> note summarizing the no-paid-before-Day-60 constraint and any pairings with other agents. Allowed tags: div span strong em ul ol li p br h3 h4 small. Allowed attrs: class style. NO <a>, NO <img>."
}

Stay within budget. No padding. Sequence > volume.`;

export type MarketingArgs = {
  briefText: string;
  citations?: Record<string, string>;
  itemId?: string;
  signal?: AbortSignal;
};

export type MarketingResult = {
  body: string;
  deliverable: string;
  callCosts: CallCost[];
  durationMs: number;
};

const SCHEMA = {
  type: "object",
  required: ["body", "deliverableHtml"],
  additionalProperties: false,
  properties: {
    body: {
      type: "string",
      description:
        "1–3 sentences summarizing the 30/60/90 plan in first person. Lead with sequencing.",
    },
    deliverableHtml: {
      type: "string",
      description:
        "Single <div> with a kicker + 4-bullet 30/60/90 outline + a muted footer note. Tailwind utilities ok.",
    },
  },
} as const;

export async function runMarketing(args: MarketingArgs): Promise<MarketingResult> {
  const dynamic = buildDynamicPrompt(args);
  const result = await runAgent({
    tier: "sonnet",
    handle: HANDLE,
    itemId: args.itemId,
    systemPrompt: { static: STATIC_SYSTEM_PROMPT, dynamic },
    prompt:
      "30/60/90-day plan for the brief above. No paid media before Day 60. Ship it.",
    schema: SCHEMA as unknown as Record<string, unknown>,
    maxTurns: 2,
    signal: args.signal,
  });

  const parsed = parseStructured(result.structured);
  return {
    body: parsed.body,
    deliverable: parsed.deliverableHtml,
    callCosts: result.callCosts,
    durationMs: result.durationMs,
  };
}

function buildDynamicPrompt(args: MarketingArgs): string {
  const lines: string[] = [];
  lines.push("# Brief slice (from the Liaison)");
  lines.push(args.briefText.trim());
  if (args.citations && Object.keys(args.citations).length > 0) {
    lines.push("");
    lines.push("# Prior outputs you may cite");
    for (const [handle, summary] of Object.entries(args.citations)) {
      lines.push(`## @${handle}`);
      lines.push(summary.trim());
    }
  }
  return lines.join("\n");
}

function parseStructured(value: unknown): { body: string; deliverableHtml: string } {
  if (value && typeof value === "object" && "body" in value && "deliverableHtml" in value) {
    const v = value as { body: unknown; deliverableHtml: unknown };
    if (typeof v.body === "string" && typeof v.deliverableHtml === "string") {
      return { body: v.body, deliverableHtml: v.deliverableHtml };
    }
  }
  throw new Error("marketing: structured output missing required fields");
}
