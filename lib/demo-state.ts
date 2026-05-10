/**
 * Computes the static demo run state for Day 1 (no SDK calls yet). Day 2 will
 * replace the deep specialists' synthetic tokens with real ones from the SDK,
 * but the shape stays identical so the page doesn't need to change.
 */
import { priceCall, summarize, modelForTier } from "./cost";
import { CANNED } from "./seed/canned-content";
import { DECOMPOSITION } from "./seed/scenario";
import { findExpert } from "./seed/experts";
import type { CallCost, CostSummary, WorkItem } from "./types";

export type DemoEntry = {
  item: WorkItem;
  expertHandle: string;
  body: string;
  deliverable?: string;
  cost: CallCost;
  cites?: string[];
  endorsedBy?: string[];
};

export type DemoState = {
  entries: DemoEntry[];
  summary: CostSummary;
  totalElapsedMs: number;
};

/**
 * The "ground truth" social context — derived from cross-references in canned
 * content. Used so the feed shows real cite/endorse edges rather than ad-hoc.
 */
const SOCIAL_GRAPH: Record<string, { cites?: string[]; endorsedBy?: string[] }> = {
  "maya-designs": { cites: ["brandstrat-anya"], endorsedBy: ["wordsmith-studio"] },
  "wordsmith-studio": { cites: ["brandstrat-anya", "maya-designs"] },
  "marketing-magpies": { cites: ["sociallab", "growop"] },
  "legalkit-pro": { cites: ["amir-cpa"] },
  "growop": { cites: ["wordsmith-studio"] },
};

export function computeStaticDemoState(): DemoState {
  const entries: DemoEntry[] = [];
  for (const item of DECOMPOSITION) {
    const canned = CANNED[item.selectedHandle];
    if (!canned) continue;
    const expert = findExpert(item.selectedHandle);
    if (!expert) continue;

    const { costCents, naiveCostCents } = priceCall({
      tier: canned.tier,
      inputTokens: canned.syntheticTokens.input,
      outputTokens: canned.syntheticTokens.output,
      cachedInputTokens: canned.syntheticTokens.cachedInput,
    });

    const cost: CallCost = {
      itemId: item.id,
      handle: expert.handle,
      model: modelForTier(canned.tier),
      tier: canned.tier,
      inputTokens: canned.syntheticTokens.input,
      outputTokens: canned.syntheticTokens.output,
      cachedInputTokens: canned.syntheticTokens.cachedInput,
      costCents,
      naiveCostCents,
    };

    const social = SOCIAL_GRAPH[expert.handle] ?? {};
    entries.push({
      item,
      expertHandle: expert.handle,
      body: canned.body,
      deliverable: canned.deliverable,
      cost,
      cites: social.cites,
      endorsedBy: social.endorsedBy,
    });
  }

  const summary = summarize(entries.map((e) => e.cost));
  // Synthetic stage time — used for the closing "brief → done" stat.
  const totalElapsedMs = 2 * 60 * 60 * 1000 + 34 * 60 * 1000; // 2h 34m
  return { entries, summary, totalElapsedMs };
}

export function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
