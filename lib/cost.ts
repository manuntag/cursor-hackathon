import type { CallCost, CostSummary, Tier } from "./types";

/**
 * Per-tier token pricing in cents per million tokens.
 * Source: Anthropic public pricing page (input / output / cached input).
 * Adjust if Anthropic publishes updated rates before the demo.
 *
 * The savings story is robust to small absolute changes — what matters is the
 * Haiku↔Opus ratio (~15×), which has been stable across model generations.
 */
const PRICING_CENTS_PER_M_TOKENS: Record<
  Tier,
  { input: number; output: number; cachedInput: number; model: string }
> = {
  haiku: {
    input: 100, // $1
    output: 500, // $5
    cachedInput: 10, // $0.10 (10x discount on cache reads)
    model: "claude-haiku-4-5-20251001",
  },
  sonnet: {
    input: 300, // $3
    output: 1500, // $15
    cachedInput: 30, // $0.30
    model: "claude-sonnet-4-6",
  },
  opus: {
    input: 1500, // $15
    output: 7500, // $75
    cachedInput: 150, // $1.50
    model: "claude-opus-4-7",
  },
};

export function modelForTier(tier: Tier): string {
  return PRICING_CENTS_PER_M_TOKENS[tier].model;
}

/**
 * Compute cost for a single call.
 * Returns both the *actual* cost (at the call's tier) and the *naive* cost
 * (same tokens re-priced at Opus 4.7 rates).
 *
 * `cents` = millicents / 1000? No. We work in **whole cents** for display
 * and accumulate in plain numbers; precision is fine at demo scales.
 */
export function priceCall(args: {
  tier: Tier;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}): { costCents: number; naiveCostCents: number } {
  const cached = args.cachedInputTokens ?? 0;
  const fresh = Math.max(0, args.inputTokens - cached);

  const tierPx = PRICING_CENTS_PER_M_TOKENS[args.tier];
  const opusPx = PRICING_CENTS_PER_M_TOKENS.opus;

  const costCents =
    (fresh * tierPx.input) / 1_000_000 +
    (cached * tierPx.cachedInput) / 1_000_000 +
    (args.outputTokens * tierPx.output) / 1_000_000;

  const naiveCostCents =
    (fresh * opusPx.input) / 1_000_000 +
    (cached * opusPx.cachedInput) / 1_000_000 +
    (args.outputTokens * opusPx.output) / 1_000_000;

  return { costCents, naiveCostCents };
}

/**
 * Roll up a list of {@link CallCost}s into a {@link CostSummary}.
 */
export function summarize(calls: CallCost[]): CostSummary {
  const byTier: CostSummary["byTier"] = {
    haiku: { spentCents: 0, calls: 0 },
    sonnet: { spentCents: 0, calls: 0 },
    opus: { spentCents: 0, calls: 0 },
  };
  let spentCents = 0;
  let naiveCents = 0;
  for (const c of calls) {
    spentCents += c.costCents;
    naiveCents += c.naiveCostCents;
    byTier[c.tier].spentCents += c.costCents;
    byTier[c.tier].calls += 1;
  }
  const savedPct = naiveCents > 0 ? (1 - spentCents / naiveCents) * 100 : 0;
  return { spentCents, naiveCents, savedPct, byTier };
}

/**
 * Format cents as a dollar string with two decimals, no trailing zero rules.
 * `9420` → `"$94.20"` ; `2` → `"$0.02"` ; `0` → `"$0.00"`
 */
export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Whole-dollar formatter for hero numbers — drops cents if they're zero,
 * otherwise rounds to the dollar (the headline doesn't need cents).
 * `9420` → `"$94"` ; `40620` → `"$406"` ; `94` → `"$1"`
 */
export function formatDollarsRounded(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}
