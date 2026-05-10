/**
 * Core types for the platform. The same types are used by:
 *  - the agent registry / directory ({@link Expert})
 *  - the orchestrator's decomposition ({@link WorkItem})
 *  - the live feed ({@link FeedEvent})
 *  - the cost ledger ({@link CallCost}, {@link CostSummary})
 *
 * No DB; these are TypeScript constants in lib/seed/* during the hackathon.
 */

export type Tier = "haiku" | "sonnet" | "opus";

export type Endorsement = {
  fromHandle: string;
  quote: string;
};

export type PortfolioItem = {
  title: string;
  blurb: string;
};

export type Expert = {
  handle: string; // url-safe slug, e.g. "maya-designs"
  name: string;
  role: string; // e.g. "UI Designer"
  tier: Tier; // determines which model the runtime spawns
  rating: number; // 0..5, two decimals
  priorJobs: number;
  pricePerJob: number; // dollars (display); varies within a tier
  bio: string;
  skills: string[];
  ownerHandle?: string; // human owner who trained / endorses the agent
  portfolio?: PortfolioItem[];
  endorsements?: Endorsement[];
};

/**
 * What the user said in their own words — typically informal and short.
 * The Personal Agent's job is to turn this into an EnrichedBrief.
 */
export type RawRequest = {
  user: string; // user name
  text: string; // the literal sentence
  timestamp: number;
};

/**
 * What the Personal Agent knows about its user from prior conversations,
 * stored memory, calendar, files, etc. Drives enrichment.
 *
 * Off-platform in production — the Personal Agent lives in the user's
 * environment (Cursor, Claude Code, ChatGPT). For the demo we seed it.
 */
export type PersonalAgentMemory = {
  factsKnown: string[]; // bullet list of remembered facts
  preferences: string[]; // taste / aesthetic / budget signals
  notes?: string; // free-text additional context
};

/**
 * The Personal Agent's enrichment of a RawRequest. This is what arrives
 * at the platform's Liaison.
 */
export type EnrichedBrief = {
  raw: RawRequest;
  memory: PersonalAgentMemory;
  enrichedText: string; // the multi-paragraph brief synthesized by the Personal Agent
  proposedScope: string[]; // bullets — what the Personal Agent thinks is in scope
  budgetCeilingCents?: number; // optional cap surfaced by the Personal Agent
};

export type WorkItem = {
  id: string;
  description: string;
  requiredSkills: string[];
  candidateHandles: string[]; // 2-3 surfaced for the role
  selectedHandle: string;
  tierUsed: Tier;
  rationale: string; // one-sentence "why this tier"
};

/* ==========================================================================
 * Live feed event union — emitted by the orchestrator, streamed via SSE.
 * Order is meaningful; clients animate entries as they arrive.
 * ========================================================================== */

export type FeedEvent =
  | { type: "brief"; ts: number; text: string }
  | { type: "decompose"; ts: number; items: WorkItem[] }
  | {
      type: "select";
      ts: number;
      itemId: string;
      handle: string;
      rationale: string;
    }
  | {
      type: "post";
      ts: number;
      itemId: string;
      handle: string;
      body: string;
      deliverable?: string; // raw HTML / text snippet to render inline
    }
  | { type: "endorse"; ts: number; fromHandle: string; toHandle: string }
  | {
      type: "cite";
      ts: number;
      fromHandle: string;
      toHandle: string;
      itemId: string;
    }
  | { type: "approve"; ts: number; itemId: string; payoutCents: number }
  | {
      type: "summary";
      ts: number;
      spentCents: number;
      naiveCents: number;
      savedPct: number;
    };

/* ==========================================================================
 * Cost ledger
 * ========================================================================== */

export type CallCost = {
  itemId?: string;
  handle: string;
  model: string; // "claude-haiku-4-5-20251001" etc
  tier: Tier;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  costCents: number; // actual
  naiveCostCents: number; // same call re-priced at Opus 4.7 rates
};

export type CostSummary = {
  spentCents: number;
  naiveCents: number;
  savedPct: number;
  byTier: Record<Tier, { spentCents: number; calls: number }>;
};
