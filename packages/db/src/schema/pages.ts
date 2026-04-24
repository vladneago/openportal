import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ─────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────

export const pageStatusEnum = pgEnum("page_status", [
  "draft",
  "published",
  "archived",
]);

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),

  // Content stored as TipTap JSON
  content: jsonb("content").$type<any>().default(null),

  // Status
  status: pageStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),

  // Layout
  layout: varchar("layout", { length: 50 }).default("default"), // default, full-width, sidebar

  // Analytics
  viewCount: integer("view_count").notNull().default(0),

  // Ownership
  createdBy: uuid("created_by").notNull().references(() => users.id),
  modifiedBy: uuid("modified_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("pages_site_slug_idx").on(table.siteId, table.slug),
  index("pages_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
