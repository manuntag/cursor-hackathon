"use client";

import { useState } from "react";
import Image from "next/image";
import type { EnrichedBrief } from "@/lib/types";
import { ConciergeScan } from "@/components/ConciergeScan";
import { LiaisonHandoffCard } from "@/components/LiaisonHandoffCard";

/**
 * The Liaison that ultimately accepts Sarah's brief. The concierge-scan above
 * cycles through the open Clustly registry to show the network sweep, but the
 * actual handoff goes to WhiteClaw's curated coordinator. Display data kept
 * inline so this file is self-contained.
 */
const MATCHED_CONCIERGE = {
  name: "Carter Network Concierge",
  tier: "sonnet" as const,
  tierLabel: "Sonnet 4.6",
  rating: 4.91,
  priorJobs: 412,
  bio: "Multi-skill SMB coordination. Has run 400+ briefs across launch, rebrand, and growth projects. Strong opinions on what should run on Haiku vs Sonnet vs Opus — refuses to over-spec.",
};

type Props = {
  brief: EnrichedBrief;
};

/**
 * Renders the 4-step intake before the Liaison takes over:
 *   1. Raw user input (informal — what Sarah actually said)
 *   2. Personal Agent's memory + enrichment (off-platform layer made visible)
 *   3. Agent-concierge scan — a terminal-style slash-command interface that
 *      sweeps the on-platform registry for a fit Liaison
 *   4. Hand-off to the matched Liaison (the platform's curated coordinator)
 *
 * This is the *narrative bridge* between the savings hero and the team-
 * assembly section. Without it, judges won't see why a Personal Agent layer
 * matters. With it, the 3-tier model is legible in 20 seconds.
 */
export function IntakeFlow({ brief }: Props) {
  // Step 4's reveal is sequentially gated on step 3 completing — the Liaison
  // handoff card stays hidden until ConciergeScan signals onDone.
  const [scanDone, setScanDone] = useState(false);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-x-[20px] gap-y-[28px] items-start">
      {/* ─────────── Step 1: Raw user input ─────────── */}
      <Step number={1} label="USER" tone="raw" />
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[6px]">
          {brief.raw.user} &middot; said
        </div>
        <blockquote className="font-serif italic text-[28px] leading-[1.2] text-[var(--ink)] tracking-[-0.01em] m-0 max-w-[640px]">
          <span className="font-serif text-[44px] leading-none align-[-12px] text-[var(--oxblood)] mr-[6px] not-italic">
            &ldquo;
          </span>
          {brief.raw.text}.
          <span className="font-serif text-[44px] leading-none align-[-12px] text-[var(--oxblood)] ml-[2px] not-italic">
            &rdquo;
          </span>
        </blockquote>
      </div>

      {/* ─────────── Step 2: Personal Agent enrichment ─────────── */}
      <Step number={2} label="AGENT" tone="enrich" />
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[14px]">
          Personal agent &middot; enriched the request from memory
        </div>

        {/* Floating polaroid memory of Sarah — what the personal agent has
            actually accumulated about its user. These are not stock photos;
            they're stand-ins for the kind of context the agent builds up
            over time (photos shared in chat, profile imagery, etc.). The
            tilt + paper border + typewritten captions evoke a memory board. */}
        <div className="sarah-memory-photos relative flex flex-wrap items-start gap-[28px] mb-[26px] mt-[2px] ml-[6px]">
          <figure
            className="sarah-photo bg-white p-[8px_8px_30px] relative shrink-0"
            style={
              {
                boxShadow:
                  "0 14px 30px -14px rgba(22, 21, 18, 0.35), 0 2px 4px rgba(22, 21, 18, 0.08)",
                "--photo-i": 0,
                "--photo-rot": "-2.5deg",
              } as React.CSSProperties
            }
          >
            <Image
              src="/sarah/sarah-bakery.png"
              alt="Sarah arranging fresh-baked almond croissants on a tray in her bakery, with bread racks and a deck oven behind her."
              width={176}
              height={220}
              className="block w-[176px] h-[220px] object-cover"
            />
            <figcaption className="absolute bottom-[8px] left-[12px] right-[12px] font-mono text-[9.5px] tracking-[0.10em] uppercase text-[var(--ink-2)]">
              baking famous croissants
            </figcaption>
          </figure>
          <figure
            className="sarah-photo bg-white p-[8px_8px_30px] relative shrink-0"
            style={
              {
                boxShadow:
                  "0 14px 30px -14px rgba(22, 21, 18, 0.35), 0 2px 4px rgba(22, 21, 18, 0.08)",
                "--photo-i": 1,
                "--photo-rot": "2.8deg",
              } as React.CSSProperties
            }
          >
            <Image
              src="/sarah/sarah-storefront.png"
              alt="Sarah at her storefront desk on the phone, taking notes, with a 'Sarah's Artisan Bakery' chalkboard sign and branded boxes behind her."
              width={176}
              height={220}
              className="block w-[176px] h-[220px] object-cover"
            />
            <figcaption className="absolute bottom-[8px] left-[12px] right-[12px] font-mono text-[9.5px] tracking-[0.10em] uppercase text-[var(--ink-2)]">
              storefront &middot; driggs ave
            </figcaption>
          </figure>
          <div className="sarah-photo-note self-center max-w-[260px] font-serif italic text-[13px] leading-[1.5] text-[var(--ink-2)]">
            &ldquo;The agent knows the person, not the request.&rdquo;
            <div className="not-italic font-mono text-[9.5px] tracking-[0.10em] uppercase text-[var(--muted)] mt-[6px]">
              memory built up over time
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[18px]">
          <MemorySection title="What it knows about Sarah" items={brief.memory.factsKnown} />
          <MemorySection title="Sarah&rsquo;s preferences" items={brief.memory.preferences} accent />
        </div>

        {brief.memory.notes ? (
          <div
            className="bg-[var(--paper-2)] border-l-2 border-[var(--ochre)] py-[8px] px-[14px] mb-[18px] text-[13px] font-serif italic text-[var(--ink-2)]"
          >
            {brief.memory.notes}
          </div>
        ) : null}

        <details
          className="bg-white border border-[var(--rule)] rounded-[8px] p-[16px_20px] open:pb-[20px]"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <summary className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)] cursor-pointer hover:text-[var(--ink-2)]">
            Enriched brief sent to the network &mdash; click to expand
          </summary>
          <div className="mt-[14px] text-[13.5px] leading-[1.6] text-[var(--ink-2)] whitespace-pre-line max-w-[820px]">
            {brief.enrichedText}
          </div>
        </details>
      </div>

      {/* ─────────── Step 3: Agent-concierge scan ─────────── */}
      <Step number={3} label="SCAN" tone="scan" />
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[10px]">
          Personal agent &middot; queried the network for a fit Liaison
        </div>
        <ConciergeScan
          matchName={MATCHED_CONCIERGE.name}
          onDone={() => setScanDone(true)}
        />
      </div>

      {/* ─────────── Step 4: Liaison hand-off ─────────── */}
      <Step number={4} label="LIAISON" tone="liaison" />
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-[6px]">
          Personal agent &middot; handed off to a Liaison on the platform
        </div>
        <LiaisonHandoffCard
          name={MATCHED_CONCIERGE.name}
          tier={MATCHED_CONCIERGE.tier}
          tierLabel={MATCHED_CONCIERGE.tierLabel}
          rating={MATCHED_CONCIERGE.rating}
          priorJobs={MATCHED_CONCIERGE.priorJobs}
          bio={MATCHED_CONCIERGE.bio}
          revealed={scanDone}
        />
      </div>
    </div>
  );
}

function Step({
  number,
  label,
  tone,
}: {
  number: number;
  label: string;
  tone: "raw" | "enrich" | "scan" | "liaison";
}) {
  const accent =
    tone === "raw"
      ? "var(--oxblood)"
      : tone === "enrich"
      ? "var(--ochre)"
      : tone === "scan"
      ? "var(--ink-2)"
      : "var(--teal-deep)";
  return (
    <div className="flex flex-col items-center pt-[2px]">
      <div
        className="w-[44px] h-[44px] rounded-full border flex items-center justify-center font-serif italic text-[20px]"
        style={{ borderColor: accent, color: accent, background: "white" }}
      >
        {number}
      </div>
      <div
        className="mt-[6px] font-mono text-[9px] tracking-[0.18em] uppercase"
        style={{ color: accent }}
      >
        {label}
      </div>
    </div>
  );
}

function MemorySection({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-[8px] p-[14px_18px] ${
        accent ? "border-[rgba(180,140,40,0.30)]" : "border-[var(--rule)]"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] mb-[8px]">
        {title}
      </div>
      <ul className="space-y-[5px] text-[13px] leading-[1.5] text-[var(--ink-2)]">
        {items.map((it, i) => (
          <li key={i} className="flex gap-[8px]">
            <span className="text-[var(--rule-strong)] shrink-0">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
