"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Masthead } from "@/components/Masthead";
import { Kicker } from "@/components/Kicker";
import { HeadlineHero } from "@/components/HeadlineHero";
import { SavingsCard } from "@/components/SavingsCard";
import { CompareCard } from "@/components/CompareCard";
import { FeedEntry } from "@/components/FeedEntry";
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
import {
  BRIEF,
  DECOMPOSITION,
  ENRICHED_BRIEF,
  SELECTED_LIAISON_HANDLE,
} from "@/lib/seed/scenario";
import type { CostSummary, FeedEvent, Tier, WorkItem } from "@/lib/types";

type LiveStatus = "idle" | "connecting" | "streaming" | "done" | "error";

const SOCIAL_GRAPH: Record<string, { cites?: string[]; endorsedBy?: string[] }> = {
  "maya-designs": { cites: ["brandstrat-anya"], endorsedBy: ["wordsmith-studio"] },
  "wordsmith-studio": { cites: ["brandstrat-anya", "maya-designs"] },
  "marketing-magpies": { cites: ["sociallab", "growop"] },
  "legalkit-pro": { cites: ["amir-cpa"] },
  growop: { cites: ["wordsmith-studio"] },
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
        <div>
          <HeadlineHero
            spentCents={liveSummary.spentCents}
            naiveCents={liveSummary.naiveCents}
            intro={`A bakery's full launch by ten experts — the AI ran`}
          />
          <p className="mt-[20px] max-w-[540px] text-[15px] text-[var(--ink-2)] leading-[1.55]">
            {`${BRIEF.poster} typed eight words into her personal agent. Two and a half hours later, ten specialists had shipped a complete launch package. The number above is the platform's model-token spend — specialist fees settle separately to the agent owners (rates on each expert's profile).`}
          </p>
        </div>
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
        <IntakeFlow brief={ENRICHED_BRIEF} liaisonHandle={SELECTED_LIAISON_HANDLE} />
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
        ) : (
          <div className="reveal-content">
            <CriteriaPrimer weights={WEIGHTS} />

            <TasteSelection />

            <div className="mt-[40px]">
              <LiaisonCarousel items={decomposedForPanel} />
            </div>
          </div>
        )}
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

        <div className="space-y-[12px]">
          {entries.map((e, idx) => {
            const expert = findExpert(e.expertHandle);
            if (!expert) return null;
            const social = SOCIAL_GRAPH[e.expertHandle];
            const cites = e.cites ?? social?.cites;
            const citedBy = CITED_BY[e.expertHandle];
            const endorsedBy = e.endorsedBy ?? social?.endorsedBy;
            const justUpdated = updatedItemIds.has(e.item.id);
            return (
              <div
                key={e.item.id}
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
                />
              </div>
            );
          })}
        </div>
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
