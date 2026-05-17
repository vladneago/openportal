import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─────────────────────────────────────────────
// Tenant Stripe payments — per-tenant Stripe API credentials used to
// generate per-invoice Payment Links. Separate from the platform Stripe
// account that handles OpenPortal's own subscription billing.
//
// Owners enter their own Stripe Restricted API Key (write permission on
// products, prices, payment_links, checkout sessions) + webhook signing
// secret. The platform never touches their balance — Stripe deposits
// directly into the owner's account.
// ─────────────────────────────────────────────

export const stripePaymentsModeEnum = pgEnum("stripe_payments_mode", ["test", "live"]);

export const tenantStripePayments = pgTable("tenant_stripe_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  mode: stripePaymentsModeEnum("mode").notNull().default("test"),
  enabled: boolean("enabled").notNull().default(false),

  // Stripe credentials (entered by the owner, stored encrypted at rest
  // ideally — currently plaintext, encryption at REST is a deploy concern).
  secretKey: text("secret_key"),         // sk_test_… or sk_live_…
  publishableKey: text("publishable_key"), // pk_test_… or pk_live_…
  webhookSecret: text("webhook_secret"), // whsec_…

  // Account info cached at config time (for the UI)
  accountId: varchar("account_id", { length: 64 }),
  accountCountry: varchar("account_country", { length: 8 }),
  accountDefaultCurrency: varchar("account_default_currency", { length: 8 }),

  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  lastTestStatus: varchar("last_test_status", { length: 32 }),
  lastTestError: text("last_test_error"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("tenant_stripe_payments_tenant_idx").on(table.tenantId),
]);

export type TenantStripePayments = typeof tenantStripePayments.$inferSelect;
export type NewTenantStripePayments = typeof tenantStripePayments.$inferInsert;
