import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const citizenRequestStatusEnum = pgEnum("citizen_request_status", ["submitted", "registered", "in_review", "approved", "rejected", "completed"]);
export const decisionStatusEnum = pgEnum("decision_status", ["draft", "proposed", "voted", "approved", "published"]);

// Citizen Requests (Registratură)
export const citizenRequests = pgTable("citizen_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  registrationNumber: varchar("registration_number", { length: 50 }).notNull(),
  citizenName: varchar("citizen_name", { length: 300 }).notNull(),
  citizenEmail: varchar("citizen_email", { length: 255 }),
  citizenPhone: varchar("citizen_phone", { length: 50 }),
  category: varchar("category", { length: 200 }).notNull(), // urbanism, acte_stare_civila, taxe, sesizari
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  attachments: jsonb("attachments").$type<Array<{ name: string; url: string }>>().default([]),
  status: citizenRequestStatusEnum("citizen_request_status").notNull().default("submitted"),
  department: varchar("department", { length: 200 }),
  assigneeId: uuid("assignee_id").references(() => users.id),
  legalDeadline: timestamp("legal_deadline", { withTimezone: true }),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("citizen_requests_tenant_status_idx").on(table.tenantId, table.status),
]);

// Public Decisions (Hotărâri)
export const publicDecisions = pgTable("public_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  number: varchar("number", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),
  category: varchar("category", { length: 200 }),
  status: decisionStatusEnum("decision_status").notNull().default("draft"),
  sessionDate: timestamp("session_date", { withTimezone: true }),
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  votesAbstain: integer("votes_abstain").default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Public Services (Servicii online)
export const publicServices = pgTable("public_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 200 }),
  formId: uuid("form_id"), // link to forms module
  department: varchar("department", { length: 200 }),
  estimatedDays: integer("estimated_days"),
  requiredDocuments: jsonb("required_documents").$type<string[]>().default([]),
  fee: integer("fee").default(0), // in cents
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
