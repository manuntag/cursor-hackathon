import type { Tier } from "@/lib/types";

/**
 * Explains the four criteria the Liaison weighs per work item. Sits above
 * the {@link import("./LiaisonPanel").LiaisonPanel} so viewers understand
 * what the bars below are measuring, before they see twenty-something of
 * them stacked.
 *
 * Each card has a mini-visualization specific to its criterion — a small
 * inline diagram that demonstrates the computation in concrete terms. All
 * choreography is CSS-only and respects `prefers-reduced-motion`.
 */

type Weights = {
  skillMatch: number;
  quality: number;
  costFit: number;
  tierFit: number;
};

type Props = {
  weights: Weights;
};

export function CriteriaPrimer({ weights }: Props) {
  return (
    <section className="criteria-primer mt-[36px]">
      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[12px] flex items-center gap-[10px]">
        <span>How the Liaison thinks</span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span>Brief-aware weights · S{pct(weights.skillMatch)} · Q{pct(weights.quality)} · C{pct(weights.costFit)} · T{pct(weights.tierFit)}</span>
      </div>

      <div className="grid grid-cols-4 gap-[14px] max-[1000px]:grid-cols-2 max-[640px]:grid-cols-1">
        <Card index={0} title="Skill match" weight={weights.skillMatch}>
          <CardCopy>
            Does the expert&rsquo;s skill list cover what this work item
            actually needs? Misses cost more than bonuses help.
          </CardCopy>
          <SkillMatchVisual />
        </Card>

        <Card index={1} title="Quality" weight={weights.quality}>
          <CardCopy>
            Rating, weighted by prior-job confidence. A 4.9 with 300 commissions
            is a stronger signal than a 4.9 with 30.
          </CardCopy>
          <QualityVisual />
        </Card>

        <Card index={2} title="Cost-fit" weight={weights.costFit}>
          <CardCopy>
            Price relative to the brief&rsquo;s per-role budget ceiling.
            Cheaper relative to that ceiling scores higher.
          </CardCopy>
          <CostFitVisual />
        </Card>

        <Card index={3} title="Tier-fit" weight={weights.tierFit}>
          <CardCopy>
            Is this the cheapest tier that still meets the bar for this kind
            of work? Boilerplate &rarr; Haiku. Creative &rarr; Opus.
          </CardCopy>
          <TierFitVisual />
        </Card>
      </div>
    </section>
  );
}

/* ============================================================================
 * Card scaffold
 * ============================================================================ */

function Card({
  index,
  title,
  weight,
  children,
}: {
  index: number;
  title: string;
  weight: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="criteria-card relative bg-white border border-[var(--rule)] rounded-[10px] p-[16px_18px] flex flex-col"
      style={
        {
          boxShadow: "var(--shadow-sm)",
          "--card-i": index,
        } as React.CSSProperties
      }
    >
      <div className="flex items-baseline justify-between mb-[6px]">
        <h3 className="font-serif italic font-normal text-[22px] leading-none tracking-[-0.02em] text-[var(--ink)] m-0">
          {title}
        </h3>
        <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--muted)]">
          {pct(weight)}
        </span>
      </div>
      {children}
    </div>
  );
}

function CardCopy({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12.5px] leading-[1.55] text-[var(--ink-2)] mt-[2px] mb-[14px] m-0">
      {children}
    </p>
  );
}

/* ============================================================================
 * Per-criterion mini-visuals
 *
 * All four use the same staggered fade-in (per-element delay via --el-i and
 * --card-i). Each is small (≤72px tall) and self-contained.
 * ============================================================================ */

const REQUIRED_SKILLS = ["ui-design", "food-and-bev", "responsive"] as const;

function SkillMatchVisual() {
  return (
    <div className="mt-auto">
      <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[var(--muted)] mb-[6px]">
        Required &middot; example
      </div>
      <div className="flex flex-wrap gap-[5px]">
        {REQUIRED_SKILLS.map((skill, i) => (
          <span
            key={skill}
            className="criteria-skill-pill inline-flex items-center gap-[5px] bg-[var(--paper-2)] border border-[var(--rule)] rounded-full py-[3px] px-[8px] font-mono text-[10px] text-[var(--ink-2)]"
            style={{ "--el-i": i } as React.CSSProperties}
          >
            <span className="criteria-check inline-block w-[10px] h-[10px] rounded-full bg-[var(--teal-deep)] text-white text-[7px] leading-[10px] text-center font-sans font-bold">
              ✓
            </span>
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-[10px] flex items-baseline gap-[6px]">
        <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--muted)]">
          3 of 3 covered
        </span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span className="font-serif font-normal text-[16px] leading-none text-[var(--teal-deep)]">
          95
        </span>
      </div>
    </div>
  );
}

function QualityVisual() {
  const rating = 4.92;
  return (
    <div className="mt-auto">
      <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[var(--muted)] mb-[6px]">
        Rating &times; prior jobs
      </div>
      <div className="flex items-center gap-[8px]">
        <div className="flex gap-[2px]">
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = Math.max(0, Math.min(1, rating - i));
            return (
              <span
                key={i}
                className="criteria-star relative inline-block w-[12px] h-[12px] text-[12px] leading-[12px]"
                style={{ "--el-i": i, color: "var(--rule)" } as React.CSSProperties}
              >
                <span aria-hidden>★</span>
                <span
                  aria-hidden
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%`, color: "var(--ochre)" }}
                >
                  ★
                </span>
              </span>
            );
          })}
        </div>
        <span className="font-serif italic text-[14px] leading-none text-[var(--ink)]">
          {rating}
        </span>
      </div>
      <div className="mt-[8px] flex items-baseline gap-[6px]">
        <span
          className="criteria-jobs-tag font-mono text-[10px] tracking-[0.04em] text-[var(--muted)]"
          style={{ "--el-i": 5 } as React.CSSProperties}
        >
          &times; 312 prior commissions
        </span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span className="font-serif font-normal text-[16px] leading-none text-[var(--teal-deep)]">
          96
        </span>
      </div>
    </div>
  );
}

function CostFitVisual() {
  // Cost-fit scores the candidate's price against the *other candidates for
  // the same role*, not the absolute budget ceiling. Render the three
  // ui-design candidates as ticks on a small axis ($6 → $42) with the
  // example (Maya) highlighted in oxblood; her position on the premium end
  // is why the score is 50.
  const candidates = [
    { label: "Bloom", price: 6, tier: "haiku" as Tier },
    { label: "Rye", price: 18, tier: "sonnet" as Tier },
    { label: "Maya", price: 42, tier: "opus" as Tier, selected: true },
  ];
  const maxPrice = 50; // gives Maya's tick a bit of breathing room from the right edge
  const positionOf = (p: number) => (p / maxPrice) * 100;
  return (
    <div className="mt-auto">
      <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[var(--muted)] mb-[6px]">
        Among design candidates &middot; price spread
      </div>
      <div className="criteria-budget relative h-[8px] rounded-full bg-[var(--paper-2)] border border-[var(--rule)]">
        <div
          className="criteria-budget-fill absolute inset-y-0 left-0 rounded-l-full bg-[var(--ink-2)]/12"
          style={{ width: `${positionOf(candidates[candidates.length - 1].price)}%` }}
        />
        {candidates.map((c) => {
          const left = positionOf(c.price);
          return (
            <span key={c.label}>
              <span
                className="criteria-budget-marker absolute -top-[5px] w-[2px] h-[18px] rounded-full"
                style={{
                  left: `calc(${left}% - 1px)`,
                  background: c.selected ? "var(--oxblood)" : "var(--muted)",
                }}
              />
              <span
                className="criteria-budget-label absolute top-[14px] font-mono text-[9.5px] whitespace-nowrap"
                style={{
                  left: `calc(${left}% - 14px)`,
                  color: c.selected ? "var(--oxblood)" : "var(--muted)",
                  fontWeight: c.selected ? 600 : 400,
                }}
              >
                ${c.price}
              </span>
            </span>
          );
        })}
      </div>
      <div className="mt-[26px] flex items-baseline gap-[6px]">
        <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--muted)]">
          most premium of three &mdash; allowed for taste roles
        </span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span className="font-serif font-normal text-[16px] leading-none text-[var(--ochre)]">
          50
        </span>
      </div>
    </div>
  );
}

const TIERS: Array<{ tier: Tier; label: string }> = [
  { tier: "haiku", label: "Haiku" },
  { tier: "sonnet", label: "Sonnet" },
  { tier: "opus", label: "Opus" },
];

function TierFitVisual() {
  const required: Tier = "opus";
  return (
    <div className="mt-auto">
      <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[var(--muted)] mb-[6px]">
        Required for creative work
      </div>
      <div className="flex gap-[6px]">
        {TIERS.map((t, i) => {
          const isRequired = t.tier === required;
          return (
            <div
              key={t.tier}
              className={`criteria-tier-slot flex-1 flex items-center justify-center font-mono text-[10px] py-[8px] rounded-[6px] border ${
                isRequired
                  ? "border-[var(--teal-deep)] bg-[var(--teal-soft)] text-[var(--teal-deep)]"
                  : "border-[var(--rule)] bg-[var(--paper-2)]/50 text-[var(--muted)]"
              }`}
              style={
                {
                  "--el-i": i,
                  ...(isRequired ? { boxShadow: "0 0 0 2px rgba(14,104,86,0.18)" } : {}),
                } as React.CSSProperties
              }
            >
              {t.label}
            </div>
          );
        })}
      </div>
      <div className="mt-[10px] flex items-baseline gap-[6px]">
        <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--muted)]">
          Opus expert on Opus task
        </span>
        <span className="flex-1 h-px bg-[var(--rule)]" />
        <span className="font-serif font-normal text-[16px] leading-none text-[var(--teal-deep)]">
          95
        </span>
      </div>
    </div>
  );
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
