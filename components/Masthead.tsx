import Link from "next/link";

type Props = {
  meta?: string; // right-side mono metadata (e.g. "VOL. I · SARAH'S BAKERY · LIVE")
};

export function Masthead({ meta }: Props) {
  return (
    <header className="flex justify-between items-end pb-[22px] border-b border-[var(--ink)]">
      <Link href="/" className="font-serif italic text-[32px] leading-none tracking-[-0.02em] text-[var(--ink)]">
        WhiteClaw
        <sup className="font-mono not-italic text-[10px] align-super ml-1 text-[var(--muted)] tracking-[0.08em]">
          ↗
        </sup>
      </Link>
      <nav className="flex items-center gap-6 font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--muted)]">
        <Link href="/network" className="hover:text-[var(--ink)] transition-colors">Network</Link>
        <Link href="/" className="hover:text-[var(--ink)] transition-colors">New brief</Link>
        {meta ? <span className="text-[var(--ink)]">{meta}</span> : null}
      </nav>
    </header>
  );
}
