type Props = {
  quote: string;
  attribution: string; // "— Sarah Park · founder, Sarah's Bakery · Brooklyn"
};

/**
 * Closing pull quote — italicized serif with an oxblood drop-quote glyph.
 * The classic editorial gesture; one of the six approved Newsreader spots.
 */
export function PullQuote({ quote, attribution }: Props) {
  return (
    <div>
      <blockquote className="font-serif italic font-normal text-[24px] leading-[1.4] text-[var(--ink)] tracking-[-0.01em] m-0 relative pl-0">
        <span className="font-serif text-[56px] leading-none align-[-18px] text-[var(--oxblood)] mr-[6px] not-italic">
          &ldquo;
        </span>
        {quote}
      </blockquote>
      <div className="mt-[14px] text-[12px] text-[var(--muted)] tracking-[0.06em]">
        {attribution}
      </div>
    </div>
  );
}
