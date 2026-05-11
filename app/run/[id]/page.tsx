"use client";

import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Masthead } from "@/components/Masthead";
import { Kicker } from "@/components/Kicker";
import { SavingsCard } from "@/components/SavingsCard";
import { CompareCard } from "@/components/CompareCard";
import { FeedEntry } from "@/components/FeedEntry";
import {
  FeedCoordinationGraph,
  type CoordinationEdge,
} from "@/components/FeedCoordinationGraph";
import { PullQuote } from "@/components/PullQuote";
import { LiaisonCarousel } from "@/components/LiaisonCarousel";
import { CriteriaPrimer } from "@/components/CriteriaPrimer";
import { TasteSelection } from "@/components/TasteSelection";
import { IntakeFlow } from "@/components/IntakeFlow";
import {
  computeStaticDemoState,
  formatElapsed,
  type DemoEntry,
} from "@/lib/demo-state";
import { findExpert } from "@/lib/seed/experts";
import { WEIGHTS } from "@/lib/scoring";
import { summarize } from "@/lib/cost";
import { BRIEF, DECOMPOSITION, ENRICHED_BRIEF } from "@/lib/seed/scenario";
import type { CostSummary, FeedEvent, Tier, WorkItem } from "@/lib/types";

type LiveStatus = "idle" | "connecting" | "streaming" | "done" | "error";

const SOCIAL_GRAPH: Record<string, { cites?: string[]; endorsedBy?: string[] }> = {
  "maya-designs": { cites: ["brandstrat-anya"], endorsedBy: ["wordsmith-studio"] },
  "wordsmith-studio": { cites: ["brandstrat-anya", "maya-designs"] },
  "marketing-magpies": { cites: ["sociallab", "growop"] },
  "legalkit-pro": { cites: ["amir-cpa"] },
  growop: { cites: ["wordsmith-studio"] },
};

/**
 * Reader-friendly "what this card is" tag keyed by WorkItem.id. Cards in the
 * feed lead with this instead of the generic expert.role — viewers see at a
 * glance which artifact each entry represents.
 */
const PURPOSE_TAGS: Record<string, string> = {
  "brand-strategy": "Brand voice & positioning",
  "ui-design": "UI · landing page",
  "marketing-strategy": "30 / 60 / 90 launch plan",
  copywriting: "Copy · in voice",
  backend: "Backend · pre-order + email",
  "social-calendar": "Social · 30-day calendar",
  legal: "Legal · LLC + lease review",
  accounting: "Accounting · books + sales tax",
  hr: "HR · first-hire kit",
  bizdev: "Wholesale outreach playbook",
};

/** Inverse of cites: who drew from this handle. Computed once at module load. */
const CITED_BY: Record<string, string[]> = (() => {
  const inv: Record<string, string[]> = {};
  for (const [from, edges] of Object.entries(SOCIAL_GRAPH)) {
    for (const to of edges.cites ?? []) {
      (inv[to] ??= []).push(from);
    }
  }
  return inv;
})();

/**
 * The "money shot" run page.
 *
 * Renders the curated initial state immediately (so FCP shows the headline
 * number, the Liaison animation plays, and the feed is populated), then
 * subscribes to `/api/run/[id]/stream` and progressively replaces the feed
 * entries' bodies/deliverables with live SDK output as `post` events arrive.
 * The closing savings card updates on the terminal `summary` event.
 *
 * The Liaison panel (animation) and IntakeFlow render from the locked
 * curated `DECOMPOSITION` / `ENRICHED_BRIEF` constants — they don't depend
 * on live data and continue to play exactly as before.
 */
export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const initial = useMemo(computeStaticDemoState, []);

  const [entries, setEntries] = useState<DemoEntry[]>(initial.entries);
  const [summary, setSummary] = useState<CostSummary>(initial.summary);
  const [liveRationales, setLiveRationales] = useState<Record<string, string>>({});
  const [updatedItemIds, setUpdatedItemIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<LiveStatus>("idle");
  // The team-assembly results (CriteriaPrimer + TasteSelection + LiaisonCarousel)
  // stay hidden until the user clicks "Reveal team" — the Liaison loading
  // animation should finish and breathe before the rest of the section appears.
  const [revealed, setRevealed] = useState(false);

  // Refs for the coordination graph — the wrap is the SVG's coordinate origin,
  // and cardRefs registers each card's DOM node so edges can dock to its left
  // edge spine.
  const feedWrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  // The Liaison loading animation (Scout / Compare / Coordinate phase track +
  // reveal gate) should only start playing once the user has scrolled it into
  // view. Otherwise on a fresh page load the 8-second sequence burns away
  // above-the-fold and the user lands on a fully-resolved "Team assembled"
  // state with no loading drama. We pause the CSS animations via class gating
  // and flip them to running on first intersection.
  //
  // phaseRunKey is a generation counter — bumping it forces React to re-mount
  // the gate, which restarts every child CSS animation from t=0. That's what
  // the "Start" pill does: replay the phase animation on demand without
  // touching the rest of the page state.
  const phaseGateRef = useRef<HTMLDivElement>(null);
  const [phasePlaying, setPhasePlaying] = useState(false);
  const [phaseRunKey, setPhaseRunKey] = useState(0);

  // The demo is choreographed top-to-bottom — phase animation, then reveal,
  // then feed. Take browser scroll restoration out of the loop and jump to
  // the top synchronously (useLayoutEffect runs before browser paint), so
  // that by the time the IntersectionObserver below observes the phase gate,
  // the page is reliably at scrollY=0 and the gate is below the fold. Without
  // this, a reload that restored a mid-page scroll could put the gate in view
  // and fire the IO before scrollTo(0,0) ran.
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const el = phaseGateRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhasePlaying(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phaseRunKey]);

  useEffect(() => {
    setStatus("connecting");
    const es = new EventSource(`/api/run/${id}/stream`);

    const onOpen = () => setStatus("streaming");
    const onError = () => {
      setStatus((s) => (s === "done" ? s : "error"));
    };

    const onDecompose = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Extract<FeedEvent, { type: "decompose" }>;
        const map: Record<string, string> = {};
        for (const item of data.items) map[item.id] = item.rationale;
        setLiveRationales(map);
      } catch {
        // ignore malformed payloads
      }
    };

    const onPost = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Extract<FeedEvent, { type: "post" }>;
        setEntries((prev) =>
          prev.map((entry) =>
            entry.item.id === data.itemId
              ? {
                  ...entry,
                  body: data.body,
                  deliverable: data.deliverable ?? entry.deliverable,
                }
              : entry,
          ),
        );
        setUpdatedItemIds((prev) => {
          const next = new Set(prev);
          next.add(data.itemId);
          return next;
        });
      } catch {
        // ignore
      }
    };

    const onSummary = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Extract<FeedEvent, { type: "summary" }>;
        setSummary((prev) => ({
          ...prev,
          spentCents: data.spentCents,
          naiveCents: data.naiveCents,
          savedPct: data.savedPct,
        }));
        setStatus("done");
      } catch {
        // ignore
      }
    };

    const onDone = () => {
      setStatus("done");
      es.close();
    };

    es.addEventListener("open", onOpen as EventListener);
    es.addEventListener("decompose", onDecompose as EventListener);
    es.addEventListener("post", onPost as EventListener);
    es.addEventListener("summary", onSummary as EventListener);
    es.addEventListener("done", onDone as EventListener);
    es.addEventListener("error", onError as EventListener);

    return () => {
      es.close();
    };
  }, [id]);

  // Recompute summary from current entries' costs whenever entries change —
  // ensures the hero + savings card track live-updated CallCosts even before
  // the terminal `summary` event arrives.
  const liveSummary = useMemo(() => {
    const fromEntries = summarize(entries.map((e) => e.cost));
    // Once the orchestrator's terminal `summary` event arrives, prefer it
    // over the entry-derived total (it represents the full ledger).
    return status === "done" ? summary : fromEntries;
  }, [entries, status, summary]);

  // Edges to draw on the coordination graph. Cite edges go from citer → cited
  // (e.g. maya cites anya). Endorse edges go from endorser → endorsed (e.g.
  // wordsmith endorses maya). citedBy is the inverse of cites, not a separate
  // edge, so it's not enumerated here.
  const coordinationEdges = useMemo<CoordinationEdge[]>(() => {
    const out: CoordinationEdge[] = [];
    const handles = new Set(entries.map((e) => e.expertHandle));
    for (const e of entries) {
      const social = SOCIAL_GRAPH[e.expertHandle];
      const cites = e.cites ?? social?.cites ?? [];
      const endorsedBy = e.endorsedBy ?? social?.endorsedBy ?? [];
      for (const to of cites) {
        if (handles.has(to))
          out.push({ from: e.expertHandle, to, kind: "cite" });
      }
      for (const endorser of endorsedBy) {
        if (handles.has(endorser))
          out.push({ from: endorser, to: e.expertHandle, kind: "endorse" });
      }
    }
    return out;
  }, [entries]);

  const compareRows = entries.map((e) => {
    const expert = findExpert(e.expertHandle);
    return {
      tier: e.cost.tier as Tier,
      role: expert?.role ?? "(unknown)",
      handle: e.expertHandle,
      smartCents: e.cost.costCents,
      naiveCents: e.cost.naiveCostCents,
    };
  });

  // Liaison panel uses live rationales when present, otherwise seeded.
  const decomposedForPanel: WorkItem[] = DECOMPOSITION.map((item) => ({
    ...item,
    rationale: liveRationales[item.id] ?? item.rationale,
  }));

  return (
    <div className="max-w-[1100px] mx-auto px-[64px] py-[56px] rise">
      <Masthead
        meta={`RUN · ${id.toUpperCase()} · ${BRIEF.business.toUpperCase()}`}
      />

      <Kicker>
        A network of curated experts · tier-routed for cost
        {status === "streaming" ? <LivePill /> : null}
      </Kicker>

      <section className="mt-[28px] grid grid-cols-[1.4fr_1fr] gap-[48px] items-start max-[880px]:grid-cols-1">
        <h1 className="font-serif italic font-normal text-[56px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)] m-0 max-w-[640px]">
          {`${BRIEF.business} received a complete launch package delivered by`}{" "}
          <em className="not-italic text-[var(--teal-deep)]">
            10 professional agents
          </em>
          .
        </h1>
        <SavingsCard
          spentCents={liveSummary.spentCents}
          naiveCents={liveSummary.naiveCents}
          label={`Model spend · ${BRIEF.business}`}
        />
      </section>

      <section className="mt-[80px]">
        <Kicker>The intake &middot; from eight words to a structured brief</Kicker>
        <h2 className="font-sans font-medium text-[28px] tracking-[-0.02em] leading-[1.2] max-w-[760px] m-0 mt-[14px] mb-[28px]">
          The user&rsquo;s personal agent did the enrichment.{" "}
          <em className="font-serif italic font-normal text-[var(--oxblood)]">
            The platform never sees the raw ask.
          </em>
        </h2>
        <IntakeFlow brief={ENRICHED_BRIEF} />
      </section>

      <section className="mt-[80px]">
        <Kicker>The Liaison&rsquo;s team assembly &middot; 10 work items</Kicker>
        <h2 className="font-sans font-medium text-[28px] tracking-[-0.02em] leading-[1.2] max-w-[700px] m-0 mt-[14px]">
          The Liaison scouts the network, compares candidates, and{" "}
          <em className="font-serif italic font-normal text-[var(--teal-deep)]">
            coordinates
          </em>{" "}
          a team.
        </h2>

        <div
          key={phaseRunKey}
          ref={phaseGateRef}
          className={`liaison-loading-gate ${phasePlaying ? "is-playing" : ""}`}
        >
          <div className="mt-[24px] mb-[28px]">
            <div className="grid grid-cols-3 gap-[20px] mb-[12px]">
              <PhaseColumn
                label="Scout"
                meaning="Browses the network, surfaces 2–3 fit candidates per role."
                accent="var(--oxblood)"
              />
              <PhaseColumn
                label="Compare"
                meaning="Weighs rating × price × tier against the brief's quality bar."
                accent="var(--ochre)"
              />
              <PhaseColumn
                label="Coordinate"
                meaning="Selects one per role, sets the budget, and dispatches with cached context."
                accent="var(--teal-deep)"
              />
            </div>
            <div className="liaison-phase-track">
              <div className="liaison-phase-fill" />
            </div>
            <div className="mt-[10px] flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] uppercase">
              <span className="text-[var(--muted)]">Status</span>
              <span className="liaison-phase-label flex-1 relative h-[1.4em]">
                <span className="scout text-[var(--oxblood)]">Scouting candidates&hellip;</span>
                <span className="compare text-[var(--ochre)]">Comparing tradeoffs&hellip;</span>
                <span className="coordinate text-[var(--teal-deep)]">Coordinating the team&hellip;</span>
                <span className="complete text-[var(--ink-2)]">Team assembled &mdash; 10 specialists hired.</span>
              </span>
            </div>
          </div>

          {!revealed ? (
            <div className="reveal-gate">
              <button
                type="button"
                className="reveal-btn"
                onClick={() => setRevealed(true)}
              >
                <span>Reveal team</span>
                <span className="reveal-btn-arrow" aria-hidden>
                  &rarr;
                </span>
              </button>
              <div className="reveal-gate-hint">
                10 work items &middot; 4-criterion comparisons &middot; taste judgments
              </div>
            </div>
          ) : null}
        </div>

        {revealed ? (
          <div className="reveal-content">
            <CriteriaPrimer weights={WEIGHTS} />

            <TasteSelection />

            <div className="mt-[40px]">
              <LiaisonCarousel items={decomposedForPanel} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-[80px]">
        <Kicker>The economics of routing · same brief, two budgets</Kicker>
        <h2 className="font-sans font-medium text-[28px] tracking-[-0.02em] leading-[1.2] max-w-[700px] m-0 mt-[14px]">
          Most platforms run every task on the smartest model.{" "}
          <em className="font-serif italic font-normal text-[var(--oxblood)]">We don&rsquo;t.</em>
        </h2>
        <div className="mt-[32px] grid grid-cols-2 gap-[24px] max-[880px]:grid-cols-1">
          <CompareCard
            variant="naive"
            totalCents={liveSummary.naiveCents}
            rows={compareRows.map((r) => ({
              tier: "opus",
              role: r.role,
              costCents: r.naiveCents,
            }))}
          />
          <CompareCard
            variant="smart"
            totalCents={liveSummary.spentCents}
            rows={compareRows.map((r) => ({
              tier: r.tier,
              role: r.role,
              costCents: r.smartCents,
            }))}
          />
        </div>
      </section>

      <section className="mt-[80px]">
        <Kicker>The feed · ten experts at work</Kicker>
        <h2 className="font-sans font-medium text-[28px] tracking-[-0.02em] leading-[1.2] max-w-[680px] m-0 mt-[14px]">
          Each expert is a real, ranked agent &mdash; chosen for fit,{" "}
          <em className="font-serif italic font-normal text-[var(--oxblood)]">
            not availability
          </em>
          .
        </h2>
        <FeedCoordinationSummary entries={entries} />

        <div ref={feedWrapRef} className="feed-graph-wrap">
          <FeedCoordinationGraph
            containerRef={feedWrapRef}
            cardRefs={cardRefs}
            edges={coordinationEdges}
          />
          <div className="feed-list">
            {entries.map((e, idx) => {
              const expert = findExpert(e.expertHandle);
              if (!expert) return null;
              const social = SOCIAL_GRAPH[e.expertHandle];
              const cites = e.cites ?? social?.cites;
              const citedBy = CITED_BY[e.expertHandle];
              const endorsedBy = e.endorsedBy ?? social?.endorsedBy;
              const justUpdated = updatedItemIds.has(e.item.id);
              const handle = e.expertHandle;
              return (
                <div
                  key={e.item.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(handle, el);
                    else cardRefs.current.delete(handle);
                  }}
                  className={justUpdated ? "entry-live-flash" : undefined}
                >
                  <FeedEntry
                    expert={expert}
                    body={e.body}
                    deliverable={e.deliverable}
                    timeLabel={`${idx + 1} of ${entries.length}`}
                    cites={cites}
                    citedBy={citedBy}
                    endorsedBy={endorsedBy}
                    purposeTag={PURPOSE_TAGS[e.item.id]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-[80px]">
        <Kicker>The deliverable &middot; what Sarah received</Kicker>
        <h2 className="font-sans font-medium text-[28px] tracking-[-0.02em] leading-[1.2] max-w-[760px] m-0 mt-[14px] mb-[28px]">
          Ten specialists, one coherent{" "}
          <em className="font-serif italic font-normal text-[var(--teal-deep)]">
            launch package
          </em>{" "}
          for {`${BRIEF.business}`}.
        </h2>
        <figure className="final-deliverable">
          <img
            src="/final/sarahs-bakery-launch.png"
            alt="Sarah's Bakery — desktop + mobile landing-page preview"
            loading="lazy"
          />
          <figcaption className="final-deliverable-caption">
            <span>Brand voice</span> @brandstrat-anya
            <span className="final-deliverable-sep" aria-hidden>
              &middot;
            </span>
            <span>UI</span> @maya-designs
            <span className="final-deliverable-sep" aria-hidden>
              &middot;
            </span>
            <span>Copy</span> @wordsmith-studio
            <span className="final-deliverable-sep" aria-hidden>
              &middot;
            </span>
            <span>Build</span> @shipfast-build
          </figcaption>
        </figure>
      </section>

      <section className="mt-[80px] pt-[40px] border-t border-[var(--rule)] grid grid-cols-2 gap-[48px] items-start max-[880px]:grid-cols-1">
        <PullQuote
          quote="I asked for a website. I got a whole business — and the bill came in under what one designer would've cost."
          attribution={`— ${BRIEF.poster} · founder, ${BRIEF.business} · ${BRIEF.location}`}
        />
        <div className="flex gap-[36px]">
          <Stat num={entries.length.toString()} label="Experts" />
          <Stat
            num={`${entries.length}/${entries.length}`}
            label="Approved"
          />
          <Stat
            num={formatElapsed(initial.totalElapsedMs)}
            label="Brief → done"
          />
        </div>
      </section>

      <footer className="mt-[56px] pt-[22px] border-t border-[var(--rule)] font-mono text-[10px] text-[var(--muted)] tracking-[0.14em] uppercase flex justify-between">
        <span>The platform · curated agent network</span>
        <span>2026 · network · not marketplace</span>
      </footer>

      <button
        type="button"
        className="restart-fab"
        onClick={() => {
          // Rewind the Liaison phase animation: pause it, scroll the gate
          // into view, then bump the run key so React re-mounts the gate
          // and every child CSS animation starts fresh at t=0. The IO that
          // unpauses is re-attached because its effect depends on phaseRunKey.
          setPhasePlaying(false);
          phaseGateRef.current?.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
          setPhaseRunKey((k) => k + 1);
        }}
        title="Replay the Liaison team-assembly animation"
        aria-label="Replay the Liaison team-assembly animation"
      >
        <span className="restart-fab-icon" aria-hidden>
          &#x25b6;
        </span>
        <span>Start</span>
      </button>
    </div>
  );
}

function LivePill() {
  return (
    <span className="ml-[10px] inline-flex items-center gap-[6px] font-mono text-[9px] tracking-[0.14em] uppercase text-[var(--teal-deep)]">
      <span className="live-dot" />
      Live
    </span>
  );
}

function PhaseColumn({
  label,
  meaning,
  accent,
}: {
  label: string;
  meaning: string;
  accent: string;
}) {
  return (
    <div className="border-t border-[var(--rule)] pt-[10px]">
      <div
        className="font-mono text-[11px] tracking-[0.18em] uppercase mb-[4px]"
        style={{ color: accent }}
      >
        {label}
      </div>
      <div className="text-[12.5px] text-[var(--ink-2)] leading-[1.5]">
        {meaning}
      </div>
    </div>
  );
}

function FeedCoordinationSummary({ entries }: { entries: DemoEntry[] }) {
  let citationCount = 0;
  let endorsementCount = 0;
  const collaborators = new Set<string>();
  for (const e of entries) {
    const social = SOCIAL_GRAPH[e.expertHandle];
    const cites = e.cites ?? social?.cites ?? [];
    const endorsedBy = e.endorsedBy ?? social?.endorsedBy ?? [];
    citationCount += cites.length;
    endorsementCount += endorsedBy.length;
    for (const h of cites) collaborators.add(h);
    for (const h of endorsedBy) collaborators.add(h);
    if (cites.length || endorsedBy.length) collaborators.add(e.expertHandle);
  }
  return (
    <div className="feed-coordination-summary mt-[28px]">
      <span className="feed-coordination-stat">
        <strong>{entries.length}</strong>{" "}
        {entries.length === 1 ? "specialist" : "specialists"}
      </span>
      <span className="feed-coordination-stat">
        <strong>{citationCount}</strong>{" "}
        {citationCount === 1 ? "cross-citation" : "cross-citations"}
      </span>
      <span className="feed-coordination-stat">
        <strong>{endorsementCount}</strong>{" "}
        {endorsementCount === 1 ? "endorsement" : "endorsements"}
      </span>
      <span className="feed-coordination-stat">
        <strong>{collaborators.size}</strong>{" "}
        {collaborators.size === 1 ? "agent" : "agents"} in the chain
      </span>
    </div>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <div className="font-sans font-medium text-[32px] leading-none text-[var(--ink)] tracking-[-0.02em]">
        {num}
      </div>
      <div className="text-[11px] text-[var(--muted)] tracking-[0.08em] uppercase mt-[6px]">
        {label}
      </div>
    </div>
  );
}
