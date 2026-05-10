import { formatDollars, formatDollarsRounded } from "@/lib/cost";

type Props = {
  spentCents: number;
  naiveCents: number;
  /** Override label (e.g. "Spent on Sarah's Bakery"). */
  label?: string;
};

/**
 * The right-side hero card that shows the savings story self-contained.
 * Top stripe is teal; the big "$94.20" lives in the serif voice; the delta row
 * shows the strikethrough naive total against the smart-routed actual spend.
 */
export function SavingsCard({ spentCents, naiveCents, label }: Props) {
  const savedPct = naiveCents > 0 ? (1 - spentCents / naiveCents) * 100 : 0;
  // Round to whole cents before splitting — live summary totals come in as
  // floats (priceCall divides by 1,000,000), and without rounding the
  // cents portion picks up float garbage like "12.324350000000095".
  const wholeCents = Math.round(spentCents);
  const dollars = Math.floor(wholeCents / 100);
  const cents = (wholeCents % 100).toString().padStart(2, "0");

  return (
    <aside className="bg-white border border-[var(--rule)] rounded-[6px] p-[28px_30px] relative" style={{ boxShadow: "var(--shadow-md)" }}>
      <span className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px] bg-gradient-to-r from-[var(--teal)] to-[var(--teal-deep)]" />

      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)]">
        {label ?? "Model spend"}
      </div>

      <div className="font-serif font-normal text-[84px] leading-[0.95] tracking-[-0.04em] text-[var(--ink)] mt-[6px] mb-[4px] flex items-baseline">
        <span className="text-[36px] text-[var(--muted)] mr-[4px] leading-none">$</span>
        {dollars}
        <span className="text-[28px] text-[var(--muted)]">.{cents}</span>
      </div>

      <div className="text-[14px] text-[var(--ink-2)] mb-[22px]">
        token cost &middot; vs.{" "}
        {formatDollarsRounded(naiveCents)} if every job ran on Opus 4.7
      </div>

      <div className="flex gap-[16px] pt-[18px] border-t border-[var(--rule)]">
        <div>
          <div className="font-sans font-semibold text-[22px] leading-none text-[var(--muted)] line-through decoration-[var(--oxblood)] decoration-[2px] tracking-[-0.01em]">
            {formatDollars(naiveCents)}
          </div>
          <div className="text-[11px] tracking-[0.08em] text-[var(--muted)] mt-[4px]">
            Naive · Opus everywhere
          </div>
        </div>
        <div>
          <div className="font-sans font-semibold text-[22px] leading-none text-[var(--teal-deep)] tracking-[-0.01em]">
            {formatDollars(spentCents)}
          </div>
          <div className="text-[11px] tracking-[0.08em] text-[var(--muted)] mt-[4px]">
            Smart · tier-routed
          </div>
        </div>
      </div>

      <div className="mt-[18px] py-[10px] px-[14px] bg-[var(--teal-soft)] border-l-2 border-[var(--teal-deep)] text-[13px] text-[var(--teal-deep)]">
        <strong className="font-semibold">{savedPct.toFixed(1)}% saved</strong> &mdash; with no drop in approval rate.
      </div>
    </aside>
  );
}
