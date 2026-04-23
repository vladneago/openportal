import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, bigint, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ─────────────────────────────────────────────
// DOCUMENT LIBRARIES — Containers for documents within a site
// ─────────────────────────────────────────────

export const documentLibraries = pgTable("document_libraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),

  // Settings
  versioningEnabled: boolean("versioning_enabled").notNull().default(true),
  requireCheckout: boolean("require_checkout").notNull().default(false),
  maxFileSize: bigint("max_file_size", { mode: "number" }).default(104857600), // 100MB default

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("doc_libraries_site_slug_idx").on(table.siteId, table.slug),
]);

export type DocumentLibrary = typeof documentLibraries.$inferSelect;
export type NewDocumentLibrary = typeof documentLibraries.$inferInsert;

// ─────────────────────────────────────────────
// FOLDERS — Hierarchical folder structure
// ─────────────────────────────────────────────

export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  libraryId: uuid("library_id").notNull().references(() => documentLibraries.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  parentId: uuid("parent_id").references((): any => folders.id, { onDelete: "cascade" }),

  // Computed path for fast lookups: "/root-id/parent-id/this-id"
  path: text("path").notNull().default("/"),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("folders_library_parent_idx").on(table.libraryId, table.parentId),
]);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

// ─────────────────────────────────────────────
// DOCUMENTS — Files stored in libraries/folders
// ─────────────────────────────────────────────

export const documentStatusEnum = pgEnum("document_status", [
  "active",
  "archived",
  "deleted",
]);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  libraryId: uuid("library_id").notNull().references(() => documentLibraries.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),

  // File info
  name: varchar("name", { length: 500 }).notNull(),
  extension: varchar("extension", { length: 20 }),
  mimeType: varchar("mime_type", { length: 255 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),

  // Storage
  storagePath: text("storage_path").notNull(), // path in MinIO/S3
  storageKey: text("storage_key").notNull(),   // unique key in bucket

  // Metadata
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  // Status
  status: documentStatusEnum("status").notNull().default("active"),
  currentVersion: integer("current_version").notNull().default(1),

  // Check-out
  checkedOutBy: uuid("checked_out_by").references(() => users.id),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),

  // Ownership
  createdBy: uuid("created_by").notNull().references(() => users.id),
  modifiedBy: uuid("modified_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("documents_library_folder_idx").on(table.libraryId, table.folderId),
  index("documents_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// ─────────────────────────────────────────────
// DOCUMENT VERSIONS — Version history
// ─────────────────────────────────────────────

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),

  version: integer("version").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
  storagePath: text("storage_path").notNull(),
  storageKey: text("storage_key").notNull(),

  comment: text("comment"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("doc_versions_doc_version_idx").on(table.documentId, table.version),
]);

export type DocumentVersion = typeof documentVersions.$inferSelect;
