import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { bookingCustomers, bookingAppointments } from "./booking";

// ─────────────────────────────────────────────
// SMS — provider settings per tenant + lifetime send log
//
// Romanians are SMS-first; a single 24h SMS reminder cuts no-show rates
// by ~30% in the salon industry. We support two providers out of the
// box: Twilio and Vonage. When neither is configured the sender drops
// to stub mode (logs locally, marks status='stub') so dev + demos work
// without external credentials.
// ─────────────────────────────────────────────

export const smsProviderEnum = pgEnum("sms_provider", ["twilio", "vonage", "stub"]);

export const smsSendStatusEnum = pgEnum("sms_send_status", [
  "queued",
  "sent",
  "failed",
  "stub",        // logged-only, no provider configured
  "skipped",     // no phone / no consent / quota cap
]);

export const smsSendTypeEnum = pgEnum("sms_send_type", [
  "test",
  "booking_confirmation",
  "booking_reminder_24h",
  "booking_reminder_2h",
  "booking_cancelled",
  "booking_rescheduled",
  "marketing",   // future — explicit marketing SMS, separate quota
  "other",
]);

// ─────────────────────────────────────────────
// Per-tenant SMS configuration
// ─────────────────────────────────────────────

export const tenantSmsSettings = pgTable("tenant_sms_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  provider: smsProviderEnum("provider").notNull().default("stub"),
  enabled: boolean("enabled").notNull().default(false),

  // Friendly "from" identifier — Twilio accepts a phone in E.164 ("+40..."),
  // Vonage accepts up to 11 chars alphanumeric or a phone. Keep loose.
  fromIdentifier: varchar("from_identifier", { length: 32 }),

  // Twilio creds — accountSid + authToken
  twilioAccountSid: varchar("twilio_account_sid", { length: 64 }),
  twilioAuthToken: varchar("twilio_auth_token", { length: 128 }),

  // Vonage creds — apiKey + apiSecret
  vonageApiKey: varchar("vonage_api_key", { length: 64 }),
  vonageApiSecret: varchar("vonage_api_secret", { length: 128 }),

  // Last test send result — for the settings UI
  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  lastTestStatus: varchar("last_test_status", { length: 32 }),
  lastTestError: text("last_test_error"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("tenant_sms_settings_tenant_idx").on(table.tenantId),
]);

export type TenantSmsSettings = typeof tenantSmsSettings.$inferSelect;
export type NewTenantSmsSettings = typeof tenantSmsSettings.$inferInsert;

// ─────────────────────────────────────────────
// SMS send log — every attempt recorded for audit + quota counting
// ─────────────────────────────────────────────

export const smsSends = pgTable("sms_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),
  appointmentId: uuid("appointment_id").references(() => bookingAppointments.id, { onDelete: "set null" }),

  toPhone: varchar("to_phone", { length: 32 }).notNull(),
  body: text("body").notNull(),
  type: smsSendTypeEnum("type").notNull().default("other"),
  status: smsSendStatusEnum("status").notNull().default("queued"),

  // Provider trace
  provider: smsProviderEnum("provider").notNull().default("stub"),
  providerMessageId: varchar("provider_message_id", { length: 128 }),
  errorMessage: text("error_message"),

  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("sms_sends_tenant_sent_idx").on(table.tenantId, table.sentAt),
  index("sms_sends_status_idx").on(table.tenantId, table.status),
  index("sms_sends_appointment_idx").on(table.appointmentId),
]);

export type SmsSend = typeof smsSends.$inferSelect;
export type NewSmsSend = typeof smsSends.$inferInsert;
