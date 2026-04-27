import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["general", "technical", "billing", "feature_request", "bug"]);

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  number: integer("number").notNull(), // auto-incremented per tenant
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  status: ticketStatusEnum("ticket_status").notNull().default("open"),
  priority: ticketPriorityEnum("ticket_priority").notNull().default("medium"),
  category: ticketCategoryEnum("ticket_category").notNull().default("general"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("tickets_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Ticket = typeof tickets.$inferSelect;

export const ticketReplies = pgTable("ticket_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kbArticles = pgTable("kb_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  content: text("content"),
  category: varchar("category", { length: 200 }),
  published: boolean("published").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
