import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  tenantSubscriptions,
  tenants,
  users,
} from "@openportal/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { getStripe, stripeEnabled, getPlan, getPlanPriceId, PLANS } from "../../lib/stripe";
import { getTenantUsage } from "../../lib/plan-limits";

// ─────────────────────────────────────────────
// Platform billing — OpenPortal charges tenant for its own use of the
// platform. NOT to be confused with /billing (tenants invoicing their
// own customers).
//
// Routes auth-required (the tenant owner is buying).
// ─────────────────────────────────────────────

export const platformBillingRoutes = new Hono();
platformBillingRoutes.use("*", requireAuth);

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

// ─────────────────────────────────────────────
// GET /api/v1/billing/platform/subscription
// Returns the tenant's current subscription state + plan limits.
// ─────────────────────────────────────────────

platformBillingRoutes.get("/subscription", async (c) => {
  const tenantId = c.get("tenantId");

  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub) {
    // No subscription yet — implicit trial. Compute trial end if tenant was
    // created recently, otherwise treat as expired.
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");

    const trialDays = 14;
    const trialEndsAt = new Date(tenant.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const isTrialing = trialEndsAt.getTime() > Date.now();

    return c.json({
      success: true,
      data: {
        hasSubscription: false,
        status: isTrialing ? "trialing" : "incomplete",
        planSlug: "solo",
        plan: PLANS.solo,
        trialEndsAt: trialEndsAt.toISOString(),
        trialDaysRemaining: Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeEnabled,
      },
    });
  }

  const plan = getPlan(sub.planSlug);
  if (!plan) {
    throw new AppError(500, "PLAN_NOT_FOUND", `Plan ${sub.planSlug} no longer exists in catalog`);
  }

  return c.json({
    success: true,
    data: {
      hasSubscription: true,
      status: sub.status,
      planSlug: sub.planSlug,
      plan,
      trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
      trialDaysRemaining: sub.trialEndsAt
        ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))
        : 0,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
      stripeEnabled,
    },
  });
});

// ─────────────────────────────────────────────
// GET /api/v1/billing/platform/usage
// Returns current consumption per metered/capped resource vs plan limit.
// ─────────────────────────────────────────────

platformBillingRoutes.get("/usage", async (c) => {
  const tenantId = c.get("tenantId");
  const usage = await getTenantUsage(tenantId);
  return c.json({ success: true, data: usage });
});

// ─────────────────────────────────────────────
// GET /api/v1/billing/platform/plans
// Public-ish: list all plans available for purchase.
// ─────────────────────────────────────────────

platformBillingRoutes.get("/plans", async (c) => {
  return c.json({
    success: true,
    data: {
      plans: Object.values(PLANS),
      stripeEnabled,
    },
  });
});

// ─────────────────────────────────────────────
// POST /api/v1/billing/platform/checkout
// Creates a Stripe Checkout session for the chosen plan + interval.
// In dev (no STRIPE_SECRET_KEY) returns a stub success URL.
// ─────────────────────────────────────────────

const checkoutSchema = z.object({
  planSlug: z.enum(["solo", "solo_pro"]),
  interval: z.enum(["month", "year"]).default("month"),
});

platformBillingRoutes.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const authUser = c.get("user");
  const userId = authUser.id;
  const { planSlug, interval } = c.req.valid("json");

  const plan = getPlan(planSlug);
  if (!plan) throw new AppError(400, "INVALID_PLAN", "Plan not found");

  // Dev fallback: when Stripe isn't configured, simulate a successful
  // upgrade by creating/updating the local subscription record and
  // returning a sentinel URL.
  if (!stripeEnabled) {
    await upsertLocalSubscriptionStub(tenantId, planSlug, interval);
    return c.json({
      success: true,
      data: {
        stub: true,
        url: `${WEB_BASE_URL}/dashboard?upgrade=success&plan=${planSlug}&interval=${interval}`,
        message: "STRIPE_SECRET_KEY not configured — simulating upgrade locally",
      },
    });
  }

  const priceId = getPlanPriceId(planSlug, interval);
  if (!priceId) {
    throw new AppError(500, "PRICE_NOT_CONFIGURED", `Stripe price ID missing for ${planSlug}/${interval}`);
  }

  // Find user email for prefill
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

  // Get or create Stripe customer
  let stripeCustomerId: string | null = null;
  const [existing] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (existing?.stripeCustomerId) {
    stripeCustomerId = existing.stripeCustomerId;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${WEB_BASE_URL}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEB_BASE_URL}/preturi?upgrade=cancelled`,
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : user.email,
    client_reference_id: tenantId,
    metadata: {
      tenantId,
      planSlug,
      userId,
    },
    subscription_data: {
      trial_period_days: existing ? undefined : plan.trialDays,
      metadata: {
        tenantId,
        planSlug,
      },
    },
    allow_promotion_codes: true,
  });

  return c.json({
    success: true,
    data: { stub: false, url: session.url, sessionId: session.id },
  });
});

// ─────────────────────────────────────────────
// POST /api/v1/billing/platform/portal
// Creates a Stripe Customer Portal session for self-service billing
// (update card, cancel, view invoices). Requires existing subscription.
// ─────────────────────────────────────────────

platformBillingRoutes.post("/portal", async (c) => {
  const tenantId = c.get("tenantId");

  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!stripeEnabled) {
    return c.json({
      success: true,
      data: {
        stub: true,
        url: `${WEB_BASE_URL}/dashboard?portal=stub`,
        message: "STRIPE_SECRET_KEY not configured",
      },
    });
  }

  if (!sub?.stripeCustomerId) {
    throw new AppError(400, "NO_SUBSCRIPTION", "Nu există abonament Stripe — folosește mai întâi checkout");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${WEB_BASE_URL}/dashboard`,
  });

  return c.json({ success: true, data: { stub: false, url: session.url } });
});

// ─────────────────────────────────────────────
// Helper: simulate a paid subscription locally when Stripe is off
// ─────────────────────────────────────────────

async function upsertLocalSubscriptionStub(
  tenantId: string,
  planSlug: "solo" | "solo_pro",
  interval: "month" | "year",
) {
  const plan = PLANS[planSlug];
  const now = new Date();
  const periodEnd = new Date(now);
  if (interval === "year") periodEnd.setFullYear(now.getFullYear() + 1);
  else periodEnd.setMonth(now.getMonth() + 1);

  const [existing] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  const monthlyAmount = interval === "year" ? plan.annualPriceEur / 12 : plan.monthlyPriceEur;

  if (existing) {
    await db
      .update(tenantSubscriptions)
      .set({
        planSlug,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        monthlyAmount: monthlyAmount.toFixed(2),
        billingInterval: interval,
        updatedAt: now,
      })
      .where(eq(tenantSubscriptions.id, existing.id));
  } else {
    await db.insert(tenantSubscriptions).values({
      tenantId,
      planSlug,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      monthlyAmount: monthlyAmount.toFixed(2),
      billingInterval: interval,
    });
  }

  await db
    .update(tenants)
    .set({ plan: planSlug })
    .where(eq(tenants.id, tenantId));
}
