import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const caseStatusEnum = pgEnum("case_status", ["new", "active", "suspended", "won", "lost", "settled", "closed"]);
export const contractStatusEnum = pgEnum("contract_status_legal", ["draft", "review", "pending_signature", "active", "expired", "terminated"]);

// Legal Cases
export const legalCases = pgTable("legal_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseNumber: varchar("case_number", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 300 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  opposingParty: varchar("opposing_party", { length: 300 }),
  court: varchar("court", { length: 300 }),
  caseType: varchar("case_type", { length: 100 }), // civil, penal, commercial, labor, administrative
  status: caseStatusEnum("case_status").notNull().default("new"),
  description: text("description"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  value: integer("value").default(0), // cents
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("legal_cases_tenant_status_idx").on(table.tenantId, table.status),
]);

// Court Deadlines
export const courtDeadlines = pgTable("court_deadlines", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => legalCases.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }), // hearing, filing_deadline, response_deadline, appeal
  date: timestamp("date", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 300 }),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Legal Contracts
export const legalContracts = pgTable("legal_contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 300 }).notNull(),
  contractType: varchar("contract_type", { length: 100 }), // service, employment, nda, lease, sale
  status: contractStatusEnum("contract_status_legal").notNull().default("draft"),
  value: integer("value").default(0),
  currency: varchar("currency", { length: 3 }).default("RON"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  content: text("content"),
  caseId: uuid("case_id").references(() => legalCases.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Time Entries (Billing)
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").references(() => legalCases.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  description: varchar("description", { length: 500 }).notNull(),
  minutes: integer("minutes").notNull(),
  hourlyRate: integer("hourly_rate").default(0), // cents
  billable: boolean("billable").notNull().default(true),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
