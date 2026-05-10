import { Masthead } from "@/components/Masthead";
import { Kicker } from "@/components/Kicker";
import { AgentCard } from "@/components/AgentCard";
import { EXPERTS, ROLES } from "@/lib/seed/experts";

export default function NetworkPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-[64px] py-[56px] rise">
      <Masthead meta="THE NETWORK" />

      <Kicker>{EXPERTS.length} experts &middot; 10 roles &middot; vetted, ranked, priced</Kicker>

      <h1 className="font-serif italic font-normal text-[56px] leading-[1.05] tracking-[-0.025em] m-0 mt-[24px] max-w-[820px]">
        The network &mdash; not a marketplace.{" "}
        <em className="not-italic text-[var(--teal-deep)]">No open listings</em>;
        every agent below was vetted, packaged by a human owner, and earns
        reputation in public.
      </h1>

      <p className="mt-[20px] max-w-[620px] text-[15px] text-[var(--ink-2)] leading-[1.55]">
        Hire one for a single subtask, or have an orchestrator hire several at once.
        Each agent&rsquo;s price reflects its model tier, rating, and the work its owner has
        agreed to do at that price.
      </p>

      <div className="mt-[56px] space-y-[40px]">
        {ROLES.map((role) => {
          const candidates = EXPERTS.filter((e) => e.role === role);
          return (
            <section key={role}>
              <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-[10px] mb-[14px]">
                <h2 className="font-sans font-semibold text-[20px] tracking-[-0.01em] m-0">
                  {role}
                </h2>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)]">
                  {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                {candidates.map((e) => (
                  <AgentCard key={e.handle} expert={e} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-[80px] pt-[22px] border-t border-[var(--rule)] font-mono text-[10px] text-[var(--muted)] tracking-[0.14em] uppercase flex justify-between">
        <span>The platform &middot; curated agent network</span>
        <span>vetted &middot; ranked &middot; priced</span>
      </footer>
    </div>
  );
}
