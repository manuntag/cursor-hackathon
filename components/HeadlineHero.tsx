import { formatDollarsRounded } from "@/lib/cost";

type Props = {
  /** What was actually spent. */
  spentCents: number;
  /** What it would have cost on Opus 4.7 throughout. */
  naiveCents: number;
  /** Lead text — the project / brief name. */
  intro: string;
};

/**
 * The hero headline with the strikethrough savings gesture.
 * "A bakery's full launch, built by ten experts — for ~$406~ $94."
 *
 * Numbers are derived from the cost ledger; nothing is hardcoded.
 */
export function HeadlineHero({ spentCents, naiveCents, intro }: Props) {
  return (
    <h1 className="font-serif italic font-normal text-[60px] leading-[1.02] tracking-[-0.025em] text-[var(--ink)] m-0">
      {intro} for{" "}
      <span className="strike-savings">{formatDollarsRounded(naiveCents)}</span>{" "}
      <em className="not-italic text-[var(--teal-deep)]">{formatDollarsRounded(spentCents)}</em>.
    </h1>
  );
}
