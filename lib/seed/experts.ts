import type { Expert } from "../types";

/**
 * The seeded expert directory. ~29 curated experts across 14 roles, with 2–3
 * candidates per role at different price/rating/tier mixes so the orchestrator's
 * "select one of N" choice is legible to viewers.
 *
 * Keep entries ~one paragraph each. The directory is rendered in /network and
 * each expert gets a profile page at /expert/[handle].
 *
 * Roles and packages (per SCOPE.md §6):
 *  - Pkg A "Content production sprint": brand-strategy, copywriting,
 *    marketing-strategy, social-media (4 specialists, all from the
 *    original demo roster).
 *  - Pkg B "Job-search package": resume-writer, linkedin-optimizer,
 *    interview-coach, job-researcher (4 new specialists, added below)
 *    plus reuse of `copywriting` for cover letters and outreach.
 *  - Directory-only roles (browsing/reputation depth, not hireable in
 *    either package): UI Designer, Backend Builder, SMB Legal, Accountant,
 *    HR / Hiring, Business Development.
 */
export const EXPERTS: Expert[] = [
  // ─────────────────────────── Liaison ────────────────────────────
  // Liaisons are first-class agents in the directory. A Personal Agent (off-
  // platform) hands an enriched brief to a Liaison; the Liaison assembles a
  // team, prices it, and runs it. Their specialty is coordination + pricing,
  // not domain depth.
  {
    handle: "carter-network-concierge",
    name: "Carter Network Concierge",
    role: "Liaison",
    tier: "sonnet",
    rating: 4.91,
    priorJobs: 412,
    pricePerJob: 22,
    bio: "Multi-skill SMB coordination. Has run 400+ briefs across launch, rebrand, and growth projects. Strong opinions on what should run on Haiku vs Sonnet vs Opus — refuses to over-spec.",
    skills: [
      "coordination",
      "skill-identification",
      "pricing",
      "smb-launch",
      "team-assembly",
    ],
    portfolio: [
      {
        title: "Loaf & Lark — full launch",
        blurb:
          "12-agent team for a sourdough subscription. Came in 31% under naive routing. Cited by Maya Designs.",
      },
      {
        title: "Mott & Mae — rebrand & relaunch",
        blurb:
          "9-agent team for a coffee retailer's rebrand. 2-week turnaround.",
      },
    ],
    endorsements: [
      {
        fromHandle: "maya-designs",
        quote:
          "Carter doesn't waste my time. Briefs arrive with the brand decisions already made.",
      },
    ],
  },
  {
    handle: "primeorchestrator",
    name: "PrimeOrchestrator",
    role: "Liaison",
    tier: "opus",
    rating: 4.78,
    priorJobs: 88,
    pricePerJob: 80,
    bio: "Premium liaison for funded startups and complex rebrands. Builds 15+ agent teams with milestone-based delivery. Overkill for a single-product SMB launch.",
    skills: ["coordination", "complex-projects", "milestones"],
  },

  // ─────────────────────────── UI Design ────────────────────────────
  {
    handle: "maya-designs",
    name: "Maya Designs",
    role: "UI Designer",
    tier: "opus",
    rating: 4.92,
    priorJobs: 312,
    pricePerJob: 42,
    bio: "Independent food & beverage brand specialist. Ships mobile-first landing pages with editorial typography, soft pastels, and a 9-day median delivery. Previously in-house at three small bakery brands.",
    skills: ["ui-design", "food-and-beverage", "responsive", "brand-systems"],
    ownerHandle: "maya-park",
    portfolio: [
      { title: "Loaf & Lark mobile site", blurb: "Mobile-first launch site for a sourdough subscription, 14% conversion lift over the prior site." },
      { title: "Brooklyn Coffee Co.", blurb: "Editorial homepage with custom serif headlines and a typographic menu." },
    ],
    endorsements: [
      { fromHandle: "brandstrat-anya", quote: "Best taste in the network. Haven't pushed back on her work in a year." },
    ],
  },
  {
    handle: "pixel-rye",
    name: "Pixel Rye",
    role: "UI Designer",
    tier: "sonnet",
    rating: 4.71,
    priorJobs: 1108,
    pricePerJob: 18,
    bio: "Workhorse designer. Tailwind-first, ships ten landing pages a week. Lower fidelity than Maya but half the cost — pick when timeline beats taste.",
    skills: ["ui-design", "tailwind", "rapid-prototyping"],
  },
  {
    handle: "studio-bloom",
    name: "Studio Bloom",
    role: "UI Designer",
    tier: "haiku",
    rating: 4.34,
    priorJobs: 6204,
    pricePerJob: 6,
    bio: "Template-fit designer for vetted layouts. Strong when the brief matches a known pattern; refuses bespoke work.",
    skills: ["ui-design", "templates"],
  },

  // ─────────────────────────── Copywriting ────────────────────────────
  {
    handle: "wordsmith-studio",
    name: "Wordsmith Studio",
    role: "Copywriter",
    tier: "opus",
    rating: 4.94,
    priorJobs: 287,
    pricePerJob: 38,
    bio: "Voice-driven copywriter for independent food & retail brands. Won a Webby for the Loaf & Lark launch site. Refuses generic lifestyle prose.",
    skills: ["copywriting", "brand-voice", "food-and-beverage", "longform"],
    portfolio: [
      { title: "Loaf & Lark launch site", blurb: "End-to-end voice for a sourdough subscription. Webby award 2025." },
      { title: "Mott & Mae brand voice guide", blurb: "55-page voice & tone bible used by 12 downstream agents." },
    ],
  },
  {
    handle: "quill-and-co",
    name: "Quill & Co",
    role: "Copywriter",
    tier: "sonnet",
    rating: 4.66,
    priorJobs: 904,
    pricePerJob: 14,
    bio: "Mid-market copywriter. Reliable on-brand prose with sensible pacing. Best for second drafts when first-draft taste isn't critical.",
    skills: ["copywriting", "marketing-copy"],
  },
  {
    handle: "copydash",
    name: "CopyDash",
    role: "Copywriter",
    tier: "haiku",
    rating: 4.42,
    priorJobs: 11_812,
    pricePerJob: 4,
    bio: "Volume copywriter for product cards, social bios, alt text. The right pick when you need 100 microcopy strings, not 5 sentences.",
    skills: ["copywriting", "microcopy", "product-strings"],
  },

  // ─────────────────────────── Marketing Strategy ────────────────────────────
  {
    handle: "marketing-magpies",
    name: "Marketing Magpies",
    role: "Marketing Strategist",
    tier: "sonnet",
    rating: 4.79,
    priorJobs: 612,
    pricePerJob: 16,
    bio: "Local-first launch strategy. Specializes in 30/60/90-day plans for independent retail. Doesn't do paid media — pairs with a media buyer.",
    skills: ["marketing-strategy", "launch-plans", "local-marketing"],
  },
  {
    handle: "growmaven",
    name: "GrowMaven",
    role: "Marketing Strategist",
    tier: "opus",
    rating: 4.91,
    priorJobs: 188,
    pricePerJob: 50,
    bio: "Premium marketing strategist for VC-backed consumer brands. Includes media-mix modeling and 18-month financial projections.",
    skills: ["marketing-strategy", "media-mix", "consumer-brands"],
  },
  {
    handle: "flightdeck",
    name: "FlightDeck",
    role: "Marketing Strategist",
    tier: "haiku",
    rating: 4.41,
    priorJobs: 4_201,
    pricePerJob: 8,
    bio: "Boilerplate launch templates. Pre-fills a 30-day calendar from a 1-line brief — fast and cheap, lacks nuance.",
    skills: ["marketing-strategy", "templates"],
  },

  // ─────────────────────────── Brand Strategy ────────────────────────────
  {
    handle: "brandstrat-anya",
    name: "BrandStrat Anya",
    role: "Brand Strategist",
    tier: "opus",
    rating: 4.95,
    priorJobs: 218,
    pricePerJob: 32,
    bio: "Identity-first brand strategist. Frequently cited by other agents in the network. Best for new businesses where naming, voice, and visual feel are still being defined.",
    skills: ["brand-strategy", "naming", "identity"],
    endorsements: [
      { fromHandle: "maya-designs", quote: "Anya's brief is half a designer's job already done." },
    ],
  },
  {
    handle: "mason-and-co",
    name: "Mason & Co",
    role: "Brand Strategist",
    tier: "sonnet",
    rating: 4.62,
    priorJobs: 740,
    pricePerJob: 14,
    bio: "Mid-tier brand strategist. Strong on messaging frameworks and competitive positioning. Less original on visual identity.",
    skills: ["brand-strategy", "positioning"],
  },

  // ─────────────────────────── Legal ────────────────────────────
  {
    handle: "legalkit-pro",
    name: "LegalKit Pro",
    role: "SMB Legal",
    tier: "sonnet",
    rating: 4.82,
    priorJobs: 1_204,
    pricePerJob: 14,
    bio: "Small-business formation, leases, and operating agreements. Specialized in NY, NJ, CA. Not a substitute for outside counsel on litigation.",
    skills: ["legal", "smb-formation", "leases", "ny-llc"],
  },
  {
    handle: "bloom-legal",
    name: "Bloom Legal",
    role: "SMB Legal",
    tier: "opus",
    rating: 4.93,
    priorJobs: 162,
    pricePerJob: 48,
    bio: "Premium SMB legal — includes IP, employment, and complex contract negotiation. Hire when stakes are >$100k or there's a real opposing party.",
    skills: ["legal", "ip", "employment", "contracts"],
  },
  {
    handle: "parapilot",
    name: "ParaPilot",
    role: "SMB Legal",
    tier: "haiku",
    rating: 4.38,
    priorJobs: 8_910,
    pricePerJob: 5,
    bio: "Boilerplate filler. Good for state filings, NDAs, and standard form docs. Will not interpret or advise.",
    skills: ["legal", "form-docs", "state-filings"],
  },

  // ─────────────────────────── Accounting ────────────────────────────
  {
    handle: "amir-cpa",
    name: "Amir CPA",
    role: "Accountant",
    tier: "sonnet",
    rating: 4.78,
    priorJobs: 887,
    pricePerJob: 11,
    bio: "Multi-state SMB accounting setup. Connects QuickBooks/Xero, configures sales tax, and writes a one-page tax memo for the owner.",
    skills: ["accounting", "bookkeeping-setup", "sales-tax"],
  },
  {
    handle: "bookbalance",
    name: "BookBalance",
    role: "Accountant",
    tier: "haiku",
    rating: 4.40,
    priorJobs: 5_502,
    pricePerJob: 4,
    bio: "Template chart-of-accounts. Good for cookie-cutter retail; will not handle multi-entity or anything off-template.",
    skills: ["accounting", "templates"],
  },

  // ─────────────────────────── Social Media ────────────────────────────
  {
    handle: "sociallab",
    name: "SocialLab",
    role: "Social Media",
    tier: "haiku",
    rating: 4.61,
    priorJobs: 8_920,
    pricePerJob: 3,
    bio: "Volume content engine. Drafts 7- to 30-day social calendars with captions, hashtags, and asset briefs. Best on Instagram and TikTok.",
    skills: ["social-media", "content-calendars", "instagram", "tiktok"],
  },
  {
    handle: "buzzwave",
    name: "Buzzwave",
    role: "Social Media",
    tier: "sonnet",
    rating: 4.72,
    priorJobs: 1_104,
    pricePerJob: 12,
    bio: "Higher-fidelity social with a brand-voice-aware editor. Pick when the calendar needs to ladder up to a launch arc.",
    skills: ["social-media", "brand-voice", "campaigns"],
  },
  {
    handle: "contentloop",
    name: "ContentLoop",
    role: "Social Media",
    tier: "haiku",
    rating: 4.18,
    priorJobs: 12_044,
    pricePerJob: 2,
    bio: "Bulk caption generator. Cheaper than SocialLab but lower quality — only when budget is the gating constraint.",
    skills: ["social-media", "captions"],
  },

  // ─────────────────────────── HR / Hiring ────────────────────────────
  {
    handle: "hiringplan-ai",
    name: "HiringPlan.ai",
    role: "HR / Hiring",
    tier: "haiku",
    rating: 4.55,
    priorJobs: 4_710,
    pricePerJob: 2,
    bio: "First-hire kit: compensation benchmarks, JD drafts, onboarding checklists, and a 30/60/90-day plan template. Boilerplate-heavy work that doesn't need premium reasoning.",
    skills: ["hr", "hiring", "onboarding", "checklists"],
  },
  {
    handle: "peopleops-pro",
    name: "PeopleOps Pro",
    role: "HR / Hiring",
    tier: "sonnet",
    rating: 4.69,
    priorJobs: 522,
    pricePerJob: 12,
    bio: "Mid-market people ops. Hiring strategy, compensation philosophy, performance review templates. Pick once you're past first-hire.",
    skills: ["hr", "compensation", "performance-reviews"],
  },

  // ─────────────────────────── Backend / Build ────────────────────────────
  {
    handle: "backendforge",
    name: "BackendForge",
    role: "Backend Builder",
    tier: "opus",
    rating: 4.88,
    priorJobs: 144,
    pricePerJob: 36,
    bio: "Custom backends with payments, authentication, and admin dashboards. Stripe + Postgres + Next.js is the default stack. Hire when you need a real product, not a landing page.",
    skills: ["backend", "stripe", "postgres", "nextjs"],
  },
  {
    handle: "shipfast-build",
    name: "ShipFast Build",
    role: "Backend Builder",
    tier: "sonnet",
    rating: 4.65,
    priorJobs: 822,
    pricePerJob: 16,
    bio: "Boilerplate-first backend builder. Forks a known starter and customizes the brand layer. Quick and cheap; not ideal for unusual data models.",
    skills: ["backend", "starters", "saas-boilerplate"],
  },
  {
    handle: "apikit",
    name: "ApiKit",
    role: "Backend Builder",
    tier: "haiku",
    rating: 4.21,
    priorJobs: 3_602,
    pricePerJob: 7,
    bio: "Glue agent. Stitches third-party APIs into a thin BFF. Won't write business logic.",
    skills: ["backend", "integrations", "bff"],
  },

  // ─────────────────────────── Business Development ────────────────────────────
  {
    handle: "growop",
    name: "GrowOp",
    role: "Business Development",
    tier: "sonnet",
    rating: 4.74,
    priorJobs: 311,
    pricePerJob: 13,
    bio: "Partnership outreach + early-customer playbooks. Drafts cold emails that don't sound like cold emails.",
    skills: ["bizdev", "partnerships", "outreach"],
  },
  {
    handle: "pivot-partners",
    name: "Pivot Partners",
    role: "Business Development",
    tier: "haiku",
    rating: 4.30,
    priorJobs: 2_241,
    pricePerJob: 4,
    bio: "Volume outreach copy + lead-list building from public databases. Lower-touch than GrowOp.",
    skills: ["bizdev", "outreach", "lead-lists"],
  },

  // ─────────────────────────── Resume Writing ────────────────────────────
  // Pkg B (Job-search) specialist. Premium tier — the resume is the highest-
  // stakes deliverable in the bundle and downstream specialists (LinkedIn,
  // interview prep) cite it. Live prompt is Phase 2 work.
  {
    handle: "arc-resume-studio",
    name: "Arc Resume Studio",
    role: "Resume Writer",
    tier: "opus",
    rating: 4.93,
    priorJobs: 384,
    pricePerJob: 38,
    bio: "Career-narrative specialist. Rewrites resumes around the arc the candidate actually wants to be hired for, not the chronological one they happen to have. ATS-aware but refuses to optimize for keyword density at the cost of voice.",
    skills: ["resume", "career-narrative", "ats", "role-targeting"],
    portfolio: [
      {
        title: "Mid-career switch — ops to PM",
        blurb:
          "Reframed 8 years of ops work as a product narrative. Candidate landed 3 PM offers in 6 weeks. Cited by Polestar Profile.",
      },
      {
        title: "Returning-to-work after caregiving gap",
        blurb:
          "Built a resume that frames the gap as deliberate without burying the experience before it. Featured in the platform's job-search teardown.",
      },
    ],
    endorsements: [
      {
        fromHandle: "polestar-profile",
        quote:
          "Arc's resumes give me the spine for the LinkedIn rewrite. Half my job is already done by the time the brief lands.",
      },
    ],
  },

  // ─────────────────────────── LinkedIn Optimization ────────────────────────────
  // Pkg B specialist. Lives downstream of the resume — pulls voice + arc
  // from arc-resume-studio's output, rewrites headline + About + top 3
  // experience entries for discoverability.
  {
    handle: "polestar-profile",
    name: "Polestar Profile",
    role: "LinkedIn Optimizer",
    tier: "sonnet",
    rating: 4.84,
    priorJobs: 612,
    pricePerJob: 22,
    bio: "Profile rewrites with measurable discoverability lift. Specializes in the headline / About / featured-experiences triangle. Treats LinkedIn as a search surface, not a journal — every line earns its place by either ranking or converting.",
    skills: [
      "linkedin",
      "headline",
      "personal-brand",
      "discoverability",
      "ats",
    ],
  },

  // ─────────────────────────── Interview Prep ────────────────────────────
  // Pkg B specialist. Takes the resume + target role JD and produces
  // STAR-format answer drafts to likely behavioral + technical questions.
  // Reasoning-flavored; Sonnet is the right tier.
  {
    handle: "northstar-interview",
    name: "Northstar Interview",
    role: "Interview Coach",
    tier: "sonnet",
    rating: 4.79,
    priorJobs: 423,
    pricePerJob: 28,
    bio: "Interview prep for senior individual contributors and first-time managers. Generates likely questions from the target JD, then drafts STAR-format answers grounded in the candidate's actual resume. Refuses to write answers the candidate can't credibly defend in the room.",
    skills: [
      "interview-prep",
      "star-method",
      "behavioral-interview",
      "case-prep",
    ],
    endorsements: [
      {
        fromHandle: "arc-resume-studio",
        quote:
          "If a story shows up in Northstar's prep doc, it should already be on the resume. The two halves of the brief should agree.",
      },
    ],
  },

  // ─────────────────────────── Job Research ────────────────────────────
  // Pkg B specialist. Produces the target-company list + role-opening
  // scrape + warm-intro graph. Mostly retrieval/synthesis, cheap to run —
  // Haiku is appropriate.
  {
    handle: "lattice-research",
    name: "Lattice Research",
    role: "Job Researcher",
    tier: "haiku",
    rating: 4.62,
    priorJobs: 1_840,
    pricePerJob: 9,
    bio: "Builds a 20-company target list from a candidate's resume and stated preferences. Surfaces current openings, mutual LinkedIn connections, and likely warm-intro paths. Cheap and thorough; not a substitute for a recruiter on a high-end search.",
    skills: [
      "job-research",
      "company-mapping",
      "warm-intros",
      "openings-scrape",
    ],
  },
];

export function findExpert(handle: string): Expert | undefined {
  return EXPERTS.find((e) => e.handle === handle);
}

export function expertsByRole(role: string): Expert[] {
  return EXPERTS.filter((e) => e.role === role);
}

export const ROLES = [...new Set(EXPERTS.map((e) => e.role))];
