# Handoff — A curated network for agent collaboration

> Hackathon demo, 1–3 days. Working directory: `/Users/davidmanuntag/Github/cursor-hackathon`. Platform name TBD (wordmark uses "Plat" placeholder).

## What this is

A "LinkedIn for agents" demo. The pitch: a curated, ranked, priced network of expert AI agents who can be coordinated to deliver multi-skill projects. Differentiated from [Clustly](https://www.clustly.ai/) (one-way human→agent labor *marketplace*) by being a **peer network** — agents discover each other, sub-contract via a Liaison, build reputation, and cite each other's work in a public feed.

**Money shot:** Sarah Park types *"I need a website to get more customers"* into her personal agent. Two and a half hours later, ten specialists have shipped a complete launch package. Closing frame: the model token cost came in at **$14** vs **$84** if every job had run on Opus 4.7 — **~83% saved**, derived from real synthetic-token math (live runs land near the same number).

## Status snapshot

- ✅ **Day 1** — Foundation, static UI, all 4 pages, locked aesthetic, savings math
- ✅ **Architecture refactor** — 3-tier model (Personal Agent → Liaison → Specialists)
- ✅ **Liaison animation** — 3-phase scout/compare/coordinate animation with side-by-side scorecards, 4 weighted criteria per candidate
- ✅ **Day 2** — Live SDK orchestration: agent runtime, Liaison agent, 3 deep specialists, SSE route handler, run page wired to live events
- ✅ **Polish (this session)** — Criteria primer, taste-judgment demo, Sarah polaroids, paginated Liaison carousel, economic-story cleanup (model spend ≠ specialist fees), commission-based Liaison framing, reveal-gate (loading lingers ~8s, then user clicks "Reveal team" to mount the rest)
- ⏳ **Day 3** — Replay mode (JSONL traces + `/api/run/[id]/replay`), deploy, demo rehearsal

`npm run dev` runs on port 3001 (or 3000 if free). All pages render with seeded data on first paint; live SDK calls progressively replace the feed entries' bodies and the savings totals as they arrive.

## Locked decisions (do not change without asking)

| Decision | Value | Locked because |
|---|---|---|
| Stack | Next.js 16 + Tailwind v4 + `@anthropic-ai/claude-agent-sdk` | Hackathon scope, Cursor-friendly |
| Auth | Onboard Claude subscription (no `ANTHROPIC_API_KEY` in repo) — **demo only** | Avoids secrets; production would use direct Messages API with per-tenant keys |
| Aesthetic | **Newsreader** serif accents (~6 spots) + **DM Sans** body + **JetBrains Mono** labels | Locked palette + type system |
| Palette | Paper `#f7f4ec`, ink `#161512`, teal `#0e6856`, oxblood `#7c2d12`, ochre `#8a5a16` | Exact hex values committed in `:root` |
| Strikethrough gesture | `~~$84~~ $14` with -3deg oxblood line | "The brand" — reused anywhere a saving is shown |
| Demo scenario | Sarah's Bakery, 10 specialists | Forces specialization; relatable; visible artifact |
| Build split | Wide directory (~26 profiles) + 3 deep specialists + 7 canned | Best demo realism per hour |
| Tier mix on this brief | 3 Opus / 5 Sonnet / 2 Haiku | Produces ~80% saved structurally |
| User model | Agents primary, humans secondary | "Main users are agents and some person users" |
| 3-tier flow | Personal Agent (off-platform) → Liaison (on-platform) → Specialists | Personal agent enriches; Liaison coordinates the network |
| Liaison's 4 criteria | Skill match · Quality · Cost-fit · Tier-fit (weights 30/25/25/20) | Brief-aware weights are part of the Liaison's value |
| **Economic story** | Hero / SavingsCard / CompareCard show **model token cost only**. Specialist fees show on `/network` + `/expert/[handle]` + landing-page featured grid, NOT on the run page LiaisonCarousel rows. | Two kinds of dollars on the same page (rate vs token cost) reconciled too loudly — moved fees off the run page so every dollar on it adds up to the hero number. |
| **Liaison fee model** | "Commission · % of team spend" everywhere (intake, profile, network). Never a flat `$22`. | Carter is paid as a fraction of total spend, not a flat fee per brief. |
| **Decomposition order** | brand-strategy → ui-design → marketing-strategy → copywriting → backend → social-calendar → legal → accounting → hr → bizdev | Dependency order: brand first, design second, marketing third (uses brand voice for the launch arc), then copy + everything else. |
| **Team-assembly reveal gate** | Phase animation (Scout · Compare · Coordinate · Team assembled) takes ~8s to play. A "Reveal team" pill button fades in at ~8s and gently pulses. Clicking it mounts CriteriaPrimer + TasteSelection + LiaisonCarousel — they don't exist in the DOM until the user opts in. | Demo pacing: the loading state needs room to breathe, and the viewer should control when to advance to the team detail. The gate also lets a stage presenter narrate the loading before revealing the comparison work. |

## The 3-tier model

```
1. User says (informal):
   "I need a website to get more customers."

2. Personal Agent enriches (off-platform, from accumulated memory):
   "Sarah's opening a Brooklyn bakery in 8 weeks. Tight budget. Prefers warm/editorial.
    Has the lease. Hasn't picked a brand voice yet. Will need legal/accounting/HR setup..."

3. Personal Agent → hands enriched brief to a Liaison on the platform.

4. Liaison reads the brief, queries the network, picks the team (10 work items decomposed,
   2-3 candidates surfaced per role, one selected per item with explicit tier rationale).

5. Specialists execute. Liaison watches and stitches.
```

| Agent | Knows | Lives | Demo entity |
|---|---|---|---|
| **Personal Agent** | The user (memory, taste, history) | Off-platform | Sarah's onboard Claude (simulated as a seeded enrichment object + two polaroid photos of Sarah) |
| **Liaison** | The network (who's good, what tier, pricing) | On-platform | Carter Network Concierge (Sonnet, 4.91★, commission-based) |
| **Specialist** | A single domain | On-platform | Maya Designs, LegalKit Pro, etc. |

## File structure (current state)

```
cursor-hackathon/
├── app/
│   ├── layout.tsx                          # Newsreader / DM Sans / JetBrains Mono fonts
│   ├── globals.css                         # Palette, type system, ALL animation keyframes
│   ├── page.tsx                            # Landing — hero + raw-request aside + featured experts
│   ├── run/[id]/page.tsx                   # The money shot — client component, SSE-driven
│   ├── network/page.tsx                    # Directory grouped by role
│   ├── expert/[handle]/page.tsx            # Per-expert profile
│   └── api/
│       └── run/
│           ├── route.ts                    # POST kickoff
│           └── [id]/stream/route.ts        # GET SSE stream
│
├── components/
│   ├── Masthead.tsx
│   ├── Kicker.tsx
│   ├── HeadlineHero.tsx
│   ├── SavingsCard.tsx                     # Top label = "MODEL SPEND · Sarah's Bakery"
│   ├── CompareCard.tsx
│   ├── AgentCard.tsx                       # role==="Liaison" branch shows "Commission" not "$22"
│   ├── FeedEntry.tsx                       # Sanitized deliverable HTML
│   ├── PullQuote.tsx
│   ├── IntakeFlow.tsx                      # 3-step intake. Step 2 includes Sarah polaroids.
│   ├── CriteriaPrimer.tsx                  # 4 cards explaining each criterion + mini-visuals
│   ├── TasteSelection.tsx                  # 3 landing-page mockups, considered one-by-one
│   ├── LiaisonCarousel.tsx                 # Manual-advance carousel (one row at a time)
│   └── LiaisonPanel.tsx                    # Renders one or many work-item rows (no $ on cards)
│
├── lib/
│   ├── types.ts                            # Tier, Expert, WorkItem, FeedEvent, EnrichedBrief, ...
│   ├── cost.ts                             # Per-tier pricing, priceCall, summarize, formatters
│   ├── scoring.ts                          # Hand-tuned scores + brief-aware weights
│   ├── demo-state.ts                       # Static demo state (initial render seed)
│   ├── agent-runtime.ts                    # SDK wrapper · tier→model · cache-boundary prompt
│   ├── orchestrator.ts                     # The Liaison loop · structured rationale · dispatch
│   ├── run-engine.ts                       # In-memory run sessions w/ subscribers
│   ├── specialists/
│   │   ├── ui-designer.ts                  # Maya Designs · Opus · live SDK
│   │   ├── copywriter.ts                   # Wordsmith Studio · Opus · live SDK
│   │   └── marketing.ts                    # Marketing Magpies · Sonnet · live SDK
│   └── seed/
│       ├── experts.ts                      # 26 experts (10 roles + 2 Liaisons + extras)
│       ├── scenario.ts                     # Brief + DECOMPOSITION (reordered: brand → design → marketing → ...)
│       └── canned-content.ts               # 10 specialist deliverables (3 used by deep loops only on failure)
│
├── public/
│   ├── mockups/                            # Three landing-page mockups (TasteSelection)
│   │   ├── mockup-traditional.png          # "Freshly Baked Every Morning" — beige, generic
│   │   ├── mockup-modern.png               # "Life is sweeter" — pink, conversion-y
│   │   └── mockup-winner.png               # "Baked Beautifully" — dark editorial, SELECTED
│   └── sarah/                              # Polaroids for IntakeFlow Step 2
│       ├── sarah-bakery.png                # Sarah arranging croissants ("baking famous croissants")
│       └── sarah-storefront.png            # Sarah at her storefront ("storefront · driggs ave")
│
├── scripts/
│   └── orchestrator-smoke.mjs              # CLI: LIAISON_MOCK=1 npx tsx scripts/orchestrator-smoke.mjs
│
├── .claude/launch.json                     # Preview MCP launch config (bash -c "LIAISON_MOCK=1 npm run dev")
├── HANDOFF.md                              # This file
├── AGENTS.md                               # Project instructions (read Next docs before writing code)
├── CLAUDE.md                               # → @AGENTS.md
├── package.json
├── next.config.ts
└── tsconfig.json
```

**Not yet created (Day 3):**
- `lib/replay.ts` — JSONL trace writer
- `app/api/run/[id]/replay/route.ts` — SSE replay from trace
- `traces/` — gitignored directory for replay JSONL files

## How to run locally

```bash
cd /Users/davidmanuntag/Github/cursor-hackathon
npm install
npm run dev                                   # localhost:3001 (or 3000 if free)
# Or, to skip the live Liaison rationale call (saves a Sonnet call per page reload):
LIAISON_MOCK=1 npm run dev
```

Pages to visit:
- `/` — Landing
- `/run/sarah-bakery-001` — The money shot (hard-refresh to replay all animations)
- `/network` — Directory
- `/expert/carter-network-concierge` — Liaison profile

Verification:
- All 4 routes return 200
- TypeScript: `npx tsc --noEmit` (no output = pass)
- Production build: `npx next build` (cleanly builds; 33 static pages, two `ƒ Dynamic` API routes)
- Smoke test: `LIAISON_MOCK=1 npx tsx scripts/orchestrator-smoke.mjs` — produces 41 events, ends with `spent=$14.17 naive=$84.27 saved=83.2%`
- Money shot: page shows `$14` spent, `$84` naive, **~83% saved**

## The run page in detail

The page is a **Client Component** (`'use client'` + `use(params)` for Next 16 async params).

1. Server-renders with curated `computeStaticDemoState()` for instant FCP
2. On mount, opens `EventSource` against `/api/run/[id]/stream`
3. `decompose` event → overlays live rationale text on each work item
4. Each `post` event → replaces matching `FeedEntry` body/deliverable; triggers `.entry-live-flash` teal pulse
5. Terminal `summary` event → swaps Hero + SavingsCard numbers to the live ledger
6. Each section has its own animation choreography (see globals.css)

Section order on the run page:

| # | Section | Component |
|---|---|---|
| 1 | Masthead + kicker | `Masthead`, `Kicker` |
| 2 | Hero + SavingsCard | `HeadlineHero` + `SavingsCard` (live-updating) |
| 3 | Intake flow (3 steps; Step 2 has Sarah polaroids; Step 3 has Carter w/ commission framing) | `IntakeFlow` |
| 4 | "How the Liaison thinks" — Scout / Compare / Coordinate phase track (~7.4s) + status label | inline |
| 4a | **Reveal gate** — "Reveal team" pill button fades in at ~8s, content below mounts only on click | inline + `revealed` useState |
| 5 | 4-card criteria primer (mounts after reveal) | `CriteriaPrimer` |
| 6 | Taste: three mockups considered one-by-one (mounts after reveal) | `TasteSelection` (3s/card, ~10s total) |
| 7 | LiaisonCarousel — manual one-decision-at-a-time (mounts after reveal) | `LiaisonCarousel` + `LiaisonPanel` |
| 8 | Economics of routing (naive vs smart token costs) | `CompareCard` × 2 |
| 9 | The Feed (live entries replace canned) | `FeedEntry` × 10 |
| 10 | Pull quote + stats | `PullQuote` + `Stat` |

## Hand-tuned data — do not regenerate

`lib/scoring.ts` contains hand-authored scores for 26 (workItem, candidate) tuples × 4 criteria. The selected candidate wins each row by a meaningful margin. **Do not algorithmically regenerate.**

For Sarah's brief: weights are 30 / 25 / 25 / 20 (skill / quality / cost-fit / tier-fit). Brief-aware weights are part of the Liaison's value.

The Liaison's *structured-output call* on each run only generates the **rationale strings** — selectedHandle and candidateHandles stay seeded.

## What stays, what changes

**Stays (do not modify without asking):**
- Aesthetic system (palette, typography, strikethrough gesture)
- 3-tier user model (Personal Agent → Liaison → Specialists)
- 4-criterion scoring with brief-aware weights
- Hand-authored scores in `lib/scoring.ts`
- Hand-authored canned content in `lib/seed/canned-content.ts`
- Hand-authored decomposition in `lib/seed/scenario.ts` (order is now load-bearing: brand → design → marketing → ...)
- Animation timing across CriteriaPrimer, TasteSelection (3s/card), LiaisonCarousel, polaroids, phase animation (~7.4s), reveal-gate fade-in (8.0s) + button pulse (9.0s)
- The reveal-gate flow: phase animation must finish breathing before the button appears, and the team-assembly content (CriteriaPrimer + TasteSelection + LiaisonCarousel) must stay un-mounted until the user clicks
- The economic-story decision: model token spend everywhere on the run page; specialist fees only on marketplace surfaces; Liaison shown as commission-based

**Open for change:**
- Day 3 replay mode plumbing
- Additional polish, copy tweaks, motion refinements
- Adding more specialists or roles to the directory (don't disturb the decomposition for Sarah)

## Risks to watch

| Risk | Mitigation |
|---|---|
| Live SDK call fails on stage | Replay mode (Day 3) — the demo defaults to playing back a recorded trace; live mode is opt-in |
| Token cost in dev gets expensive | `LIAISON_MOCK=1` env gate for the rationale call; aggressive prompt caching for deep specialists |
| Vercel deploy can't read local Claude creds (subscription auth) | Hosted version ships in replay-only mode; live runs are local-only. **Documented.** |
| Hand-authored data drifts from animations | One source of truth: `lib/seed/scenario.ts` for selections, `lib/scoring.ts` for scores |
| `.next/` Turbopack cache serves stale CSS | Symptom: edits to `globals.css` not reflected in browser even after reload. Remedy: `rm -rf .next/` and restart `npm run dev`. Hit during this session; flagged so you don't lose time to it. |
| Module-level `SESSIONS` Map in `lib/run-engine.ts` never evicts | Add TTL sweep before deploy. Fine for single-tab demo. |

## Demo controls cheatsheet

| Action | Effect |
|---|---|
| Hard refresh `/run/sarah-bakery-001` | Resets everything. Phase animation plays for ~8s, then reveal gate appears. |
| Click `Reveal team →` | Mounts CriteriaPrimer + TasteSelection + LiaisonCarousel. All their entrance animations start fresh. |
| Click a numbered dot under LiaisonCarousel | Jumps to that decision; replays bar-fill / total / winner-ring animation |
| `← / →` keyboard arrows | Prev / next decision (only after reveal; focus-safe — won't fire while typing in inputs) |
| `LIAISON_MOCK=1 npm run dev` | Skip the live Liaison rationale call. Deep specialists still run live. |

**Stage demo arc (60s):**

1. **0–8s** — Page loads, hero + savings up top, intake plays through (raw → enriched → liaison handoff). Phase track at the bottom of view animates Scout → Compare → Coordinate → "Team assembled."
2. **~8s** — *Reveal team* button fades in, pulsing. Presenter narrates: *"The Liaison has assembled the team — let's see how it picked."*
3. **Click** — CriteriaPrimer cards stagger in, then TasteSelection plays its 3-second-per-mockup taste arc, then LiaisonCarousel mounts on Decision 1 (brand-strategy).
4. **Walk the carousel** — Click through the dots or use ← / → to surface each decision in turn. Each row's bar-fill / total / winner-ring animation replays per navigation.
5. **Scroll to feed / savings** — Hero number reconciles to live spend, feed shows specialist deliverables.

## Pointers

- Detailed plan (frozen as of Day 1): `~/.claude/plans/making-a-linkedin-for-ethereal-karp.md`
- Aesthetic mockups (visual reference): `.superpowers/brainstorm/*/content/aesthetic-locked.html`

---

# Continuation prompt — paste into a new Claude session

```
I'm continuing work on a "LinkedIn for agents" hackathon demo at
/Users/davidmanuntag/Github/cursor-hackathon. Day 2 (live SDK orchestration)
is complete; a lot of run-page polish is also done including a reveal-gate
that pauses the page mid-load to let the viewer choose when to advance.
Day 3 (replay mode + deploy + demo rehearsal) is pending.

Before doing anything, please:

1. Read /Users/davidmanuntag/Github/cursor-hackathon/HANDOFF.md end-to-end —
   that's the full project status, locked decisions, file map, and what stays
   vs what's open for change.
2. (Optional, for deep context) ~/.claude/plans/making-a-linkedin-for-ethereal-karp.md
   has the original spec. HANDOFF.md supersedes it where they disagree.
3. Run `LIAISON_MOCK=1 npm run dev` (already in launch.json) and visit
   http://localhost:3001/run/sarah-bakery-001 — hard-refresh to replay
   everything. Sanity-check the full demo arc:

      • Hero shows "$14 vs $84" with ~83% saved
      • IntakeFlow Step 2 shows the two Sarah polaroids (tilted, captioned)
      • Phase animation runs ~8s; "Team assembled — 10 specialists hired"
        appears, then the "Reveal team →" pill button fades in and pulses
      • Click the button → CriteriaPrimer + TasteSelection + LiaisonCarousel
        mount; CriteriaPrimer cards stagger in; TasteSelection considers
        the 3 mockups one-by-one over ~10s; LiaisonCarousel starts on
        Decision 1 (brand-strategy)
      • Click carousel dots / use ← → keys to advance through the 10
        decisions; each row replays its bar-fill + total + winner-ring
        animation

What's pending (rough priority):

A. Replay mode (~2h)
   - lib/replay.ts: append every FeedEvent to traces/<runId>.jsonl during
     live runs
   - app/api/run/[id]/replay/route.ts: SSE stream that re-plays a trace
     with the same inter-event timing
   - Stage demo defaults to ?replay=true. Live mode is opt-in.
   - traces/ is already gitignored.

B. Vercel deploy (~1h)
   - Replay-only on Vercel (no local Claude creds in serverless)
   - Smoke-test all four routes at the deploy URL

C. Demo rehearsal (~1h)
   - Walk the 60-second arc documented in HANDOFF.md's "Stage demo arc"
     section
   - Record one blessed trace; verify replay reproduces it deterministically

D. Optional polish
   - Per-item "currently working…" indicator in the feed between `select`
     and `post` events (small touch, ~15min)
   - TTL sweep on lib/run-engine.ts SESSIONS map before deploy

Constraints (locked — do not change without asking):

- Aesthetic system (Newsreader / DM Sans / JetBrains Mono; paper/ink/teal/oxblood)
- 3-tier model (Personal Agent → Liaison → Specialists)
- Economic story: model token cost only on the run page; specialist fees on
  marketplace surfaces (/network, /expert/[handle], landing); Liaison shown
  as commission-based. The current decomposition order (brand → design →
  marketing → copy → ...) is load-bearing for the LiaisonCarousel and the
  feed.
- Reveal-gate flow: the phase animation must breathe for ~8s before the
  button appears, and the team-assembly content must stay un-mounted in the
  DOM until the user clicks "Reveal team" — don't let any well-meaning
  refactor turn the gate into a CSS-toggle (we want fresh mounts so the
  child animations replay).
- Hand-tuned data in lib/scoring.ts, lib/seed/scenario.ts, lib/seed/canned-content.ts
- The strikethrough gesture and savings number framing
- No Anthropic API key in the repo; auth is the operator's Claude subscription

Heads-up on the dev env:
- Next 16 + Turbopack has a disk-cache flake where edits to app/globals.css
  sometimes aren't picked up even after reload. If you see stale CSS, run
  `rm -rf .next/` and restart npm run dev.
- The Claude Preview MCP works against port 3001 if .claude/launch.json is
  used. preview_start auto-launches with LIAISON_MOCK=1.
- Don't programmatically scroll near the .reveal-btn during verification
  with the preview MCP — `scrollIntoView` calls near it can phantom-click
  the button and flip the gate to revealed. Click .reveal-btn explicitly if
  you want to test the post-reveal state; reload to test the pre-reveal
  state without any other interaction.

Stop and ask before:
- Adding any external service (DB, auth provider, analytics)
- Changing the aesthetic system, tier mix, scoring weights, or decomposition order
- Removing or renaming the existing components/pages
- Re-introducing specialist fees onto the run page
- Replacing the reveal-gate with anything auto-advancing
- Anything that would require an Anthropic API key in the repo

Start with HANDOFF.md, sanity-check the running app, then propose a Day 3
sequence with time estimates. Begin with task A (replay mode) unless I
redirect.
```
