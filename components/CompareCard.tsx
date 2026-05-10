import { formatDollarsRounded } from "@/lib/cost";
import type { Tier } from "@/lib/types";

type Row = {
  tier: Tier;
  role: string;
  costCents: number;
};

type Props = {
  variant: "naive" | "smart";
  /** All-Opus total (variant=naive) OR actual spend (variant=smart) in cents. */
  totalCents: number;
  rows: Row[];
};

const TIER_LABEL: Record<Tier, string> = {
  haiku: "Haiku",
  sonnet: "Sonnet",
  opus: "Opus",
};

/**
 * One side of the naive vs smart comparison. Used twice on the run page —
 * left card shows "every job at Opus rates," right card shows the real mix.
 */
export function CompareCard({ variant, totalCents, rows }: Props) {
  const isSmart = variant === "smart";
  return (
    <div
      className={`relative bg-white border rounded-[6px] p-[26px_28px] ${
        isSmart ? "border-[rgba(14,104,86,0.22)]" : "border-[rgba(124,45,18,0.18)]"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {isSmart ? (
        <span className="absolute top-[-10px] right-[18px] bg-[var(--teal-deep)] text-white font-mono text-[10px] tracking-[0.08em] uppercase py-[4px] px-[10px] rounded-full">
          tier-routed
        </span>
      ) : null}

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-sans font-semibold text-[18px] leading-tight tracking-[-0.01em] m-0">
            {isSmart ? "Smart routing" : "Naive routing"}
          </h3>
          <div className="text-[12px] text-[var(--muted)] mt-[6px]">
            {isSmart
              ? "Each task routed to the cheapest tier that meets the bar"
              : 'Every task on Opus 4.7 — the "best model for everything" approach'}
          </div>
        </div>
        <div
          className={`font-serif text-[36px] leading-none tracking-[-0.02em] ${
            isSmart
              ? "text-[var(--teal-deep)]"
              : "text-[var(--muted)] line-through decoration-[var(--oxblood)] decoration-[2px]"
          }`}
        >
          {formatDollarsRounded(totalCents)}
        </div>
      </div>

      <div className="mt-[18px]">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto] gap-[12px] items-center py-[10px] border-b border-[var(--rule)] last:border-b-0 last:pb-0 text-[13px]"
          >
            <span className={`tier-pill tier-${r.tier}`}>{TIER_LABEL[r.tier]}</span>
            <span className="font-sans">{r.role}</span>
            <span className="font-mono text-[12px] text-[var(--ink-2)]">
              {formatDollarsRounded(r.costCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
