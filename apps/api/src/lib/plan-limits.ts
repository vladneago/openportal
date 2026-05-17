import {
  db,
  tenantSubscriptions,
  tenants,
  bookingResources,
  products as posProducts,
  webSites,
  chatWidgetMessages,
  efacturaSubmissions,
  marketingRecipients,
} from "@openportal/db";
import { and, count, eq, gte, isNull, or } from "drizzle-orm";
import { getPlan, PLANS, type Plan, type PlanLimits } from "./stripe";
import { AppError } from "../middleware/error-handler";

// ─────────────────────────────────────────────
// Plan enforcement — read the active plan for a tenant and check
// whether a given action is allowed under that plan's limits.
// ─────────────────────────────────────────────

const IMPLICIT_TRIAL_DAYS = 14;

interface ActivePlan {
  planSlug: "solo" | "solo_pro";
  plan: Plan;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused";
  inGracePeriod: boolean;
  trialDaysRemaining: number;
}

/**
 * Returns the tenant's active plan + status. If no subscription row
 * exists, computes an implicit 14-day trial from tenant.createdAt and
 * defaults to Solo limits.
 *
 * Tenants past their trial without a subscription get "incomplete"
 * status — limits are still enforced as Solo for graceful degradation.
 */
export async function getTenantPlan(tenantId: string): Promise<ActivePlan> {
  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (sub) {
    const plan = getPlan(sub.planSlug) ?? PLANS.solo;
    const trialMs = sub.trialEndsAt ? sub.trialEndsAt.getTime() - Date.now() : 0;
    return {
      planSlug: (plan.slug as "solo" | "solo_pro"),
      plan,
      status: sub.status,
      inGracePeriod: sub.status === "past_due" || sub.status === "trialing",
      trialDaysRemaining: Math.max(0, Math.ceil(trialMs / 86400000)),
    };
  }

  // Implicit trial fallback
  const [tenant] = await db
    .select({ createdAt: tenants.createdAt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");
  }

  const trialEndsAt = new Date(tenant.createdAt.getTime() + IMPLICIT_TRIAL_DAYS * 86400000);
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000));
  const isTrialing = trialEndsAt.getTime() > Date.now();

  return {
    planSlug: "solo",
    plan: PLANS.solo,
    status: isTrialing ? "trialing" : "incomplete",
    inGracePeriod: isTrialing,
    trialDaysRemaining,
  };
}

// ─────────────────────────────────────────────
// Count-based limits
// ─────────────────────────────────────────────

export async function assertCanCreateResource(tenantId: string): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  if (plan.limits.maxResources >= 999) return;

  const [{ value }] = await db
    .select({ value: count() })
    .from(bookingResources)
    .where(eq(bookingResources.tenantId, tenantId));

  if (value >= plan.limits.maxResources) {
    throw new AppError(
      402,
      "PLAN_LIMIT_RESOURCES",
      `Planul ${plan.name} permite maxim ${plan.limits.maxResources} resurse. Ai deja ${value}. Upgrade la Solo Pro pentru resurse nelimitate.`,
      { currentCount: value, limit: plan.limits.maxResources, planSlug, upgradeTo: "solo_pro" },
    );
  }
}

export async function assertCanCreateProduct(tenantId: string): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  if (plan.limits.maxProducts >= 99999) return;

  const [{ value }] = await db
    .select({ value: count() })
    .from(posProducts)
    .where(eq(posProducts.tenantId, tenantId));

  if (value >= plan.limits.maxProducts) {
    throw new AppError(
      402,
      "PLAN_LIMIT_PRODUCTS",
      `Planul ${plan.name} permite maxim ${plan.limits.maxProducts} produse. Ai deja ${value}. Upgrade la Solo Pro pentru produse nelimitate.`,
      { currentCount: value, limit: plan.limits.maxProducts, planSlug, upgradeTo: "solo_pro" },
    );
  }
}

// ─────────────────────────────────────────────
// Quota-based limits (monthly counters)
// ─────────────────────────────────────────────

/** Returns count of AI assistant messages sent for this tenant in the
 * current calendar month. Used to enforce chatAiMessagesPerMonth quota. */
export async function getChatAiUsageThisMonth(tenantId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ value }] = await db
    .select({ value: count() })
    .from(chatWidgetMessages)
    .where(
      and(
        eq(chatWidgetMessages.tenantId, tenantId),
        eq(chatWidgetMessages.role, "assistant"),
        gte(chatWidgetMessages.createdAt, monthStart),
      ),
    );

  return value;
}

/** Returns count of e-Factura submissions queued/sent for this tenant
 * this calendar month. Used to enforce efacturaPerMonth quota. */
export async function getEfacturaUsageThisMonth(tenantId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ value }] = await db
    .select({ value: count() })
    .from(efacturaSubmissions)
    .where(
      and(
        eq(efacturaSubmissions.tenantId, tenantId),
        gte(efacturaSubmissions.createdAt, monthStart),
      ),
    );

  return value;
}

export async function assertEfacturaQuota(tenantId: string): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  if (plan.limits.efacturaPerMonth >= 99999) return;

  const used = await getEfacturaUsageThisMonth(tenantId);
  if (used >= plan.limits.efacturaPerMonth) {
    throw new AppError(
      402,
      "PLAN_LIMIT_EFACTURA",
      `Ai trimis cele ${plan.limits.efacturaPerMonth} facturi e-Factura incluse în planul ${plan.name} luna aceasta. Upgrade la Solo Pro pentru e-Factura nelimitat.`,
      { used, limit: plan.limits.efacturaPerMonth, planSlug, upgradeTo: "solo_pro" },
    );
  }
}

/** Returns count of marketing emails sent for this tenant this calendar
 * month (only status='sent'; skipped/failed don't count against quota). */
export async function getEmailQuotaThisMonth(tenantId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ value }] = await db
    .select({ value: count() })
    .from(marketingRecipients)
    .where(
      and(
        eq(marketingRecipients.tenantId, tenantId),
        eq(marketingRecipients.status, "sent"),
        gte(marketingRecipients.sentAt, monthStart),
      ),
    );

  return value;
}

/** Throws PLAN_LIMIT_MARKETING_EMAILS if sending `additional` emails
 * would exceed the monthly cap. Pass 0 to just check the current usage. */
export async function assertEmailQuota(tenantId: string, additional = 0): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  if (plan.limits.marketingEmailsPerMonth >= 99999) return;

  const used = await getEmailQuotaThisMonth(tenantId);
  if (used + additional > plan.limits.marketingEmailsPerMonth) {
    throw new AppError(
      402,
      "PLAN_LIMIT_MARKETING_EMAILS",
      `Vrei să trimiți ${additional} email-uri, dar ai folosit ${used} din ${plan.limits.marketingEmailsPerMonth} email-uri marketing incluse în planul ${plan.name} luna aceasta.`,
      { used, attempting: additional, limit: plan.limits.marketingEmailsPerMonth, planSlug, upgradeTo: "solo_pro" },
    );
  }
}

export async function assertChatAiQuota(tenantId: string): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  const used = await getChatAiUsageThisMonth(tenantId);

  if (used >= plan.limits.chatAiMessagesPerMonth) {
    throw new AppError(
      402,
      "PLAN_LIMIT_CHAT_AI",
      `Ai consumat cele ${plan.limits.chatAiMessagesPerMonth} mesaje AI incluse în planul ${plan.name} luna aceasta. Upgrade pentru mai multe.`,
      { used, limit: plan.limits.chatAiMessagesPerMonth, planSlug, upgradeTo: "solo_pro" },
    );
  }
}

// ─────────────────────────────────────────────
// Boolean feature flags
// ─────────────────────────────────────────────

export async function assertFeature(
  tenantId: string,
  feature: keyof PlanLimits,
): Promise<void> {
  const { plan, planSlug } = await getTenantPlan(tenantId);
  const limit = plan.limits[feature];
  if (typeof limit === "boolean" && limit) return;

  throw new AppError(
    402,
    "PLAN_LIMIT_FEATURE",
    `Această funcționalitate (${humanizeFeature(feature)}) nu e inclusă în planul ${plan.name}. Upgrade la Solo Pro.`,
    { feature, planSlug, upgradeTo: "solo_pro" },
  );
}

function humanizeFeature(key: keyof PlanLimits): string {
  const labels: Partial<Record<keyof PlanLimits, string>> = {
    hasCustomDomain: "Domeniu propriu",
    hasMultipleLocations: "Locații multiple",
    hasRecurringBilling: "Facturare recurentă",
    hasPriorityFunctionCalling: "Function calling avansat",
    hasOpenPortalBrandingRemoved: "Înlăturare branding OpenPortal",
    hasPrioritySupport: "Suport prioritar",
  };
  return labels[key] || key;
}

// ─────────────────────────────────────────────
// Aggregated usage report (for /api/v1/billing/platform/usage)
// ─────────────────────────────────────────────

export async function getTenantUsage(tenantId: string): Promise<{
  planSlug: string;
  planName: string;
  status: string;
  resources: { used: number; limit: number };
  products: { used: number; limit: number };
  chatAiThisMonth: { used: number; limit: number };
  efacturaThisMonth: { used: number; limit: number };
  marketingEmailsThisMonth: { used: number; limit: number };
  sitesPublished: { used: number; limit: number | null };
}> {
  const active = await getTenantPlan(tenantId);

  const [resourcesRow, productsRow, sitesRow] = await Promise.all([
    db.select({ value: count() }).from(bookingResources).where(eq(bookingResources.tenantId, tenantId)),
    db.select({ value: count() }).from(posProducts).where(eq(posProducts.tenantId, tenantId)),
    db
      .select({ value: count() })
      .from(webSites)
      .where(and(eq(webSites.tenantId, tenantId), eq(webSites.status, "published"))),
  ]);

  const [chatAiUsed, efacturaUsed, emailUsed] = await Promise.all([
    getChatAiUsageThisMonth(tenantId),
    getEfacturaUsageThisMonth(tenantId),
    getEmailQuotaThisMonth(tenantId),
  ]);

  return {
    planSlug: active.planSlug,
    planName: active.plan.name,
    status: active.status,
    resources: {
      used: resourcesRow[0].value,
      limit: active.plan.limits.maxResources,
    },
    products: {
      used: productsRow[0].value,
      limit: active.plan.limits.maxProducts,
    },
    chatAiThisMonth: {
      used: chatAiUsed,
      limit: active.plan.limits.chatAiMessagesPerMonth,
    },
    efacturaThisMonth: {
      used: efacturaUsed,
      limit: active.plan.limits.efacturaPerMonth,
    },
    marketingEmailsThisMonth: {
      used: emailUsed,
      limit: active.plan.limits.marketingEmailsPerMonth,
    },
    sitesPublished: {
      used: sitesRow[0].value,
      limit: null, // no hard cap, but informational
    },
  };
}

// re-export so feature predicates can be used type-safely from other files
export type { PlanLimits };
