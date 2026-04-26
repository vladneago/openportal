import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// PORTALS — Public-facing portals for external users
// ─────────────────────────────────────────────

export const portalStatusEnum = pgEnum("portal_status", ["draft", "published", "maintenance"]);

export const portals = pgTable("portals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  status: portalStatusEnum("portal_status").notNull().default("draft"),

  // Branding
  logo: text("logo"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#6366F1"),
  customDomain: varchar("custom_domain", { length: 255 }),

  // Template
  template: varchar("template", { length: 50 }).default("default"), // default, corporate, minimal, government

  // Settings
  requireAuth: boolean("require_auth").notNull().default(false),
  settings: jsonb("settings").$type<{
    headerText?: string;
    footerText?: string;
    contactEmail?: string;
    showSearch?: boolean;
  }>().default({}),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("portals_tenant_slug_idx").on(table.tenantId, table.slug),
]);

export type Portal = typeof portals.$inferSelect;

// ─────────────────────────────────────────────
// PORTAL PAGES
// ─────────────────────────────────────────────

export const portalPages = pgTable("portal_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  portalId: uuid("portal_id").notNull().references(() => portals.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  content: jsonb("content").$type<any>().default(null),
  order: varchar("order", { length: 10 }).default("0"),
  isHomePage: boolean("is_home_page").notNull().default(false),
  showInNav: boolean("show_in_nav").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PortalPage = typeof portalPages.$inferSelect;
