import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const incidentSeverityEnum = pgEnum("incident_severity", ["critical", "major", "minor", "low"]);
export const incidentStatusEnum = pgEnum("incident_status", ["open", "investigating", "identified", "monitoring", "resolved"]);
export const changeStatusEnum = pgEnum("change_status", ["proposed", "approved", "in_progress", "completed", "rolled_back", "rejected"]);
export const assetStatusEnum = pgEnum("asset_status", ["active", "maintenance", "retired", "lost"]);

// Incidents
export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  severity: incidentSeverityEnum("severity").notNull().default("minor"),
  status: incidentStatusEnum("incident_status").notNull().default("open"),
  service: varchar("service", { length: 200 }), // affected service
  assigneeId: uuid("assignee_id").references(() => users.id),
  impact: text("impact"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  timeline: jsonb("timeline").$type<Array<{ timestamp: string; status: string; message: string; userId?: string }>>().default([]),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("incidents_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Incident = typeof incidents.$inferSelect;

// Change Requests
export const changeRequests = pgTable("change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }), // standard, emergency, normal
  status: changeStatusEnum("change_status").notNull().default("proposed"),
  risk: varchar("risk", { length: 50 }).default("medium"), // low, medium, high
  impact: text("impact"),
  rollbackPlan: text("rollback_plan"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// IT Assets
export const itAssets = pgTable("it_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // laptop, server, monitor, phone, license, network
  serialNumber: varchar("serial_number", { length: 200 }),
  manufacturer: varchar("manufacturer", { length: 200 }),
  model: varchar("model", { length: 200 }),
  status: assetStatusEnum("asset_status").notNull().default("active"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  location: varchar("location", { length: 300 }),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  purchaseCost: integer("purchase_cost").default(0), // cents
  warrantyExpiry: timestamp("warranty_expiry", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Status Page Services
export const statusServices = pgTable("status_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  status: varchar("status", { length: 50 }).default("operational"), // operational, degraded, partial_outage, major_outage, maintenance
  order: integer("order").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
