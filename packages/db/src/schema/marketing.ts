import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { bookingCustomers } from "./booking";

// ─────────────────────────────────────────────
// MARKETING — outbound campaigns to the tenant's customer base
//
// Solo salons live on this loop: birthday wishes, "haven't seen you
// in a while" comeback, holiday promos, newsletters. Phase 1 ships
// one-shot campaigns; automations (birthday / comeback) layer on top
// once the schema proves stable.
// ─────────────────────────────────────────────

export const campaignStatusEnum = pgEnum("marketing_campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "paused",
  "failed",
]);

export const campaignTargetTypeEnum = pgEnum("marketing_target_type", [
  "all_with_consent",      // every customer with emailConsent=true + email present
  "segment_recent",        // customers with last_visit_at within X days
  "segment_dormant",       // customers with no visit for X days
  "segment_top_spenders",  // top N by total_spent
  "segment_tag",           // customers carrying a specific tag
  "manual",                // explicit customer IDs in metadata
]);

export const recipientStatusEnum = pgEnum("marketing_recipient_status", [
  "queued",
  "sent",
  "failed",
  "skipped",
  "opened",      // future (open-tracking pixel)
  "clicked",     // future (link wrapping)
  "unsubscribed",
]);

// ─────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────

export const marketingCampaigns = pgTable(
  "marketing_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    subject: varchar("subject", { length: 300 }).notNull(),
    // Markdown-ish body. Rendered to HTML at send-time with template
    // variable substitution (e.g., {firstName}, {businessName}).
    body: text("body").notNull(),
    // Preview text (Inbox snippet line)
    previewText: varchar("preview_text", { length: 200 }),

    // Targeting
    targetType: campaignTargetTypeEnum("target_type").notNull().default("all_with_consent"),
    // Free-form params for the targeting (e.g., { withinDays: 90 } for segment_dormant)
    targetParams: jsonb("target_params").$type<Record<string, unknown>>().default({}),

    // Workflow
    status: campaignStatusEnum("status").notNull().default("draft"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Stats snapshot (denormalized for fast list views)
    totalRecipients: integer("total_recipients").notNull().default(0),
    totalSent: integer("total_sent").notNull().default(0),
    totalFailed: integer("total_failed").notNull().default(0),
    totalSkipped: integer("total_skipped").notNull().default(0),
    totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),

    // Brand
    fromName: varchar("from_name", { length: 200 }),
    replyTo: varchar("reply_to", { length: 320 }),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("marketing_campaigns_tenant_status_idx").on(table.tenantId, table.status),
    index("marketing_campaigns_scheduled_idx").on(table.scheduledFor),
  ],
);

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type NewMarketingCampaign = typeof marketingCampaigns.$inferInsert;

// ─────────────────────────────────────────────
// RECIPIENTS (per campaign × customer)
// ─────────────────────────────────────────────

export const marketingRecipients = pgTable(
  "marketing_recipients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),

    // Snapshot of the recipient (in case customer is deleted later)
    emailAddress: varchar("email_address", { length: 320 }).notNull(),
    customerName: varchar("customer_name", { length: 200 }),

    status: recipientStatusEnum("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    skipReason: varchar("skip_reason", { length: 100 }), // e.g., "no_consent", "no_email"

    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

    // For idempotency at send time
    messageId: varchar("message_id", { length: 200 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("marketing_recipients_campaign_customer_idx").on(table.campaignId, table.customerId),
    index("marketing_recipients_status_idx").on(table.campaignId, table.status),
    index("marketing_recipients_email_idx").on(table.tenantId, table.emailAddress),
  ],
);

export type MarketingRecipient = typeof marketingRecipients.$inferSelect;
export type NewMarketingRecipient = typeof marketingRecipients.$inferInsert;
