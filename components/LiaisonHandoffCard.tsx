"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  tier: "haiku" | "sonnet" | "opus";
  tierLabel: string;
  rating: number;
  priorJobs: number;
  bio: string;
};

/**
 * The Liaison handoff card from step 4 of the IntakeFlow. Lifted into its
 * own client component so it can gate its own entrance on viewport entry —
 * the card stays hidden until it scrolls into frame, then fades-and-rises
 * in. Matches the phase-animation gate's "don't burn the choreography
 * above-the-fold" rule, scoped to a single card.
 */
export function LiaisonHandoffCard({
  name,
  tier,
  tierLabel,
  rating,
  priorJobs,
  bio,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const avatarBg =
    tier === "opus"
      ? "var(--oxblood)"
      : tier === "sonnet"
      ? "var(--ochre)"
      : "var(--teal-deep)";

  return (
    <div
      ref={ref}
      className={`liaison-handoff-card ${revealed ? "is-revealed" : ""}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="grid grid-cols-[44px_1fr_auto] gap-[14px] items-center">
        <div
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-sans font-semibold text-[16px]"
          style={{ background: avatarBg }}
        >
          {name[0]}
        </div>
        <div>
          <div className="font-sans font-semibold text-[16px] tracking-[-0.01em]">
            {name}
          </div>
          <div className="text-[12px] text-[var(--muted)] mt-[3px]">
            <span className={`tier-pill tier-${tier} mr-[6px]`}>
              {tierLabel}
            </span>
            Liaison &middot; &#9733; {rating.toFixed(2)} &middot; {priorJobs}{" "}
            prior teams assembled
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.10em] uppercase">
            Paid on
          </div>
          <div className="font-sans font-semibold text-[13px] text-[var(--teal-deep)] mt-[2px]">
            commission
          </div>
          <div className="font-mono text-[9.5px] text-[var(--muted)] tracking-[0.04em] mt-[2px]">
            % of team spend
          </div>
        </div>
      </div>
      <p className="mt-[12px] text-[13px] text-[var(--ink-2)] leading-[1.55] max-w-[640px]">
        {bio}
      </p>
    </div>
  );
}
