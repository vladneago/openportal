import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ─────────────────────────────────────────────
// FORMS
// ─────────────────────────────────────────────

export const formStatusEnum = pgEnum("form_status", ["draft", "active", "closed"]);

export const forms = pgTable("forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),

  status: formStatusEnum("status").notNull().default("draft"),
  isPublic: boolean("is_public").notNull().default(false), // accessible without login
  publicToken: varchar("public_token", { length: 64 }),

  // Settings
  settings: jsonb("settings").$type<{
    showProgressBar?: boolean;
    confirmationMessage?: string;
    limitResponses?: number;
    closedMessage?: string;
  }>().default({}),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("forms_site_slug_idx").on(table.siteId, table.slug),
]);

export type Form = typeof forms.$inferSelect;

// ─────────────────────────────────────────────
// FORM FIELDS
// ─────────────────────────────────────────────

export const formFieldTypeEnum = pgEnum("form_field_type", [
  "text", "textarea", "number", "email", "phone", "url",
  "date", "time", "datetime",
  "select", "multi_select", "radio", "checkbox",
  "file", "rating", "scale",
  "heading", "paragraph", "divider",
]);

export const formFields = pgTable("form_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),

  type: formFieldTypeEnum("type").notNull(),
  label: varchar("label", { length: 500 }).notNull(),
  placeholder: varchar("placeholder", { length: 500 }),
  helpText: text("help_text"),
  order: integer("order").notNull().default(0),

  required: boolean("required").notNull().default(false),

  config: jsonb("config").$type<{
    choices?: string[];
    min?: number;
    max?: number;
    maxLength?: number;
    ratingMax?: number;
    scaleMin?: number;
    scaleMax?: number;
    scaleMinLabel?: string;
    scaleMaxLabel?: string;
    defaultValue?: string;
  }>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("form_fields_form_order_idx").on(table.formId, table.order),
]);

export type FormField = typeof formFields.$inferSelect;

// ─────────────────────────────────────────────
// FORM SUBMISSIONS
// ─────────────────────────────────────────────

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),

  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),

  submittedBy: uuid("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("form_submissions_form_idx").on(table.formId),
]);

export type FormSubmission = typeof formSubmissions.$inferSelect;
