import type { WorkItem } from "@/lib/types";
import { findExpert } from "@/lib/seed/experts";
import { CRITERIA, lookupScores, totalScore, WEIGHTS } from "@/lib/scoring";

type Props = {
  items: WorkItem[];
};

const TIER_LABEL: Record<WorkItem["tierUsed"], string> = {
  haiku: "Haiku 4.5",
  sonnet: "Sonnet 4.6",
  opus: "Opus 4.7",
};

/**
 * Side-by-side candidate comparison per work item, with the criteria the
 * Liaison weighs surfaced as horizontal bars. Animations:
 *   - Row fades in (scout phase).
 *   - Candidate cards fan in (compare phase).
 *   - Per-card bars fill left-to-right with criteria stagger.
 *   - Totals tick in.
 *   - Unselected fade; selected gets a teal ring (coordinate phase).
 *   - Rationale appears last with the verdict.
 *
 * All choreography is CSS-only via per-row and per-criterion index variables.
 */
export function LiaisonPanel({ items }: Props) {
  return (
    <div className="space-y-[18px]">
      {items.map((item, rowIdx) => {
        const selected = findExpert(item.selectedHandle);
        const candidates = item.candidateHandles
          .map((h) => findExpert(h))
          .filter((e): e is NonNullable<typeof e> => Boolean(e));

        return (
          <div
            key={item.id}
            className="liaison-row bg-white border border-[var(--rule)] rounded-[10px] p-[18px_22px]"
            style={
              {
                boxShadow: "var(--shadow-sm)",
                "--row-i": rowIdx,
              } as React.CSSProperties
            }
          >
            {/* Row header */}
            <div className="flex items-start justify-between gap-4 mb-[14px]">
              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-[15px] leading-tight tracking-[-0.01em]">
                  {item.description}
                </div>
                <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.06em] mt-[4px] uppercase">
                  Required: {item.requiredSkills.join(" · ")}
                </div>
              </div>
              <span className={`tier-pill tier-${item.tierUsed} shrink-0`}>
                {TIER_LABEL[item.tierUsed]}
              </span>
            </div>

            {/* Side-by-side candidate scorecards */}
            <div
              className={`grid gap-[10px] ${
                candidates.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 md:grid-cols-3"
              }`}
            >
              {candidates.map((expert, candIdx) => {
                const isSelected = expert.handle === item.selectedHandle;
                const scores = lookupScores(item.id, expert.handle);
                const total = scores ? totalScore(scores) : 0;

                return (
                  <div
                    key={expert.handle}
                    className={`relative rounded-[8px] border p-[12px_14px] ${
                      isSelected
                        ? "liaison-candidate-selected border-[var(--teal-deep)] bg-[var(--teal-soft)]/40"
                        : "liaison-candidate-unselected border-[var(--rule)] bg-[var(--paper)]"
                    }`}
                    style={
                      {
                        "--row-i": rowIdx,
                        "--cand-i": candIdx,
                      } as React.CSSProperties
                    }
                  >
                    {/* Card header — name, tier, rating.
                        Specialist fee estimates intentionally live on
                        marketplace surfaces (/network, /expert/[handle]),
                        not here. On the run page everything else is about
                        model token spend, and putting a $38 EST. next to a
                        CompareCard row that says "$3" makes the two
                        unrelated dollar amounts read as comparable. The
                        cost-fit bar + tier pill carry the price signal in
                        the team-assembly context. */}
                    <div className="mb-[3px]">
                      <span
                        className={`font-sans font-semibold text-[13.5px] tracking-[-0.01em] truncate block ${
                          isSelected ? "text-[var(--teal-deep)]" : "text-[var(--ink)]"
                        }`}
                      >
                        {expert.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-[6px] mb-[10px]">
                      <span className={`tier-pill tier-${expert.tier}`}>
                        {TIER_LABEL[expert.tier]}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--muted)] tracking-[0.04em]">
                        ★ {expert.rating.toFixed(2)}
                      </span>
                    </div>

                    {/* Criterion bars */}
                    <div className="space-y-[5px]">
                      {scores
                        ? CRITERIA.map((c, critIdx) => {
                            const v = scores[c.key];
                            return (
                              <div key={c.key} className="grid grid-cols-[78px_1fr_22px] items-center gap-[8px]">
                                <span className="font-mono text-[9.5px] tracking-[0.04em] text-[var(--muted)] uppercase truncate">
                                  {c.label}
                                </span>
                                <div className="bar-track">
                                  <div
                                    className="bar-fill"
                                    style={
                                      {
                                        "--score-pct": `${v}%`,
                                        "--row-i": rowIdx,
                                        "--cand-i": candIdx,
                                        "--crit-i": critIdx,
                                        background: isSelected
                                          ? "var(--teal-deep)"
                                          : "var(--ink-2)",
                                      } as React.CSSProperties
                                    }
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-[var(--ink-2)] tabular-nums text-right">
                                  {v}
                                </span>
                              </div>
                            );
                          })
                        : null}
                    </div>

                    {/* Total + verdict */}
                    <div
                      className="liaison-total mt-[10px] pt-[8px] border-t border-[var(--rule)] flex items-baseline justify-between"
                      style={{ "--row-i": rowIdx } as React.CSSProperties}
                    >
                      <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--muted)]">
                        Total
                      </span>
                      <span
                        className={`font-serif text-[20px] leading-none tracking-[-0.02em] ${
                          isSelected
                            ? "text-[var(--teal-deep)] font-semibold"
                            : "text-[var(--ink)]"
                        }`}
                      >
                        {total.toFixed(1)}
                      </span>
                    </div>

                    {/* Win badge — only on the selected card */}
                    {isSelected ? (
                      <div
                        className="liaison-winmark absolute -top-[10px] right-[12px] bg-[var(--teal-deep)] text-white font-mono text-[9px] py-[3px] px-[8px] rounded-full tracking-[0.10em] uppercase"
                        style={{ "--row-i": rowIdx } as React.CSSProperties}
                      >
                        Selected
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Rationale */}
            <div
              className="liaison-rationale mt-[14px] font-serif italic text-[13px] text-[var(--ink-2)] leading-[1.5]"
              style={{ "--row-i": rowIdx } as React.CSSProperties}
            >
              <span className="not-italic font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--muted)] mr-[6px]">
                Verdict
              </span>
              {item.rationale}
              {selected ? (
                <span className="text-[var(--muted)]">
                  {" "}
                  &mdash; team adds{" "}
                  <span className="text-[var(--ink)]">@{selected.handle}</span>.
                </span>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* Weights footnote */}
      <div className="text-center font-mono text-[10px] text-[var(--muted)] tracking-[0.10em] uppercase pt-[6px]">
        Weights for this brief &nbsp;·&nbsp; Skill {Math.round(WEIGHTS.skillMatch * 100)}%
        &nbsp;·&nbsp; Quality {Math.round(WEIGHTS.quality * 100)}% &nbsp;·&nbsp; Cost {Math.round(WEIGHTS.costFit * 100)}%
        &nbsp;·&nbsp; Tier {Math.round(WEIGHTS.tierFit * 100)}%
      </div>
    </div>
  );
}
