"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LiaisonPanel } from "./LiaisonPanel";
import type { WorkItem } from "@/lib/types";

/**
 * Manual-advance carousel wrapper around {@link LiaisonPanel}.
 *
 * Originally the panel rendered all 10 candidate-comparison rows as a
 * single stacked list — readable, but loud. The viewer's eye couldn't
 * settle on a single decision before the next was already in frame.
 *
 * This component shows ONE row at a time and gives the viewer prev / next
 * controls (plus pagination dots and ←/→ keyboard arrows). Re-keying the
 * inner wrapper on index change forces the underlying LiaisonPanel to
 * remount, so the CSS-driven bar-fill, total-tick, winner-ring, and verdict
 * choreography all replay for every decision as you step through.
 *
 * The first three slides follow the brief's logical dependency order:
 *   1. brand-strategy (sets the voice)
 *   2. ui-design       (renders the brand)
 *   3. marketing-strategy (sequences the launch)
 *  4–10. the remaining roles in their seeded order.
 *
 * The ordering itself is owned by `lib/seed/scenario.ts` (DECOMPOSITION) —
 * this component just paginates whatever it's given.
 */

type Props = {
  items: WorkItem[];
};

export function LiaisonCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);
  const lastIndex = items.length - 1;

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(lastIndex, i)));
    },
    [lastIndex],
  );
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  // Keyboard navigation. Skip when the user is typing in a form field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const current = useMemo(() => items[index], [items, index]);
  const isFirst = index === 0;
  const isLast = index === lastIndex;

  if (!current) return null;

  return (
    <section className="liaison-carousel" aria-roledescription="carousel">
      <div className="flex items-center justify-between mb-[14px]">
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)]">
          Decision {index + 1} of {items.length} · {decisionTitle(current)}
        </span>
        <span className="font-mono text-[10px] tracking-[0.04em] uppercase text-[var(--muted)] hidden md:inline">
          Use &larr; &rarr; or click to advance
        </span>
      </div>

      {/* Re-mount the inner panel on index change so CSS animations replay. */}
      <div key={current.id}>
        <LiaisonPanel items={[current]} />
      </div>

      <nav
        className="liaison-carousel-nav mt-[20px] flex items-center justify-between gap-[16px]"
        aria-label="Carousel navigation"
      >
        <button
          type="button"
          className="liaison-carousel-btn"
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Previous decision"
        >
          <span className="liaison-carousel-arrow" aria-hidden>
            &larr;
          </span>
          <span>Prev</span>
        </button>

        <div className="liaison-carousel-dots" role="tablist" aria-label="Decisions">
          {items.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? "step" : undefined}
                aria-label={`Decision ${i + 1}: ${item.description}`}
                className={`liaison-carousel-dot ${active ? "is-active" : ""}`}
                onClick={() => goTo(i)}
              >
                <span aria-hidden>{i + 1}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="liaison-carousel-btn"
          onClick={goNext}
          disabled={isLast}
          aria-label="Next decision"
        >
          <span>Next</span>
          <span className="liaison-carousel-arrow" aria-hidden>
            &rarr;
          </span>
        </button>
      </nav>
    </section>
  );
}

/** A short hook-line per work item — shown in the carousel header. */
function decisionTitle(item: WorkItem): string {
  // Use the first few words of the description for a tight header.
  const words = item.description.split(/\s+/).slice(0, 5).join(" ");
  return words;
}
