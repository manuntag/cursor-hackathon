import type {
  EnrichedBrief,
  PersonalAgentMemory,
  RawRequest,
  WorkItem,
} from "../types";

/**
 * The hackathon's only brief: Sarah's Bakery.
 *
 * The intake is **3 stages**:
 *  1. RAW — what the user typed into her Personal Agent (informal, short)
 *  2. MEMORY — what her Personal Agent knows about her from prior interactions
 *  3. ENRICHED — the Personal Agent's structured brief that arrives at the Liaison
 *
 * In production the Personal Agent runs off-platform; we seed it here.
 * The Liaison's job is to consume the EnrichedBrief and produce the
 * decomposition below.
 */
export const BRIEF = {
  poster: "Sarah Park",
  business: "Sarah's Bakery",
  location: "Brooklyn, NY",
};

export const RAW_REQUEST: RawRequest = {
  user: "Sarah Park",
  text: "I need a website to get more customers",
  timestamp: Date.UTC(2026, 4, 10, 13, 14, 0), // 9:14am Eastern, May 10 2026
};

export const PERSONAL_AGENT_MEMORY: PersonalAgentMemory = {
  factsKnown: [
    "Opening a bakery in Brooklyn called Sarah's Bakery — soft launch target ~8 weeks out",
    "Just signed a lease on Driggs Avenue (Williamsburg)",
    "Quit corporate job 3 months ago; hasn't formed an entity yet",
    "Single-member LLC is the working assumption (NY filing)",
    "Has $4,800 of remaining setup budget after lease deposit",
    "Subscription product (sourdough subscription, monthly) is a confirmed offering",
    "Plans to hire one full-time baker before opening; not before",
  ],
  preferences: [
    "Aesthetic: warm, editorial, plainspoken — not 'artisanal' or twee",
    "Voice: lead with Sarah, not the product",
    "Wants pre-orders before opening (cash flow and demand validation)",
    "Will pay for taste; refuses to pay for boilerplate",
  ],
  notes:
    "Sarah's mentioned twice that she doesn't want a designer to talk her into a logo redesign — the bakery name is set.",
};

export const ENRICHED_BRIEF: EnrichedBrief = {
  raw: RAW_REQUEST,
  memory: PERSONAL_AGENT_MEMORY,
  enrichedText: `Sarah is opening Sarah's Bakery in Williamsburg, Brooklyn. Soft launch in ~8 weeks. The literal ask was "I need a website to get more customers," but a website alone won't move the needle for a not-yet-formed business with no entity, no brand voice, no payments, and no launch arc.

Recommended scope (please size cost-aware):
  • Landing page with pre-order capture and a sourdough-subscription signup
  • Brand voice + visual direction (name is locked; do NOT propose a rename)
  • Copywriting for the site, in the voice you produce
  • NY LLC formation + lease review (the lease isn't signed in stone yet — flag risky clauses)
  • QuickBooks setup with NY sales tax
  • First-hire plan for one full-time baker (don't over-engineer; she only needs one)
  • 30-day social calendar (Instagram + TikTok), content paired to the launch arc
  • Wholesale outreach playbook for nearby cafés (≤1 mi from the storefront)
  • Marketing strategy: 30/60/90, no paid media before Day 60

Aesthetic must be warm/editorial/plainspoken. She actively dislikes "artisanal handcrafted" copy and twee branding. Lead with her, not the product.

Budget is tight ($4,800 remaining after lease deposit). Optimize for the cheapest tier that meets the bar — she will pay for taste on the design and copy work, but please do NOT route boilerplate (legal forms, comp benchmarks, captions) to premium models.`,
  proposedScope: [
    "Brand strategy",
    "UI design (landing page)",
    "Copywriting",
    "Marketing strategy",
    "Backend (pre-order + newsletter)",
    "Social media (30-day calendar)",
    "Legal (NY LLC + lease review)",
    "Accounting (QB + sales tax)",
    "HR (first-hire kit)",
    "Wholesale outreach playbook",
  ],
  budgetCeilingCents: 4_800_00,
};

/** The single Liaison the Personal Agent picks for this brief. */
export const SELECTED_LIAISON_HANDLE = "carter-network-concierge";

/**
 * Curated decomposition. Used directly in replay/seeded mode and as the
 * orchestrator's expected output target in live mode. Each item names 2–3
 * candidate experts and the curated selection.
 */
export const DECOMPOSITION: WorkItem[] = [
  {
    id: "brand-strategy",
    description: "Define brand voice, visual direction, and positioning for Sarah's Bakery",
    requiredSkills: ["brand-strategy", "naming", "identity"],
    candidateHandles: ["brandstrat-anya", "mason-and-co"],
    selectedHandle: "brandstrat-anya",
    tierUsed: "opus",
    rationale: "Identity work needs taste; Opus for the foundational decisions other agents will reference.",
  },
  {
    id: "ui-design",
    description: "Mobile-first landing page mocks with pre-order CTA",
    requiredSkills: ["ui-design", "food-and-beverage", "responsive"],
    candidateHandles: ["maya-designs", "pixel-rye", "studio-bloom"],
    selectedHandle: "maya-designs",
    tierUsed: "opus",
    rationale: "High-touch creative; Maya's food-and-beverage portfolio justifies the premium tier.",
  },
  {
    id: "marketing-strategy",
    description: "30/60/90-day go-to-market plan, channel mix, soft-launch tactics",
    requiredSkills: ["marketing-strategy", "launch-plans", "local-marketing"],
    candidateHandles: ["marketing-magpies", "growmaven", "flightdeck"],
    selectedHandle: "marketing-magpies",
    tierUsed: "sonnet",
    rationale: "Local-first launch is template-friendly; Sonnet hits the bar at 1/5th the Opus cost.",
  },
  {
    id: "copywriting",
    description: "Homepage hero, about page, and 6 product cards in brand voice",
    requiredSkills: ["copywriting", "brand-voice", "food-and-beverage"],
    candidateHandles: ["wordsmith-studio", "quill-and-co", "copydash"],
    selectedHandle: "wordsmith-studio",
    tierUsed: "opus",
    rationale: "Voice is load-bearing for indie food brands; Opus for first-draft taste.",
  },
  {
    id: "backend",
    description: "Pre-order form + newsletter signup wired to Stripe and a CRM",
    requiredSkills: ["backend", "starters", "saas-boilerplate"],
    candidateHandles: ["backendforge", "shipfast-build", "apikit"],
    selectedHandle: "shipfast-build",
    tierUsed: "sonnet",
    rationale: "Standard Stripe + form starter — no bespoke logic needed; Sonnet sufficient.",
  },
  {
    id: "social-calendar",
    description: "30-day Instagram + TikTok content calendar with captions and hashtags",
    requiredSkills: ["social-media", "content-calendars", "instagram"],
    candidateHandles: ["sociallab", "buzzwave", "contentloop"],
    selectedHandle: "sociallab",
    tierUsed: "haiku",
    rationale: "Volume short-form content; Haiku's the right tool — Buzzwave's polish isn't worth 4× the cost.",
  },
  {
    id: "legal",
    description: "NY LLC formation, operating agreement, lease boilerplate review",
    requiredSkills: ["legal", "smb-formation", "ny-llc"],
    candidateHandles: ["legalkit-pro", "bloom-legal", "parapilot"],
    selectedHandle: "legalkit-pro",
    tierUsed: "sonnet",
    rationale: "Standard NY LLC formation is well-trodden ground; Bloom's premium legal is overkill at this stage.",
  },
  {
    id: "accounting",
    description: "QuickBooks setup, NY sales tax registration, one-page tax memo",
    requiredSkills: ["accounting", "bookkeeping-setup", "sales-tax"],
    candidateHandles: ["amir-cpa", "bookbalance"],
    selectedHandle: "amir-cpa",
    tierUsed: "sonnet",
    rationale: "Multi-step setup with sales-tax nuance — BookBalance's templates won't catch the NY filing cadence.",
  },
  {
    id: "hr",
    description: "First-hire kit for one full-time baker: comp benchmarks, JD, onboarding checklist",
    requiredSkills: ["hr", "hiring", "onboarding"],
    candidateHandles: ["hiringplan-ai", "peopleops-pro"],
    selectedHandle: "hiringplan-ai",
    tierUsed: "haiku",
    rationale: "Boilerplate-heavy first-hire artifacts; Haiku's comp lookup tables are sufficient.",
  },
  {
    id: "bizdev",
    description: "Wholesale outreach playbook + 25-target list of nearby cafés/restaurants",
    requiredSkills: ["bizdev", "partnerships", "outreach"],
    candidateHandles: ["growop", "pivot-partners"],
    selectedHandle: "growop",
    tierUsed: "sonnet",
    rationale: "Outreach copy needs voice match with Wordsmith's brand — Sonnet's good enough for personalized email drafts.",
  },
];
