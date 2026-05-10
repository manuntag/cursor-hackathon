import Link from "next/link";
import { notFound } from "next/navigation";
import { Masthead } from "@/components/Masthead";
import { Kicker } from "@/components/Kicker";
import { AgentCard } from "@/components/AgentCard";
import { findExpert, EXPERTS } from "@/lib/seed/experts";

const TIER_LABEL = {
  haiku: "Haiku 4.5",
  sonnet: "Sonnet 4.6",
  opus: "Opus 4.7",
} as const;

export function generateStaticParams() {
  return EXPERTS.map((e) => ({ handle: e.handle }));
}

export default async function ExpertProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const expert = findExpert(handle);
  if (!expert) notFound();

  const peers = EXPERTS.filter(
    (e) => e.role === expert.role && e.handle !== expert.handle,
  );

  return (
    <div className="max-w-[1100px] mx-auto px-[64px] py-[56px] rise">
      <Masthead meta={`@${expert.handle.toUpperCase()}`} />

      <Kicker>{expert.role}</Kicker>

      <header className="mt-[24px] grid grid-cols-[1fr_auto] gap-[40px] items-start max-[880px]:grid-cols-1">
        <div>
          <h1 className="font-serif italic font-normal text-[60px] leading-[1.02] tracking-[-0.025em] m-0">
            {expert.name}
          </h1>
          <p className="mt-[18px] max-w-[640px] text-[16px] text-[var(--ink-2)] leading-[1.55]">
            {expert.bio}
          </p>

          <div className="mt-[20px] flex flex-wrap gap-[8px]">
            {expert.skills.map((s) => (
              <span
                key={s}
                className="font-mono text-[11px] tracking-[0.04em] py-[3px] px-[10px] rounded-[4px] border border-[var(--rule)] text-[var(--ink-2)]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <aside
          className="bg-white border border-[var(--rule)] rounded-[6px] p-[24px_28px] min-w-[260px]"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <span className={`tier-pill tier-${expert.tier} mb-[12px] inline-block`}>
            {TIER_LABEL[expert.tier]}
          </span>
          {expert.role === "Liaison" ? (
            <>
              <div className="font-serif italic text-[36px] leading-none tracking-[-0.02em] text-[var(--teal-deep)]">
                Commission
              </div>
              <div className="text-[12px] text-[var(--muted)] mt-[6px] tracking-[0.04em]">
                % of team spend &middot; sized to the brief
              </div>
            </>
          ) : (
            <>
              <div className="font-serif text-[44px] leading-none tracking-[-0.02em]">
                ${expert.pricePerJob}
              </div>
              <div className="text-[12px] text-[var(--muted)] mt-[6px] tracking-[0.04em]">
                per commission
              </div>
            </>
          )}
          <div className="mt-[18px] pt-[14px] border-t border-[var(--rule)] grid grid-cols-2 gap-[12px]">
            <div>
              <div className="font-sans font-semibold text-[18px]">
                ★ {expert.rating.toFixed(2)}
              </div>
              <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--muted)] mt-[2px]">
                Rating
              </div>
            </div>
            <div>
              <div className="font-sans font-semibold text-[18px]">
                {expert.priorJobs.toLocaleString()}
              </div>
              <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--muted)] mt-[2px]">
                Prior jobs
              </div>
            </div>
          </div>
          {expert.ownerHandle ? (
            <div className="mt-[14px] pt-[14px] border-t border-[var(--rule)] text-[12px]">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--muted)] mr-[4px]">
                Owner
              </span>
              <span className="font-serif italic">@{expert.ownerHandle}</span>
            </div>
          ) : null}
        </aside>
      </header>

      {expert.portfolio?.length ? (
        <section className="mt-[64px]">
          <Kicker>Selected work</Kicker>
          <div className="mt-[24px] grid grid-cols-1 md:grid-cols-2 gap-[16px]">
            {expert.portfolio.map((p, i) => (
              <div
                key={i}
                className="bg-white border border-[var(--rule)] rounded-[8px] p-[20px_22px]"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="font-sans font-semibold text-[15px] mb-[6px]">
                  {p.title}
                </div>
                <div className="text-[13px] text-[var(--ink-2)] leading-[1.55]">
                  {p.blurb}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {expert.endorsements?.length ? (
        <section className="mt-[64px]">
          <Kicker>Endorsements from the network</Kicker>
          <div className="mt-[24px] space-y-[14px]">
            {expert.endorsements.map((en, i) => (
              <blockquote
                key={i}
                className="font-serif italic text-[18px] leading-[1.5] text-[var(--ink)] pl-[18px] border-l-2 border-[var(--oxblood)]"
              >
                &ldquo;{en.quote}&rdquo;
                <div className="not-italic font-sans text-[12px] text-[var(--muted)] mt-[6px] tracking-[0.04em]">
                  &mdash;{" "}
                  <Link
                    href={`/expert/${en.fromHandle}`}
                    className="hover:text-[var(--ink)] underline-offset-2 hover:underline"
                  >
                    @{en.fromHandle}
                  </Link>
                </div>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      {peers.length ? (
        <section className="mt-[64px]">
          <Kicker>Other {expert.role}s in the network</Kicker>
          <div className="mt-[24px] grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            {peers.map((p) => (
              <AgentCard key={p.handle} expert={p} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-[80px] pt-[22px] border-t border-[var(--rule)] font-mono text-[10px] text-[var(--muted)] tracking-[0.14em] uppercase flex justify-between">
        <Link href="/network" className="hover:text-[var(--ink)]">
          &larr; Back to the network
        </Link>
        <span>The platform</span>
      </footer>
    </div>
  );
}
