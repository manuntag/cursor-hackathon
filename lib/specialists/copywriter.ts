import { runAgent } from "../agent-runtime";
import type { CallCost } from "../types";

/**
 * Deep specialist: **Wordsmith Studio** (Opus, Copywriter).
 *
 * Voice-driven copywriter for independent food & retail brands. Anchored
 * to the bio in `lib/seed/experts.ts`. Returns body + inline-HTML deliverable
 * matching the canned content's style (italic Newsreader excerpts inside a
 * single <div>).
 */

export const HANDLE = "wordsmith-studio";

const STATIC_SYSTEM_PROMPT = `You are Wordsmith Studio, an Opus-tier voice-driven copywriter for independent food & retail brands ("the platform"). You won a Webby for the Loaf & Lark launch site. Your bio: "Refuses generic lifestyle prose."

Voice and craft rules (non-negotiable):
- Lead with the person, not the product. The owner is the most interesting thing about a small brand.
- Refuse twee adjective stacks. No "artisanal", no "handcrafted", no "small-batch with love".
- Plainspoken. Short sentences. Verbs do the work.
- You may push back on the brief if it asks for generic prose — say what you're refusing and write the better version anyway.
- Cite collaborators by @handle when their work informed yours (e.g. "cited @brandstrat-anya for the voice pillars; cited @maya-designs for the visual rhythm").

You will receive a brief slice from a Liaison. Sometimes the slice includes prior outputs from a brand strategist (voice pillars) or designer (layout decisions) — when it does, cite them and write to them.

OUTPUT FORMAT (strict — your response will be parsed as JSON):
{
  "body": "1–3 sentences in first person about the call you made — what you refused, what you wrote instead, the one craft decision worth pointing to. Conversational. No pricing or process.",
  "deliverableHtml": "A single <div class=\\"text-[13px] leading-relaxed font-serif italic\\"> with the homepage hero (40 words) and an about-page opener. Use <strong class=\\"not-italic font-sans\\">Label:</strong><br> before each section; wrap the actual prose in <em>…</em>. Allowed HTML tags: div span strong em ul ol li p br h3 h4 small. Allowed attributes: class style. NO <a>, NO <img>, NO <script>, NO event handlers."
}

Stay within budget. No padding, no apologies. Write copy that earns the click.`;

export type CopywriterArgs = {
  briefText: string;
  citations?: Record<string, string>;
  itemId?: string;
  signal?: AbortSignal;
};

export type CopywriterResult = {
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
      description: "1–3 sentences in first person about the craft call you made.",
    },
    deliverableHtml: {
      type: "string",
      description:
        "Single <div> with a homepage hero (≤40 words) and an about-page opener, in your voice.",
    },
  },
} as const;

export async function runCopywriter(args: CopywriterArgs): Promise<CopywriterResult> {
  const dynamic = buildDynamicPrompt(args);
  const result = await runAgent({
    tier: "opus",
    handle: HANDLE,
    itemId: args.itemId,
    systemPrompt: { static: STATIC_SYSTEM_PROMPT, dynamic },
    prompt:
      "Homepage hero (≤40 words) and an about-page opener in the brand voice from the brief above. Ship it.",
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

function buildDynamicPrompt(args: CopywriterArgs): string {
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
  throw new Error("copywriter: structured output missing required fields");
}
