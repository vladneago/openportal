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
import { bookingAppointments, bookingCustomers, bookingResources, bookingServices } from "./booking";

// ─────────────────────────────────────────────
// REVIEWS — post-appointment ratings + comments
//
// A solo salon's growth loop: after every completed appointment, send
// the customer a "How was it?" email with a one-time token link.
// They land on /r/[token], pick stars + leave a comment. Admin moderates
// (publish/hide/reply). Site builder reads published reviews to show on
// the salon's public page.
// ─────────────────────────────────────────────

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",      // emailed customer, no response yet
  "submitted",    // customer left a rating, awaiting moderation
  "published",    // visible on public site
  "hidden",       // admin chose not to publish
  "spam",         // flagged as abuse
]);

export const bookingReviews = pgTable(
  "booking_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    // What was reviewed
    appointmentId: uuid("appointment_id").references(() => bookingAppointments.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),
    resourceId: uuid("resource_id").references(() => bookingResources.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => bookingServices.id, { onDelete: "set null" }),

    // Customer snapshot (in case customer record gets deleted)
    customerName: varchar("customer_name", { length: 200 }),
    customerEmail: varchar("customer_email", { length: 320 }),
    serviceName: varchar("service_name", { length: 200 }),
    resourceName: varchar("resource_name", { length: 200 }),

    // One-time public token (used in email link)
    token: varchar("token", { length: 64 }).notNull(),

    // The review itself
    rating: integer("rating"),         // 1-5, null while pending
    comment: text("comment"),
    status: reviewStatusEnum("status").notNull().default("pending"),

    // Owner reply (visible on public site under the review)
    ownerReply: text("owner_reply"),
    ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true }),

    // Workflow timestamps
    requestSentAt: timestamp("request_sent_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),

    // Display options
    showOnPublicSite: boolean("show_on_public_site").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("booking_reviews_token_idx").on(table.token),
    uniqueIndex("booking_reviews_appointment_idx").on(table.appointmentId),
    index("booking_reviews_tenant_status_idx").on(table.tenantId, table.status),
    index("booking_reviews_tenant_published_idx").on(table.tenantId, table.publishedAt),
    index("booking_reviews_resource_idx").on(table.resourceId),
    index("booking_reviews_service_idx").on(table.serviceId),
  ],
);

export type BookingReview = typeof bookingReviews.$inferSelect;
export type NewBookingReview = typeof bookingReviews.$inferInsert;
