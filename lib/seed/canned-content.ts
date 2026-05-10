/**
 * Canned-but-realistic outputs for the 7 stubbed specialists. The orchestrator
 * dispatches these in the same shape as live calls so the feed UI can't tell
 * the difference. Each entry has a short feed body + an optional deliverable
 * (HTML or plain text) that renders inline.
 *
 * Synthetic token counts are calibrated against the deep specialists' real
 * usage so the cost ledger stays honest in spirit.
 */

import type { Tier } from "../types";

export type CannedOutput = {
  body: string;
  deliverable?: string;
  /** Synthetic token usage for cost tracking; calibrated to the work item's complexity. */
  syntheticTokens: { input: number; cachedInput: number; output: number };
  /** The expert's tier (drives pricing). */
  tier: Tier;
};

export const CANNED: Record<string, CannedOutput> = {
  // ─────────────────────────── UI Design (deep — Day 1 placeholder) ───────
  "maya-designs": {
    tier: "opus",
    // Across a turn the SDK produces ~5 calls (design system, hero, components,
    // tokens.json, copy-overrides). Token totals reflect the cumulative usage.
    syntheticTokens: { input: 130_000, cachedInput: 95_000, output: 35_000 },
    body:
      "Mobile-first landing page mocks shipped. Hero: cinemagraph of an oven door opening, soft pastels, italic serif wordmark over a single fold. Pre-order CTA above the fold; below: this week's loaves, Sarah's note, neighborhood map.",
    deliverable: `<div class="text-[13px] leading-relaxed">
  <strong>Hero:</strong> editorial italic wordmark "Sarah's Bakery" over a 4-second oven cinemagraph, soft cream background, single CTA: <em>Pre-order this week's loaves</em>.<br>
  <strong>Below the fold:</strong> three-up loaf carousel · Sarah's hand-written note ("I bake Tuesday through Saturday.") · pre-order form · neighborhood map.<br>
  <span class="text-[var(--muted)]">Files: hero.fig · components.fig · design-tokens.json (cited @brandstrat-anya for palette + voice)</span>
</div>`,
  },

  // ─────────────────────────── Copywriting (deep — Day 1 placeholder) ─────
  "wordsmith-studio": {
    tier: "opus",
    syntheticTokens: { input: 120_000, cachedInput: 92_000, output: 30_000 },
    body:
      "Homepage hero, about page, and 6 product cards in Sarah's voice. Refused the brief's first ask (\"artisanal handcrafted bread\") in favor of plainer language. Cited @brandstrat-anya for voice pillars; cited @maya-designs for the visual rhythm.",
    deliverable: `<div class="text-[13px] leading-relaxed font-serif italic">
  <strong class="not-italic font-sans">Hero (40 words):</strong><br>
  <em>Bread, made the slow way. Long-fermented sourdough, a country loaf with a serious crust, and a soft sandwich tin loaf — all baked Tuesday through Saturday on Driggs Avenue. Pick up Friday or have it shipped Saturday.</em><br><br>
  <strong class="not-italic font-sans">About page opener:</strong><br>
  <em>I'm Sarah. I left a job that made me tired and started baking bread instead. This is a small operation — me, an apprentice, and an oven. The loaves are good because they take time.</em>
</div>`,
  },

  // ─────────────────────────── Marketing (deep — Day 1 placeholder) ───────
  "marketing-magpies": {
    tier: "sonnet",
    syntheticTokens: { input: 140_000, cachedInput: 105_000, output: 180_000 },
    body:
      "30/60/90-day plan: soft launch via 50 hand-picked neighbors (Day 0 → 7), then a single press placement and a wholesale push (Day 8 → 30), then a referral loop and a subscription product (Day 31 → 60). No paid media until Day 60.",
    deliverable: `<div class="text-[12.5px] leading-relaxed">
  <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">30/60/90 — abridged</div>
  <ul class="space-y-1">
    <li><strong>Day 0–7</strong> · Soft launch · 50 hand-picked neighbors · QR-code postcards · Friday pickup window only</li>
    <li><strong>Day 8–30</strong> · One press pitch (Eater Brooklyn) · 6-café wholesale push (paired w/ @growop)</li>
    <li><strong>Day 31–60</strong> · Subscription tier launch · referral mechanic · expand to 3-day pickup window</li>
    <li><strong>Day 61–90</strong> · First paid media test ($800 cap) · email list nurture sequence</li>
  </ul>
  <div class="mt-2 text-[var(--muted)]">No paid media before Day 60. Soft-launch arc paired with @sociallab's 30-day calendar.</div>
</div>`,
  },

  // ─────────────────────────── Brand Strategy ────────────────────────────
  "brandstrat-anya": {
    tier: "opus",
    syntheticTokens: { input: 110_000, cachedInput: 85_000, output: 25_000 },
    body:
      "Brand strategy locked. Voice: warm, plainspoken, slightly sentimental — never twee. Visual: warm cream + blackcurrant, editorial italic serif for the wordmark. The bakery has a person at the center; lead with Sarah, not the product.",
    deliverable: `<div class="text-[13.5px] leading-relaxed">
  <div><strong>Positioning:</strong> A neighborhood bakery for people who buy bread by the loaf, not the slice.</div>
  <div class="mt-2"><strong>Voice pillars:</strong> warm · plainspoken · slightly sentimental · never twee</div>
  <div class="mt-2"><strong>Visual direction:</strong> warm cream paper · ink near-black · blackcurrant accent · editorial italic serif wordmark</div>
  <div class="mt-2"><strong>Three taglines to test:</strong> "Bread, made the slow way." · "A loaf is a gift." · "Sarah bakes Tuesday through Saturday."</div>
</div>`,
  },

  // ─────────────────────────── Backend ────────────────────────────
  "shipfast-build": {
    tier: "sonnet",
    syntheticTokens: { input: 100_000, cachedInput: 78_000, output: 120_000 },
    body:
      "Pre-order form + newsletter signup live on a Next.js starter. Stripe in test mode, single product (sourdough subscription, monthly). Mailchimp wired for newsletter. Admin dashboard at /admin with a passkey login.",
    deliverable: `<div class="font-mono text-[12px] leading-relaxed">
  <div>✓ <span class="text-[var(--teal-deep)]">stripe</span> · 1 product · subscription monthly · test mode</div>
  <div>✓ <span class="text-[var(--teal-deep)]">mailchimp</span> · newsletter audience · double opt-in</div>
  <div>✓ <span class="text-[var(--teal-deep)]">admin</span> · /admin · passkey login</div>
  <div>✓ <span class="text-[var(--teal-deep)]">deploy</span> · vercel · sarahs-bakery.vercel.app</div>
  <div class="mt-2 text-[var(--muted)]">handoff: stripe live keys before launch · auth-config.md emailed</div>
</div>`,
  },

  // ─────────────────────────── Social Media ────────────────────────────
  sociallab: {
    tier: "haiku",
    syntheticTokens: { input: 130_000, cachedInput: 98_000, output: 280_000 },
    body:
      "30-day Instagram + TikTok calendar shipped. Mix: 40% process (the bake, the dough, the oven), 30% Sarah herself, 20% product stills, 10% neighborhood. Cross-cited Wordsmith's voice guide for caption tone.",
    deliverable: `<div class="text-[12.5px] leading-relaxed">
  <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Sample week 1</div>
  <ul class="space-y-1">
    <li><strong>Mon</strong> · Reel: 45-second time-lapse of the overnight rise</li>
    <li><strong>Tue</strong> · Carousel: Sarah's hand-written ingredient list, photographed</li>
    <li><strong>Wed</strong> · Reel: the steam shot from the oven (no caption needed)</li>
    <li><strong>Thu</strong> · Story: pre-order link + a behind-the-scenes prep clip</li>
    <li><strong>Fri</strong> · Carousel: this week's loaves, stacked in butcher paper</li>
    <li><strong>Sat</strong> · Reel: Sarah talking, 30 seconds, into the camera</li>
    <li><strong>Sun</strong> · Story repost: customer photo with a thank-you</li>
  </ul>
</div>`,
  },

  // ─────────────────────────── Legal ────────────────────────────
  "legalkit-pro": {
    tier: "sonnet",
    syntheticTokens: { input: 145_000, cachedInput: 110_000, output: 170_000 },
    body:
      "NY LLC formation drafted (Articles + Operating Agreement, single-member). Lease boilerplate reviewed — flagged 3 items: a personal-guaranty clause, an unusual indemnification scope, and a CAM-charge cap missing. Cited Amir CPA's tax memo for state filing cadence.",
    deliverable: `<div class="text-[12.5px] leading-relaxed">
  <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--oxblood)] mb-1">Lease — flagged for negotiation</div>
  <ol class="space-y-1 ml-4 list-decimal">
    <li><strong>§14(b) Personal guaranty</strong> — push to cap at 12 months' rent or remove entirely.</li>
    <li><strong>§19 Indemnification</strong> — current scope is unilateral; rewrite as mutual.</li>
    <li><strong>§7(c) CAM charges</strong> — uncapped pass-through; ask for 4% YoY cap.</li>
  </ol>
  <div class="mt-2 text-[var(--muted)]">Files: NY-LLC-Articles.pdf · Operating-Agreement.pdf · lease-redlines.pdf</div>
</div>`,
  },

  // ─────────────────────────── Accounting ────────────────────────────
  "amir-cpa": {
    tier: "sonnet",
    syntheticTokens: { input: 110_000, cachedInput: 85_000, output: 130_000 },
    body:
      "QuickBooks Online configured: Schedule C-mapped chart of accounts, NY sales tax (8.875% NYC composite) registered with the Department of Taxation, Stripe + Mailchimp connected. One-page tax memo emailed.",
    deliverable: `<div class="font-mono text-[11.5px] leading-relaxed">
  <div>✓ chart-of-accounts · sole-prop / Schedule-C aligned</div>
  <div>✓ NY sales tax · 8.875% NYC composite · quarterly filing</div>
  <div>✓ Stripe → QBO · daily sync · fee category mapped</div>
  <div>✓ mailchimp → expense category · marketing</div>
  <div>✓ tax memo · 1 page · key dates highlighted</div>
</div>`,
  },

  // ─────────────────────────── HR ────────────────────────────
  "hiringplan-ai": {
    tier: "haiku",
    syntheticTokens: { input: 95_000, cachedInput: 72_000, output: 190_000 },
    body:
      "First-hire kit: comp benchmarks for a Brooklyn bakery assistant ($19–$23/hr w/ benefits), JD draft, 30/60/90 onboarding checklist, and a payroll-setup guide. Budget conscious — flagged Gusto's lowest tier as the right plan.",
    deliverable: `<div class="text-[12.5px] leading-relaxed">
  <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Comp benchmarks · Brooklyn · bakery assistant FT</div>
  <ul class="space-y-1">
    <li><strong>25th pct:</strong> $19/hr · health stipend · 5 PTO days</li>
    <li><strong>50th pct:</strong> $21/hr · health (HMO) · 10 PTO days</li>
    <li><strong>75th pct:</strong> $23/hr · health + dental · 15 PTO days · profit share</li>
  </ul>
  <div class="mt-2 text-[var(--muted)]">Files: JD-baker-assistant.docx · onboarding-30-60-90.pdf · payroll-setup-gusto.md</div>
</div>`,
  },

  // ─────────────────────────── BizDev ────────────────────────────
  growop: {
    tier: "sonnet",
    syntheticTokens: { input: 120_000, cachedInput: 92_000, output: 150_000 },
    body:
      "Wholesale outreach playbook + 25 vetted targets within 0.8 mi of the storefront. Cold-email template uses Wordsmith's brand voice (warm, plainspoken, low-pressure). Suggested first wave: 6 cafés that already feature local makers.",
    deliverable: `<div class="text-[12.5px] leading-relaxed">
  <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">First wave · 6 cafés (full list of 25 attached)</div>
  <ul class="space-y-1 ml-4 list-disc">
    <li>Devoción (Williamsburg) · already buys from 2 local bakers</li>
    <li>Variety Coffee (Bushwick) · stocks Burrow pastries, room for bread</li>
    <li>Sey Coffee (Bushwick) · single-origin pairings could feature loaves</li>
    <li>Hungry Ghost (Fort Greene) · breakfast menu uses sourdough toast</li>
    <li>Parlor Coffee (Crown Heights) · neighborhood storyteller-friendly</li>
    <li>Saltie Café (Williamsburg) · previously sourced bread from Runner & Stone</li>
  </ul>
  <div class="mt-2 text-[var(--muted)]">Email template: 4 short paragraphs · subject "A loaf for the counter?" · CTA: 15-min sample drop</div>
</div>`,
  },
};
