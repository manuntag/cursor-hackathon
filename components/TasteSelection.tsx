import Image from "next/image";

/**
 * The Liaison's taste filter, made visible.
 *
 * Skill-match and cost-fit scores don't capture aesthetic judgment. After
 * the 4-criterion bars converge, the Liaison still has to read editorial
 * sensibility — the difference between a tasteful, considered landing page
 * and a generic conversion-pattern template.
 *
 * Renders three real landing-page mocks for a bakery brief, considered
 * one-by-one. Two are politely declined (commodity-modern; small-business
 * template). One is selected (editorial dark, photography-led).
 *
 * The choreography fades each mock up, holds for "considering...", drops
 * a verdict line, then on completion locks the winner with the same teal
 * ring + "Selected" badge the LiaisonPanel rows use.
 *
 * Drop the three referenced PNGs at /public/mockups/. The component is
 * resilient if the files are missing — Next/Image will 404 the <img> but
 * the layout and verdicts still render.
 */

type Mock = {
  id: string;
  src: string;
  alt: string;
  label: string;
  verdict: string;
  selected?: boolean;
};

const MOCKS: Mock[] = [
  {
    id: "traditional",
    src: "/mockups/mockup-traditional.png",
    alt: "Mockup: traditional small-business bakery site with a hero image of bread and a 'Freshly Baked Every Morning' headline over a beige palette.",
    label: "Option A · traditional",
    verdict:
      "Reads like a 2018 small-business template. Beige scaffolding, stock heroism. Cheap to ship, off-brand for an editorial bakery.",
  },
  {
    id: "modern",
    src: "/mockups/mockup-modern.png",
    alt: "Mockup: pink, conversion-optimized bakery landing page with stat cards (10,000+ customers, 4.9/5 rating) and a glossy cake.",
    label: "Option B · commodity-modern",
    verdict:
      "Hero pattern, stat cards, gradient pinks. Generic SaaS aesthetic dressed up with frosting. Conversion-friendly, brand-distant.",
  },
  {
    id: "winner",
    src: "/mockups/mockup-winner.png",
    alt: "Mockup: dark, editorial Butter & Bloom bakery site with a large photographic croissant, italic serif 'Baked Beautifully' headline, and a 'Handcrafted Fresh Bread' badge.",
    label: "Option C · editorial",
    verdict:
      "Photography-led, italic serif, generous negative space. The work is the hero, not the conversion machinery around it.",
    selected: true,
  },
];

export function TasteSelection() {
  return (
    <section className="taste-selection mt-[44px]">
      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[10px] flex items-center gap-[10px]">
        <span>Taste · the last filter</span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span>3 viable mocks &middot; 1 selected</span>
      </div>

      <h3 className="font-sans font-medium text-[22px] tracking-[-0.01em] leading-[1.25] max-w-[640px] m-0 mb-[6px]">
        Skill match doesn&rsquo;t capture aesthetic.{" "}
        <em className="font-serif italic font-normal text-[var(--oxblood)]">
          Cost-fit doesn&rsquo;t either.
        </em>
      </h3>
      <p className="text-[13.5px] leading-[1.55] text-[var(--ink-2)] max-w-[640px] mb-[24px] m-0">
        Carter has fine-tuned taste that adapts to the market and the brief.
      </p>

      <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
        {MOCKS.map((m, i) => {
          const isSelected = Boolean(m.selected);
          return (
            <article
              key={m.id}
              className={`taste-card relative rounded-[10px] overflow-hidden border ${
                isSelected
                  ? "taste-card-selected border-[var(--teal-deep)] bg-white"
                  : "taste-card-passed border-[var(--rule)] bg-white"
              }`}
              style={
                {
                  boxShadow: "var(--shadow-sm)",
                  "--mock-i": i,
                } as React.CSSProperties
              }
            >
              <div className="relative aspect-[4/5] bg-[var(--paper-2)] overflow-hidden">
                {/* The mockup image. Fallback gradient is visible if file
                    is missing — the section still composes correctly. */}
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="taste-card-image object-cover object-top"
                  priority={isSelected}
                />

                {/* "Considering…" overlay — fades out once the verdict drops */}
                <div className="taste-considering absolute inset-0 flex items-center justify-center bg-[var(--ink)]/8 backdrop-blur-[1.5px] font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink)]">
                  Considering&hellip;
                </div>

                {/* Verdict badge — appears after consideration */}
                {isSelected ? (
                  <div className="taste-badge absolute top-[10px] right-[10px] bg-[var(--teal-deep)] text-white font-mono text-[9px] tracking-[0.14em] uppercase py-[4px] px-[10px] rounded-full">
                    Selected
                  </div>
                ) : (
                  <div className="taste-badge absolute top-[10px] right-[10px] bg-[var(--ink-2)]/80 text-white font-mono text-[9px] tracking-[0.14em] uppercase py-[4px] px-[10px] rounded-full">
                    Passed
                  </div>
                )}
              </div>

              <div className="p-[14px_16px_16px]">
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-[var(--muted)] mb-[6px]">
                  {m.label}
                </div>
                <p className="taste-verdict text-[12.5px] leading-[1.55] text-[var(--ink-2)] m-0">
                  {m.verdict}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="taste-conclusion mt-[16px] font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--muted)] text-center">
        Carter picked Option C. The brief reads &ldquo;editorial, plainspoken,
        never twee.&rdquo; The Liaison clocked it.
      </div>
    </section>
  );
}
