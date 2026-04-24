import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ─────────────────────────────────────────────
// TABLES — Equivalent to SharePoint Lists but relational
// ─────────────────────────────────────────────

export const columnTypeEnum = pgEnum("column_type", [
  "text",
  "number",
  "date",
  "datetime",
  "boolean",
  "choice",
  "multi_choice",
  "person",
  "url",
  "email",
  "currency",
  "rating",
  "image",
  "rich_text",
]);

export const tables = pgTable("tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }).default("📋"), // emoji icon

  // Default view
  defaultView: varchar("default_view", { length: 20 }).default("grid"), // grid, kanban, calendar, gallery

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("tables_site_slug_idx").on(table.siteId, table.slug),
]);

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;

// ─────────────────────────────────────────────
// COLUMNS — Typed column definitions
// ─────────────────────────────────────────────

export const columns = pgTable("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  type: columnTypeEnum("type").notNull().default("text"),
  order: integer("order").notNull().default(0),
  width: integer("width").default(200), // px

  // Type-specific config
  config: jsonb("config").$type<{
    required?: boolean;
    defaultValue?: string;
    choices?: string[];          // for choice/multi_choice
    min?: number;                // for number/currency
    max?: number;
    currency?: string;           // for currency (EUR, USD, RON)
    dateFormat?: string;         // for date/datetime
    ratingMax?: number;          // for rating (default 5)
  }>().default({}),

  // Is this column used for kanban grouping?
  isKanbanField: boolean("is_kanban_field").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("columns_table_order_idx").on(table.tableId, table.order),
]);

export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;

// ─────────────────────────────────────────────
// ROWS — Data rows stored as JSONB
// ─────────────────────────────────────────────

export const rows = pgTable("rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),

  // All column values stored as JSON: { "col-uuid": value, ... }
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),

  order: integer("order").notNull().default(0),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("rows_table_order_idx").on(table.tableId, table.order),
]);

export type Row = typeof rows.$inferSelect;
export type NewRow = typeof rows.$inferInsert;
