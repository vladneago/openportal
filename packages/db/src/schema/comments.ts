import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// COMMENTS — Universal comments on any resource
// ─────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // What is this comment on?
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // "page", "document", "table_row", "site"
  resourceId: uuid("resource_id").notNull(),

  // Thread support
  parentId: uuid("parent_id").references((): any => comments.id, { onDelete: "cascade" }),

  // Content
  body: text("body").notNull(),

  // Author
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("comments_resource_idx").on(table.resourceType, table.resourceId),
  index("comments_parent_idx").on(table.parentId),
]);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
