import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// AUDIT LOG — Track all important actions
// ─────────────────────────────────────────────

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "share",
  "download",
  "upload",
  "approve",
  "reject",
  "invite",
  "permission_change",
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Who
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: varchar("user_email", { length: 255 }), // Preserved even if user is deleted
  
  // What
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // "site", "document", "page", etc.
  resourceId: uuid("resource_id"),
  resourceTitle: varchar("resource_title", { length: 500 }),
  
  // Details
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  
  // Where
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  // When
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("audit_logs_user_idx").on(table.userId),
  index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
