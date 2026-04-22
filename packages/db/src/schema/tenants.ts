import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// TENANTS — Each tenant is an organization/company
// This is the foundation of multi-tenancy
// ─────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // used in URLs: slug.openportal.app
  
  // Branding
  logo: text("logo"),                    // URL to logo in object storage
  favicon: text("favicon"),              // URL to favicon
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563EB"),
  
  // Configuration
  customDomain: varchar("custom_domain", { length: 255 }).unique(), // e.g., portal.company.com
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, starter, business, enterprise
  
  // Limits (based on plan)
  maxUsers: varchar("max_users", { length: 20 }).default("10"),
  maxStorageBytes: varchar("max_storage_bytes", { length: 20 }).default("5368709120"), // 5 GB
  maxSites: varchar("max_sites", { length: 20 }).default("3"),
  
  // Feature flags — which modules are activated
  enabledModules: jsonb("enabled_modules").$type<string[]>().default([]),
  
  // Settings
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
