import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  time,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const bookingResourceTypeEnum = pgEnum("booking_resource_type", [
  "staff",
  "room",
  "equipment",
  "vehicle",
  "other",
]);

export const bookingAppointmentStatusEnum = pgEnum("booking_appointment_status", [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

export const bookingPaymentStatusEnum = pgEnum("booking_payment_status", [
  "unpaid",
  "deposit_paid",
  "paid",
  "refunded",
  "failed",
]);

export const bookingChannelEnum = pgEnum("booking_channel", [
  "admin",
  "widget",
  "phone",
  "walkin",
  "marketplace",
]);

// ─────────────────────────────────────────────
// CUSTOMERS (end-clients of the tenant, separate from platform users)
// ─────────────────────────────────────────────

export const bookingCustomers = pgTable("booking_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),

  language: varchar("language", { length: 8 }).default("ro"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),

  marketingConsent: boolean("marketing_consent").notNull().default(false),
  smsConsent: boolean("sms_consent").notNull().default(true),
  emailConsent: boolean("email_consent").notNull().default(true),

  totalAppointments: integer("total_appointments").notNull().default(0),
  totalSpent: numeric("total_spent", { precision: 14, scale: 2 }).notNull().default("0"),
  lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("booking_customers_tenant_idx").on(table.tenantId),
  index("booking_customers_phone_idx").on(table.tenantId, table.phone),
  index("booking_customers_email_idx").on(table.tenantId, table.email),
]);

export type BookingCustomer = typeof bookingCustomers.$inferSelect;
export type NewBookingCustomer = typeof bookingCustomers.$inferInsert;

// ─────────────────────────────────────────────
// RESOURCES (staff, rooms, equipment that can be booked)
// ─────────────────────────────────────────────

export const bookingResources = pgTable("booking_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),

  name: varchar("name", { length: 200 }).notNull(),
  type: bookingResourceTypeEnum("type").notNull().default("staff"),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366F1"),
  avatarUrl: text("avatar_url"),

  // Link to platform user if staff member also has a login
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Display ordering in calendars and widgets
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isBookableOnline: boolean("is_bookable_online").notNull().default(true),

  // Capacity for group resources (e.g., a yoga room of 15 mats)
  capacity: integer("capacity").notNull().default(1),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("booking_resources_tenant_idx").on(table.tenantId),
  index("booking_resources_site_idx").on(table.siteId),
  index("booking_resources_active_idx").on(table.tenantId, table.isActive),
]);

export type BookingResource = typeof bookingResources.$inferSelect;
export type NewBookingResource = typeof bookingResources.$inferInsert;

// ─────────────────────────────────────────────
// SERVICES (offered by the business)
// ─────────────────────────────────────────────

export const bookingServices = pgTable("booking_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),

  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  imageUrl: text("image_url"),
  color: varchar("color", { length: 7 }).default("#10B981"),

  // Duration in minutes
  durationMinutes: integer("duration_minutes").notNull().default(60),
  // Buffer time after the appointment (cleaning, prep, etc.)
  bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),

  // Pricing
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("RON"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19.00"),

  // Deposit required at booking time
  requiresDeposit: boolean("requires_deposit").notNull().default(false),
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }).default("0"),

  // Availability constraints
  isActive: boolean("is_active").notNull().default(true),
  isBookableOnline: boolean("is_bookable_online").notNull().default(true),
  maxAdvanceBookingDays: integer("max_advance_booking_days").default(60),
  minAdvanceBookingHours: integer("min_advance_booking_hours").default(2),

  // Resources that can deliver this service
  eligibleResourceIds: jsonb("eligible_resource_ids").$type<string[]>().default([]),

  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("booking_services_tenant_slug_idx").on(table.tenantId, table.slug),
  index("booking_services_tenant_idx").on(table.tenantId),
  index("booking_services_category_idx").on(table.tenantId, table.category),
  index("booking_services_active_idx").on(table.tenantId, table.isActive),
]);

export type BookingService = typeof bookingServices.$inferSelect;
export type NewBookingService = typeof bookingServices.$inferInsert;

// ─────────────────────────────────────────────
// AVAILABILITY (weekly recurring schedule per resource)
// ─────────────────────────────────────────────
// dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export const bookingAvailability = pgTable("booking_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").notNull().references(() => bookingResources.id, { onDelete: "cascade" }),

  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  // Optional: limit to specific date range (e.g., summer schedule)
  effectiveFrom: date("effective_from"),
  effectiveUntil: date("effective_until"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("booking_availability_resource_day_idx").on(table.resourceId, table.dayOfWeek),
  index("booking_availability_tenant_idx").on(table.tenantId),
]);

export type BookingAvailability = typeof bookingAvailability.$inferSelect;
export type NewBookingAvailability = typeof bookingAvailability.$inferInsert;

// ─────────────────────────────────────────────
// BLOCKED SLOTS (vacations, breaks, custom unavailability)
// ─────────────────────────────────────────────

export const bookingBlockedSlots = pgTable("booking_blocked_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // If null, applies to ALL resources (e.g., shop closed)
  resourceId: uuid("resource_id").references(() => bookingResources.id, { onDelete: "cascade" }),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),

  reason: varchar("reason", { length: 200 }),
  isAllDay: boolean("is_all_day").notNull().default(false),

  // Recurring pattern (lunch break repeated daily, weekly closure, etc.)
  recurrenceRule: jsonb("recurrence_rule").$type<{
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
    count?: number;
  }>(),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("booking_blocked_resource_time_idx").on(table.resourceId, table.startAt),
  index("booking_blocked_tenant_time_idx").on(table.tenantId, table.startAt),
]);

export type BookingBlockedSlot = typeof bookingBlockedSlots.$inferSelect;
export type NewBookingBlockedSlot = typeof bookingBlockedSlots.$inferInsert;

// ─────────────────────────────────────────────
// APPOINTMENTS (the actual bookings)
// ─────────────────────────────────────────────

export const bookingAppointments = pgTable("booking_appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Public-facing short code for SMS/email links: "ABC123"
  bookingCode: varchar("booking_code", { length: 16 }).notNull(),

  customerId: uuid("customer_id").notNull().references(() => bookingCustomers.id),
  resourceId: uuid("resource_id").notNull().references(() => bookingResources.id),
  serviceId: uuid("service_id").notNull().references(() => bookingServices.id),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),

  status: bookingAppointmentStatusEnum("status").notNull().default("pending"),
  channel: bookingChannelEnum("channel").notNull().default("admin"),

  // Snapshot of pricing at booking time (service price can change later)
  priceSnapshot: numeric("price_snapshot", { precision: 12, scale: 2 }).notNull().default("0"),
  currencySnapshot: varchar("currency_snapshot", { length: 3 }).notNull().default("RON"),
  vatRateSnapshot: numeric("vat_rate_snapshot", { precision: 5, scale: 2 }).notNull().default("19.00"),

  paymentStatus: bookingPaymentStatusEnum("payment_status").notNull().default("unpaid"),
  depositPaid: numeric("deposit_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).notNull().default("0"),

  customerNote: text("customer_note"),
  internalNote: text("internal_note"),

  // Cancellation tracking
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  cancellationReason: text("cancellation_reason"),

  // Notification tracking
  confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),

  // For rescheduled appointments, point to the previous one
  rescheduledFromId: uuid("rescheduled_from_id"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("booking_appointments_code_idx").on(table.tenantId, table.bookingCode),
  index("booking_appointments_resource_time_idx").on(table.resourceId, table.startAt),
  index("booking_appointments_customer_idx").on(table.customerId),
  index("booking_appointments_tenant_status_idx").on(table.tenantId, table.status, table.startAt),
  index("booking_appointments_service_idx").on(table.serviceId),
]);

export type BookingAppointment = typeof bookingAppointments.$inferSelect;
export type NewBookingAppointment = typeof bookingAppointments.$inferInsert;
