import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const dealStageEnum = pgEnum("deal_stage", ["lead", "qualified", "proposal", "negotiation", "won", "lost"]);

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  industry: varchar("industry", { length: 200 }),
  size: varchar("size", { length: 50 }), // 1-10, 11-50, 51-200, 201-1000, 1000+
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Company = typeof companies.$inferSelect;

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  firstName: varchar("first_name", { length: 200 }).notNull(),
  lastName: varchar("last_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 200 }),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("contacts_tenant_company_idx").on(table.tenantId, table.companyId),
]);

export type Contact = typeof contacts.$inferSelect;

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  value: integer("value").notNull().default(0), // in cents
  currency: varchar("currency", { length: 3 }).default("RON"),
  stage: dealStageEnum("stage").notNull().default("lead"),
  probability: integer("probability").default(0), // 0-100
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").references(() => users.id),
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (table) => [
  index("deals_tenant_stage_idx").on(table.tenantId, table.stage),
]);

export type Deal = typeof deals.$inferSelect;

export const crmActivities = pgTable("crm_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // call, email, meeting, note, task
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completed: timestamp("completed_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
