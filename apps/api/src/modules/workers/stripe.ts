import { Hono } from "hono";
import {
  db,
  tenantSubscriptions,
  stripeWebhookEvents,
  tenants,
} from "@openportal/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getStripe, stripeEnabled, STRIPE_WEBHOOK_SECRET, getPlan } from "../../lib/stripe";

// ─────────────────────────────────────────────
// Stripe webhook endpoint
//
// Mounted at /api/v1/internal/stripe/webhook (unauthenticated; Stripe
// signs every request with STRIPE_WEBHOOK_SECRET).
//
// Handles the subscription lifecycle events we care about and writes
// the canonical state into `tenant_subscriptions`. Idempotency is
// enforced via `stripe_webhook_events` (unique on stripe_event_id).
// ─────────────────────────────────────────────

export const stripeWebhookRoutes = new Hono();

stripeWebhookRoutes.post("/webhook", async (c) => {
  if (!stripeEnabled) {
    return c.json({ success: false, error: { code: "STRIPE_DISABLED", message: "Stripe is not configured on this instance" } }, 503);
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    return c.json({ success: false, error: { code: "WEBHOOK_SECRET_MISSING", message: "STRIPE_WEBHOOK_SECRET not configured" } }, 503);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ success: false, error: { code: "MISSING_SIGNATURE", message: "Stripe-Signature header missing" } }, 400);
  }

  const rawBody = await c.req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return c.json({ success: false, error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed" } }, 400);
  }

  // Idempotency: if we've seen this event before, ack and skip.
  const [existing] = await db
    .select({ id: stripeWebhookEvents.id, processedAt: stripeWebhookEvents.processedAt })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.stripeEventId, event.id))
    .limit(1);

  if (existing?.processedAt) {
    return c.json({ success: true, data: { duplicate: true } });
  }

  // Log event (idempotent insert)
  let eventRowId: string;
  if (existing) {
    eventRowId = existing.id;
  } else {
    const [row] = await db
      .insert(stripeWebhookEvents)
      .values({
        stripeEventId: event.id,
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
      })
      .returning({ id: stripeWebhookEvents.id });
    eventRowId = row.id;
  }

  // Dispatch on event type
  try {
    await handleEvent(event);
    await db
      .update(stripeWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(stripeWebhookEvents.id, eventRowId));
    return c.json({ success: true });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] handler failed for ${event.type}:`, errMessage);
    await db
      .update(stripeWebhookEvents)
      .set({ processingError: errMessage })
      .where(eq(stripeWebhookEvents.id, eventRowId));
    return c.json({ success: false, error: { code: "HANDLER_FAILED", message: errMessage } }, 500);
  }
});

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event.data.object as Stripe.Invoice, event.type);
      break;
    default:
      // Unhandled event type — that's fine, just acknowledge
      break;
  }
}

// ─────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const tenantId = session.client_reference_id || (session.metadata?.tenantId as string | undefined);
  if (!tenantId) {
    console.warn("[stripe-webhook] checkout.session.completed without tenantId");
    return;
  }
  if (typeof session.customer !== "string" || typeof session.subscription !== "string") {
    return;
  }

  // The customer.subscription.created event will fire right after and
  // populate the row. Here we just make sure the customerId is linked
  // even before that event arrives.
  await ensureSubscriptionRow(tenantId, {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
  });
}

async function handleSubscriptionChange(sub: Stripe.Subscription): Promise<void> {
  const tenantId = sub.metadata?.tenantId as string | undefined;
  if (!tenantId) {
    console.warn("[stripe-webhook] subscription event without tenantId metadata", sub.id);
    return;
  }

  const planSlug = (sub.metadata?.planSlug as string | undefined) || inferPlanFromPriceId(sub);
  const plan = planSlug ? getPlan(planSlug) : null;
  const priceId = sub.items.data[0]?.price.id ?? null;
  const interval = (sub.items.data[0]?.price.recurring?.interval as "month" | "year" | undefined) || "month";
  const unitAmount = sub.items.data[0]?.price.unit_amount ?? 0;
  const monthlyAmount = interval === "year" ? unitAmount / 12 / 100 : unitAmount / 100;

  await db
    .insert(tenantSubscriptions)
    .values({
      tenantId,
      planSlug: planSlug || "solo",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status as typeof tenantSubscriptions.$inferInsert.status,
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      monthlyAmount: monthlyAmount.toFixed(2),
      currency: (sub.currency || "EUR").toUpperCase(),
      billingInterval: interval,
      lastWebhookEvent: sub as unknown as Record<string, unknown>,
      lastWebhookAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tenantSubscriptions.tenantId,
      set: {
        planSlug: planSlug || "solo",
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: sub.status as typeof tenantSubscriptions.$inferInsert.status,
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        monthlyAmount: monthlyAmount.toFixed(2),
        currency: (sub.currency || "EUR").toUpperCase(),
        billingInterval: interval,
        lastWebhookEvent: sub as unknown as Record<string, unknown>,
        lastWebhookAt: new Date(),
        updatedAt: new Date(),
      },
    });

  // Sync the de-facto plan field on tenants for fast access
  if (plan && (sub.status === "active" || sub.status === "trialing")) {
    await db
      .update(tenants)
      .set({ plan: planSlug! })
      .where(eq(tenants.id, tenantId));
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const tenantId = sub.metadata?.tenantId as string | undefined;
  if (!tenantId) return;

  await db
    .update(tenantSubscriptions)
    .set({
      status: "canceled",
      endedAt: new Date(),
      lastWebhookEvent: sub as unknown as Record<string, unknown>,
      lastWebhookAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tenantSubscriptions.tenantId, tenantId));

  // Downgrade tenant back to "free" — they can still log in and export
  // their data, but plan limits are enforced from code based on this.
  await db.update(tenants).set({ plan: "free" }).where(eq(tenants.id, tenantId));
}

async function handleInvoiceEvent(invoice: Stripe.Invoice, eventType: string): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  const [row] = await db
    .select({ tenantId: tenantSubscriptions.tenantId, status: tenantSubscriptions.status })
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!row) return;

  // We don't store individual invoices yet — just bump status if payment
  // failed (Stripe will mark the subscription as past_due automatically,
  // but we don't want to race against that webhook).
  if (eventType === "invoice.payment_failed" && row.status === "active") {
    await db
      .update(tenantSubscriptions)
      .set({ status: "past_due", updatedAt: new Date() })
      .where(eq(tenantSubscriptions.tenantId, row.tenantId));
  }
}

async function ensureSubscriptionRow(
  tenantId: string,
  partial: { stripeCustomerId: string; stripeSubscriptionId: string },
): Promise<void> {
  const [existing] = await db
    .select({ id: tenantSubscriptions.id })
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (existing) {
    await db
      .update(tenantSubscriptions)
      .set({
        stripeCustomerId: partial.stripeCustomerId,
        stripeSubscriptionId: partial.stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscriptions.id, existing.id));
  } else {
    await db.insert(tenantSubscriptions).values({
      tenantId,
      planSlug: "solo",
      status: "incomplete",
      stripeCustomerId: partial.stripeCustomerId,
      stripeSubscriptionId: partial.stripeSubscriptionId,
    });
  }
}

function inferPlanFromPriceId(sub: Stripe.Subscription): string | null {
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return null;
  // Could match against process.env.STRIPE_PRICE_* here. For now we rely on
  // metadata.planSlug being set at checkout.
  return null;
}
