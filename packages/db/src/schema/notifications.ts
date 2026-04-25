import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Content
  type: varchar("type", { length: 50 }).notNull(), // "comment", "mention", "approval", "upload", "share", "system"
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),

  // Link to resource
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  url: text("url"),

  // Who triggered it
  actorId: uuid("actor_id").references(() => users.id),

  // State
  read: boolean("read").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("notifications_user_read_idx").on(table.userId, table.read),
  index("notifications_user_created_idx").on(table.userId, table.createdAt),
]);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
