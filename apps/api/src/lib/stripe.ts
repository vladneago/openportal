import Stripe from "stripe";

// ─────────────────────────────────────────────
// Stripe client — singleton, graceful fallback when no key is set
// ─────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeEnabled = STRIPE_SECRET_KEY.length > 0;

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeEnabled) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

// ─────────────────────────────────────────────
// Plan catalog — kept in code, not DB. Each entry is a single plan
// the platform sells. Price IDs come from Stripe Dashboard; in dev
// you can leave them empty and the checkout endpoint will return a
// stub success response.
// ─────────────────────────────────────────────

export interface PlanLimits {
  maxResources: number; // staff / rooms / equipment
  maxProducts: number;
  emailMailboxes: number;
  efacturaPerMonth: number;
  chatAiMessagesPerMonth: number;
  marketingEmailsPerMonth: number;
  smsPerMonth: number;
  hasCustomDomain: boolean;
  hasMultipleLocations: boolean;
  hasRecurringBilling: boolean;
  hasPriorityFunctionCalling: boolean;
  hasOpenPortalBrandingRemoved: boolean;
  hasPrioritySupport: boolean;
}

export interface Plan {
  slug: "solo" | "solo_pro";
  name: string;
  tagline: string;
  monthlyPriceEur: number;
  annualPriceEur: number;
  stripeMonthlyPriceId: string; // empty in dev = checkout returns stub
  stripeAnnualPriceId: string;
  trialDays: number;
  limits: PlanLimits;
}

export const PLANS: Record<"solo" | "solo_pro", Plan> = {
  solo: {
    slug: "solo",
    name: "Solo",
    tagline: "Pentru solo entrepreneurs care încep",
    monthlyPriceEur: 25,
    annualPriceEur: 240,
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_SOLO_MONTHLY || "",
    stripeAnnualPriceId: process.env.STRIPE_PRICE_SOLO_ANNUAL || "",
    trialDays: 14,
    limits: {
      maxResources: 3,
      maxProducts: 100,
      emailMailboxes: 5,
      efacturaPerMonth: 100,
      chatAiMessagesPerMonth: 500,
      marketingEmailsPerMonth: 1000,
      smsPerMonth: 50,
      hasCustomDomain: false,
      hasMultipleLocations: false,
      hasRecurringBilling: false,
      hasPriorityFunctionCalling: false,
      hasOpenPortalBrandingRemoved: false,
      hasPrioritySupport: false,
    },
  },
  solo_pro: {
    slug: "solo_pro",
    name: "Solo Pro",
    tagline: "Pentru afaceri în creștere",
    monthlyPriceEur: 50,
    annualPriceEur: 480,
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_SOLO_PRO_MONTHLY || "",
    stripeAnnualPriceId: process.env.STRIPE_PRICE_SOLO_PRO_ANNUAL || "",
    trialDays: 14,
    limits: {
      maxResources: 999,
      maxProducts: 99999,
      emailMailboxes: 20,
      efacturaPerMonth: 99999,
      chatAiMessagesPerMonth: 5000,
      marketingEmailsPerMonth: 20000,
      smsPerMonth: 500,
      hasCustomDomain: true,
      hasMultipleLocations: true,
      hasRecurringBilling: true,
      hasPriorityFunctionCalling: true,
      hasOpenPortalBrandingRemoved: true,
      hasPrioritySupport: true,
    },
  },
};

export function getPlan(slug: string): Plan | undefined {
  return PLANS[slug as keyof typeof PLANS];
}

export function getPlanPriceId(slug: string, interval: "month" | "year"): string {
  const plan = getPlan(slug);
  if (!plan) return "";
  return interval === "year" ? plan.stripeAnnualPriceId : plan.stripeMonthlyPriceId;
}
