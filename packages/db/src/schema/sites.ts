import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const siteTypeEnum = pgEnum("site_type", [
  "team",            // Team site — collaboration
  "communication",   // Communication site — publishing
  "project",         // Project site — project management
  "wiki",            // Wiki — knowledge base
]);

export const siteStatusEnum = pgEnum("site_status", [
  "active",
  "archived",
  "deleted",
]);

// ─────────────────────────────────────────────
// SITES — Top-level content containers
// ─────────────────────────────────────────────

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Identity
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  
  // Type
  type: siteTypeEnum("type").notNull().default("team"),
  status: siteStatusEnum("status").notNull().default("active"),
  
  // Hierarchy
  hubSiteId: uuid("hub_site_id").references((): any => sites.id), // Parent hub site
  
  // Branding
  logo: text("logo"),
  coverImage: text("cover_image"),
  theme: jsonb("theme").$type<{
    primaryColor?: string;
    headerLayout?: "standard" | "compact" | "minimal";
    navStyle?: "left" | "top";
  }>().default({}),
  
  // Navigation
  navigation: jsonb("navigation").$type<Array<{
    id: string;
    label: string;
    url: string;
    icon?: string;
    children?: Array<{ id: string; label: string; url: string; icon?: string }>;
  }>>().default([]),
  
  // Settings
  isPublic: boolean("is_public").notNull().default(false),
  allowExternalSharing: boolean("allow_external_sharing").notNull().default(false),
  defaultLanguage: varchar("default_language", { length: 10 }).default("ro"),
  
  // Storage tracking
  storageUsedBytes: varchar("storage_used_bytes", { length: 20 }).default("0"),
  
  // Ownership
  createdBy: uuid("created_by").notNull().references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Slug must be unique within a tenant
  uniqueIndex("sites_tenant_slug_idx").on(table.tenantId, table.slug),
]);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

// ─────────────────────────────────────────────
// SITE MEMBERS — Who has access to a site
// ─────────────────────────────────────────────

export const siteRoleEnum = pgEnum("site_role", [
  "owner",    // Full control
  "member",   // Create/edit content
  "visitor",  // Read-only
]);

export const siteMembers = pgTable("site_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: siteRoleEnum("site_role").notNull().default("member"),
  
  addedBy: uuid("added_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("site_members_site_user_idx").on(table.siteId, table.userId),
]);

export type SiteMember = typeof siteMembers.$inferSelect;
export type NewSiteMember = typeof siteMembers.$inferInsert;

// ─────────────────────────────────────────────
// GROUPS — Groups of users for permissions
// ─────────────────────────────────────────────

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  isSystem: boolean("is_system").notNull().default(false), // System groups can't be deleted
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId),
]);
