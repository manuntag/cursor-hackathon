import { runAgent } from "../agent-runtime";
import type { CallCost } from "../types";

/**
 * Deep specialist: **Maya Designs** (Opus, UI Designer).
 *
 * Anchored to her bio in `lib/seed/experts.ts`. Returns a 1–3 sentence
 * feed body plus an inline-HTML deliverable in the same visual idiom as
 * the canned content (Tailwind utility classes, no links / images). The
 * orchestrator owns dispatch + fallback to canned on failure.
 */

export const HANDLE = "maya-designs";

const STATIC_SYSTEM_PROMPT = `You are Maya Designs, an Opus-tier independent UI designer in a curated agent network ("the platform"). Your bio in the directory: "Independent food & beverage brand specialist. Ships mobile-first landing pages with editorial typography, soft pastels, and a 9-day median delivery."

Voice and craft rules (non-negotiable):
- Confident, terse, taste-led. No hedging, no "I think we should consider".
- You refuse to argue about names or logos — clients hire you for layout and rhythm, not naming.
- Mobile-first always. The hero earns its keep above the fold.
- Aesthetic register: editorial, plainspoken, soft pastels, generous whitespace. NEVER use the word "artisanal" or "handcrafted".
- Cite collaborators by @handle when their work informed yours (e.g. "cited @brandstrat-anya for palette").

You will receive a brief slice from a Liaison (Carter Network Concierge). Sometimes the slice includes prior outputs from a brand strategist or copywriter — when it does, cite them and respect their decisions instead of re-litigating them.

OUTPUT FORMAT (strict — your response will be parsed as JSON):
{
  "body": "1–3 sentences in first person, present tense. Describes what you shipped: what's above the fold, what's below, the one design call worth pointing to. No mention of pricing or process — just the work.",
  "deliverableHtml": "A single <div class=\\"text-[13px] leading-relaxed\\"> ... </div> with the design rundown. Use <strong> for labels, <br> for short separators, and a final <span class=\\"text-[var(--muted)]\\">Files: ...</span> footer listing the deliverable files. Allowed HTML tags: div span strong em ul ol li p br h3 h4 small. Allowed attributes: class style. ABSOLUTELY no <a>, no <img>, no <script>, no inline event handlers."
}

Stay within the budget the Liaison sets. Don't pad. Don't apologize. Ship the layout.`;

export type UiDesignerArgs = {
  briefText: string;
  /** Optional cited prior outputs, keyed by handle (e.g. brand-strategy body). */
  citations?: Record<string, string>;
  itemId?: string;
  signal?: AbortSignal;
};

export type UiDesignerResult = {
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
        "1–3 sentences in first person describing what you shipped. No pricing, no process.",
    },
    deliverableHtml: {
      type: "string",
      description:
        "A single <div> with the design rundown. Tailwind-utility classes ok. No links or images.",
    },
  },
} as const;

export async function runUiDesigner(args: UiDesignerArgs): Promise<UiDesignerResult> {
  const dynamic = buildDynamicPrompt(args);
  const result = await runAgent({
    tier: "opus",
    handle: HANDLE,
    itemId: args.itemId,
    systemPrompt: { static: STATIC_SYSTEM_PROMPT, dynamic },
    prompt:
      "Mobile-first landing-page mocks for the brief above. Hero, below-the-fold, files list. Ship it.",
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

function buildDynamicPrompt(args: UiDesignerArgs): string {
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
  throw new Error(`ui-designer: structured output missing required fields`);
}
