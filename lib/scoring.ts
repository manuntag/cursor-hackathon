/**
 * The Liaison's judgment, made legible.
 *
 * Each candidate is scored on 4 criteria (0-100 each). The total is a
 * weighted sum; weights are *brief-aware* — for a cost-conscious brief like
 * Sarah's, Cost-fit and Tier-fit dominate; for a no-budget brief, Quality
 * would.
 *
 * Scores are hand-authored per (workItem, candidate) so the curated selection
 * wins for narrative clarity. In live mode (Day 2+), the Liaison agent will
 * produce comparable structured output.
 */

export type CriterionKey = "skillMatch" | "quality" | "costFit" | "tierFit";

export const CRITERIA: { key: CriterionKey; label: string; meaning: string }[] = [
  {
    key: "skillMatch",
    label: "Skill match",
    meaning: "How fully do the expert's skills cover the required skills?",
  },
  {
    key: "quality",
    label: "Quality",
    meaning: "Track record — rating weighted by prior commissions.",
  },
  {
    key: "costFit",
    label: "Cost-fit",
    meaning: "Price relative to the budget ceiling. Cheap = high.",
  },
  {
    key: "tierFit",
    label: "Tier-fit",
    meaning: "Is this tier the cheapest one that still meets the bar?",
  },
];

/** Weights tuned for Sarah's brief (cost-conscious, taste-where-it-matters). */
export const WEIGHTS: Record<CriterionKey, number> = {
  skillMatch: 0.30,
  quality: 0.25,
  costFit: 0.25,
  tierFit: 0.20,
};

export type CandidateScores = Record<CriterionKey, number>;

/**
 * Hand-authored scores keyed by [workItemId][expertHandle].
 * The selected candidate (per scenario.ts) wins each row.
 */
export const SCORES: Record<string, Record<string, CandidateScores>> = {
  "brand-strategy": {
    "brandstrat-anya": { skillMatch: 95, quality: 98, costFit: 60, tierFit: 95 },
    "mason-and-co": { skillMatch: 80, quality: 78, costFit: 80, tierFit: 70 },
  },
  "ui-design": {
    "maya-designs": { skillMatch: 95, quality: 96, costFit: 50, tierFit: 95 },
    "pixel-rye": { skillMatch: 80, quality: 80, costFit: 85, tierFit: 65 },
    "studio-bloom": { skillMatch: 65, quality: 60, costFit: 95, tierFit: 35 },
  },
  copywriting: {
    "wordsmith-studio": { skillMatch: 96, quality: 98, costFit: 55, tierFit: 95 },
    "quill-and-co": { skillMatch: 82, quality: 78, costFit: 85, tierFit: 65 },
    copydash: { skillMatch: 60, quality: 65, costFit: 98, tierFit: 30 },
  },
  "marketing-strategy": {
    "marketing-magpies": { skillMatch: 92, quality: 88, costFit: 88, tierFit: 92 },
    growmaven: { skillMatch: 95, quality: 95, costFit: 40, tierFit: 60 },
    flightdeck: { skillMatch: 70, quality: 65, costFit: 92, tierFit: 50 },
  },
  backend: {
    "shipfast-build": { skillMatch: 88, quality: 82, costFit: 80, tierFit: 92 },
    backendforge: { skillMatch: 92, quality: 90, costFit: 50, tierFit: 60 },
    apikit: { skillMatch: 75, quality: 60, costFit: 90, tierFit: 50 },
  },
  "social-calendar": {
    sociallab: { skillMatch: 92, quality: 80, costFit: 95, tierFit: 95 },
    buzzwave: { skillMatch: 85, quality: 82, costFit: 65, tierFit: 60 },
    contentloop: { skillMatch: 75, quality: 55, costFit: 100, tierFit: 90 },
  },
  legal: {
    "legalkit-pro": { skillMatch: 92, quality: 88, costFit: 78, tierFit: 92 },
    "bloom-legal": { skillMatch: 95, quality: 96, costFit: 35, tierFit: 55 },
    parapilot: { skillMatch: 65, quality: 50, costFit: 92, tierFit: 40 },
  },
  accounting: {
    "amir-cpa": { skillMatch: 90, quality: 86, costFit: 80, tierFit: 92 },
    bookbalance: { skillMatch: 70, quality: 60, costFit: 95, tierFit: 50 },
  },
  hr: {
    "hiringplan-ai": { skillMatch: 88, quality: 78, costFit: 96, tierFit: 95 },
    "peopleops-pro": { skillMatch: 90, quality: 82, costFit: 70, tierFit: 65 },
  },
  bizdev: {
    growop: { skillMatch: 90, quality: 84, costFit: 80, tierFit: 92 },
    "pivot-partners": { skillMatch: 75, quality: 65, costFit: 95, tierFit: 60 },
  },
};

export function totalScore(s: CandidateScores): number {
  return (
    s.skillMatch * WEIGHTS.skillMatch +
    s.quality * WEIGHTS.quality +
    s.costFit * WEIGHTS.costFit +
    s.tierFit * WEIGHTS.tierFit
  );
}

export function lookupScores(
  workItemId: string,
  expertHandle: string,
): CandidateScores | undefined {
  return SCORES[workItemId]?.[expertHandle];
}
