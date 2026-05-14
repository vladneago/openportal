import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ═════════════════════════════════════════════════════════════════
// TAXONOMY / TERM STORE — Managed Metadata Service equivalent
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// TERM STORES — top-level container
// ─────────────────────────────────────────────

export const termStores = pgTable("term_stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  defaultLanguage: varchar("default_language", { length: 10 }).default("ro"),
  workingLanguages: jsonb("working_languages").$type<string[]>().default(["ro", "en"]),

  isReadOnly: boolean("is_read_only").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TermStore = typeof termStores.$inferSelect;

// ─────────────────────────────────────────────
// TERM GROUPS — logical groupings of term sets
// ─────────────────────────────────────────────

export const termGroups = pgTable(
  "term_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    termStoreId: uuid("term_store_id")
      .notNull()
      .references(() => termStores.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),

    isSystem: boolean("is_system").notNull().default(false),
    isSiteCollectionScoped: boolean("is_site_scoped").notNull().default(false),
    siteCollectionId: uuid("site_collection_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("term_groups_store_idx").on(table.termStoreId)],
);

export type TermGroup = typeof termGroups.$inferSelect;

// ─────────────────────────────────────────────
// TERM SETS — named collections of terms (taxonomies)
// ─────────────────────────────────────────────

export const termSets = pgTable(
  "term_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    termGroupId: uuid("term_group_id")
      .notNull()
      .references(() => termGroups.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    contact: varchar("contact", { length: 255 }),
    owner: uuid("owner").references(() => users.id),

    isOpen: boolean("is_open").notNull().default(false), // open = users can submit terms
    isAvailableForTagging: boolean("is_available_for_tagging").notNull().default(true),
    isUsedForSiteNavigation: boolean("is_used_for_navigation").notNull().default(false),
    customSortOrder: jsonb("custom_sort_order").$type<string[]>(),

    stakeholders: jsonb("stakeholders").$type<string[]>().default([]),
    customProperties: jsonb("custom_properties").$type<Record<string, string>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("term_sets_group_idx").on(table.termGroupId)],
);

export type TermSet = typeof termSets.$inferSelect;

// ─────────────────────────────────────────────
// TERMS — actual taxonomy terms (hierarchical)
// ─────────────────────────────────────────────

export const terms = pgTable(
  "terms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    termSetId: uuid("term_set_id")
      .notNull()
      .references(() => termSets.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => terms.id, { onDelete: "cascade" }),

    label: varchar("label", { length: 500 }).notNull(),
    labels: jsonb("labels").$type<Record<string, string>>().default({}), // language -> label
    synonyms: jsonb("synonyms").$type<string[]>().default([]),
    abbreviation: varchar("abbreviation", { length: 50 }),

    description: text("description"),
    descriptions: jsonb("descriptions").$type<Record<string, string>>().default({}),

    // Position
    path: text("path").notNull().default("/"),
    depth: integer("depth").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),

    // Status
    isDeprecated: boolean("is_deprecated").notNull().default(false),
    isAvailableForTagging: boolean("is_available_for_tagging").notNull().default(true),
    isReused: boolean("is_reused").notNull().default(false),
    sourceTermId: uuid("source_term_id"),

    // Metadata
    customProperties: jsonb("custom_properties").$type<Record<string, string>>().default({}),
    localCustomProperties: jsonb("local_custom_properties")
      .$type<Record<string, string>>()
      .default({}),

    // Stats
    usageCount: integer("usage_count").notNull().default(0),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("terms_set_parent_idx").on(table.termSetId, table.parentId),
    index("terms_path_idx").on(table.path),
  ],
);

export type Term = typeof terms.$inferSelect;

// ─────────────────────────────────────────────
// TAGGED ITEMS — link a term to any object
// ─────────────────────────────────────────────

export const taggedItems = pgTable(
  "tagged_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    targetType: varchar("target_type", { length: 60 }).notNull(),
    targetId: uuid("target_id").notNull(),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),

    isPinned: boolean("is_pinned").notNull().default(false),
    weight: integer("weight").notNull().default(1),

    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tagged_items_target_idx").on(table.targetType, table.targetId),
    index("tagged_items_term_idx").on(table.termId),
    uniqueIndex("tagged_items_unique_idx").on(table.targetType, table.targetId, table.termId),
  ],
);

// ─────────────────────────────────────────────
// MANAGED METADATA NAVIGATION
// ─────────────────────────────────────────────

export const metadataNavigation = pgTable(
  "metadata_navigation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    listId: uuid("list_id"),
    siteId: uuid("site_id"),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),

    // Hierarchy fields used as navigation
    hierarchyFields: jsonb("hierarchy_fields").$type<string[]>().default([]),
    keyFilters: jsonb("key_filters").$type<string[]>().default([]),

    isAutomaticIndexCreated: boolean("auto_index").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("metadata_nav_list_idx").on(table.listId),
    index("metadata_nav_site_idx").on(table.siteId),
  ],
);

// ─────────────────────────────────────────────
// SEARCH SCHEMA — managed properties & refiners
// ─────────────────────────────────────────────

export const managedPropertyTypeEnum = pgEnum("managed_property_type", [
  "text",
  "integer",
  "decimal",
  "datetime",
  "yes_no",
  "binary",
  "double",
  "geography",
  "person",
]);

export const managedProperties = pgTable("managed_properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  type: managedPropertyTypeEnum("type").notNull(),

  isSearchable: boolean("is_searchable").notNull().default(true),
  isQueryable: boolean("is_queryable").notNull().default(true),
  isRetrievable: boolean("is_retrievable").notNull().default(true),
  isRefinable: boolean("is_refinable").notNull().default(false),
  isSortable: boolean("is_sortable").notNull().default(false),
  isMultiValued: boolean("is_multi_valued").notNull().default(false),
  isCompleteMatching: boolean("is_complete_matching").notNull().default(false),

  // Mapping from crawled properties (column internalName)
  crawledPropertyMappings: jsonb("crawled_mappings").$type<string[]>().default([]),

  weight: integer("weight").default(0),
  alias: jsonb("alias").$type<string[]>().default([]),

  isHidden: boolean("is_hidden").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// SEARCH RESULT SOURCES — federated/saved searches
// ─────────────────────────────────────────────

export const searchResultSources = pgTable("search_result_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  protocol: varchar("protocol", { length: 30 }).default("local"), // local, openSearch, exchange, remote
  type: varchar("type", { length: 30 }).default("everything"),

  query: text("query"),
  credentialsType: varchar("credentials_type", { length: 30 }),
  remoteUrl: text("remote_url"),

  isDefault: boolean("is_default").notNull().default(false),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// QUERY RULES — promoted results, banner, query transformations
// ─────────────────────────────────────────────

export const queryRules = pgTable("query_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  conditions: jsonb("conditions")
    .$type<{
      queryContains?: string[];
      queryMatches?: string;
      queryStartsWith?: string;
      queryEndsWith?: string;
      audience?: string[];
    }>()
    .notNull()
    .default({}),

  actions: jsonb("actions")
    .$type<{
      promotedResults?: Array<{ title: string; url: string; description?: string }>;
      banner?: { title: string; description?: string; url?: string; image?: string };
      queryTransformation?: string;
      changeRanking?: { boostManagedProperty?: string; boostValue?: number };
    }>()
    .notNull()
    .default({}),

  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
