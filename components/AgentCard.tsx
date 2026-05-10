import Link from "next/link";
import type { Expert } from "@/lib/types";

type Props = {
  expert: Expert;
  /** Optional savings line — "saved $X vs. Opus" — shown when displayed during a run. */
  savedVsOpusCents?: number;
  /** Override what to display as the price (used when showing realized cost during a run). */
  priceOverrideCents?: number;
  /** Render as a Link to /expert/[handle]. Default true on directory, false in feeds. */
  linkToProfile?: boolean;
};

const TIER_AV_BG: Record<Expert["tier"], string> = {
  haiku: "var(--teal-deep)",
  sonnet: "var(--ochre)",
  opus: "var(--oxblood)",
};

const TIER_LABEL: Record<Expert["tier"], string> = {
  haiku: "Haiku 4.5",
  sonnet: "Sonnet 4.6",
  opus: "Opus 4.7",
};

export function AgentCard({
  expert,
  savedVsOpusCents,
  priceOverrideCents,
  linkToProfile = true,
}: Props) {
  const initial = expert.name[0]?.toUpperCase() ?? "?";

  const cardInner = (
    <div
      className="bg-white border border-[var(--rule)] rounded-[8px] p-[20px_22px] grid grid-cols-[48px_1fr_auto] gap-[16px] items-center transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-white font-sans font-semibold text-[18px] tracking-[0.02em]"
        style={{ background: TIER_AV_BG[expert.tier] }}
      >
        {initial}
      </div>
      <div>
        <div className="font-sans font-semibold text-[16px] leading-tight tracking-[-0.01em]">
          {expert.name}
        </div>
        <div className="text-[12px] text-[var(--muted)] tracking-[0.04em] mt-[4px]">
          <span className={`tier-pill tier-${expert.tier} mr-[6px]`}>{TIER_LABEL[expert.tier]}</span>
          {expert.role} · {expert.priorJobs.toLocaleString()} jobs
        </div>
      </div>
      <div className="text-right">
        {expert.role === "Liaison" && priceOverrideCents == null ? (
          <div className="font-sans font-semibold text-[13px] text-[var(--teal-deep)] leading-none">
            Commission
          </div>
        ) : (
          <div className="font-serif text-[20px] leading-none">
            ${(priceOverrideCents != null
              ? Math.round(priceOverrideCents / 100)
              : expert.pricePerJob)}
          </div>
        )}
        <div className="font-mono text-[10px] text-[var(--muted)] mt-[3px] tracking-[0.04em]">
          ★ {expert.rating.toFixed(2)}
        </div>
        {savedVsOpusCents != null && savedVsOpusCents > 0 ? (
          <div className="font-mono text-[10px] text-[var(--teal-deep)] mt-[6px] tracking-[0.04em]">
            saved ${Math.round(savedVsOpusCents / 100)} vs. Opus
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!linkToProfile) return cardInner;

  return (
    <Link href={`/expert/${expert.handle}`} className="block">
      {cardInner}
    </Link>
  );
}
