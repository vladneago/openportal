import { pgTable, uuid, varchar, timestamp, jsonb, text, pgEnum, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─────────────────────────────────────────────
// PLATFORM BILLING — OpenPortal charging tenants
//
// This is DIFFERENT from the existing `billing_*` tables, which are for
// tenants to invoice THEIR customers. These tables track the platform's
// own subscription state for each tenant — i.e. Stripe charges to
// OpenPortal SRL for the use of OpenPortal itself.
// ─────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

export const tenantSubscriptions = pgTable(
  "tenant_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    // The plan slug this subscription buys — matches PLANS constant in code
    // (e.g. "solo", "solo_pro"). Plan limits are enforced from code, not DB.
    planSlug: varchar("plan_slug", { length: 50 }).notNull(),

    // Stripe identifiers
    stripeCustomerId: varchar("stripe_customer_id", { length: 200 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 200 }),
    stripePriceId: varchar("stripe_price_id", { length: 200 }),

    // Current state mirrored from Stripe
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: jsonb("cancel_at_period_end").$type<boolean>().default(false),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),

    // Pricing snapshot (for analytics + display)
    monthlyAmount: numeric("monthly_amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("EUR"),
    billingInterval: varchar("billing_interval", { length: 20 }).default("month"), // month | year

    // Last raw event payload for debugging (keeps the most recent only)
    lastWebhookEvent: jsonb("last_webhook_event").$type<Record<string, unknown>>(),
    lastWebhookAt: timestamp("last_webhook_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenant_subscriptions_tenant_idx").on(table.tenantId),
    index("tenant_subscriptions_status_idx").on(table.status),
    index("tenant_subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
    uniqueIndex("tenant_subscriptions_stripe_subscription_idx").on(table.stripeSubscriptionId),
  ],
);

export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;
export type NewTenantSubscription = typeof tenantSubscriptions.$inferInsert;

// ─────────────────────────────────────────────
// STRIPE WEBHOOK EVENTS — append-only event log for idempotency
// ─────────────────────────────────────────────

export const stripeWebhookEvents = pgTable(
  "stripe_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeEventId: varchar("stripe_event_id", { length: 200 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),

    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),

    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("stripe_webhook_events_event_id_idx").on(table.stripeEventId),
    index("stripe_webhook_events_type_idx").on(table.eventType, table.receivedAt),
    index("stripe_webhook_events_tenant_idx").on(table.tenantId),
  ],
);

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;
