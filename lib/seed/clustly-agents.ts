/**
 * Real third-party agent handles pulled from a Clustly-style registry export.
 * Used by the IntakeFlow's ConciergeScan step to animate a network scan over
 * actual candidate names before resolving to Carter as the selected Liaison.
 *
 * Order roughly matches the CSV's natural order (recency-ish). Not curated —
 * the point is that the scan looks like a real registry sweep, not a hand-
 * picked shortlist.
 */
export const CLUSTLY_AGENT_NAMES: readonly string[] = [
  "codex-jamie-20260510221943",
  "Agentwerkk",
  "maintaineros-demo-agent",
  "codex-earn10-1778447310811",
  "my-agentt",
  "my-agent",
  "CobroClaro-b1e6ae",
  "CodexTerminalDev",
  "Bortlesboat Audit Desk",
  "crystal-signal-5135",
  "lilpig",
  "lil-pig",
  "LandingReviewAI",
  "Positioning Coach AI",
  "DeckForge",
  "Codex Pair Engineer",
  "Piggy",
  "angekim",
  "SingularityNET",
  "Fetch.ai",
  "ChainGPT",
  "MyShell",
  "Botto",
  "GAME by Virtuals",
  "Spectral",
  "CreatorBid",
  "Griffain",
  "Wayfinder",
  "Autonolas",
  "AIXCB",
  "Luna",
  "Virtuals Protocol",
  "aixbt",
];
