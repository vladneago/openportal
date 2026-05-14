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
  bigint,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";

// ═════════════════════════════════════════════════════════════════
// LISTS & LIBRARIES — SharePoint-grade
// Content types, columns (40+ types), views, formatting,
// validation, lookups, calculated fields, attachments, versioning,
// approval, retention, etc.
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// CONTENT TYPES — reusable schemas for items
// ─────────────────────────────────────────────

export const contentTypeKindEnum = pgEnum("content_type_kind", [
  "item",
  "document",
  "folder",
  "page",
  "event",
  "task",
  "issue",
  "announcement",
  "discussion",
  "contact",
  "link",
  "form_response",
  "wiki_page",
  "publication",
  "system",
  "custom",
]);

export const contentTypes = pgTable(
  "content_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), // null = tenant-scoped (Content Type Hub)

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    group: varchar("group", { length: 100 }).default("Custom"),
    kind: contentTypeKindEnum("kind").notNull().default("item"),

    parentContentTypeId: uuid("parent_content_type_id").references((): any => contentTypes.id),
    isSealed: boolean("is_sealed").notNull().default(false),
    isReadOnly: boolean("is_read_only").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),

    // Default values for fields when created
    defaults: jsonb("defaults").$type<Record<string, unknown>>().default({}),

    // Lifecycle
    workflowDefinitionId: uuid("workflow_definition_id"),
    informationManagementPolicyId: uuid("info_policy_id"),
    documentTemplateUrl: text("document_template_url"),

    // Display
    icon: varchar("icon", { length: 60 }),
    color: varchar("color", { length: 20 }),
    displayFormat: jsonb("display_format").$type<Record<string, unknown>>().default({}),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_types_tenant_idx").on(table.tenantId),
    index("content_types_site_idx").on(table.siteId),
  ],
);

export type ContentType = typeof contentTypes.$inferSelect;

// ─────────────────────────────────────────────
// SITE COLUMNS — reusable column definitions
// (when used by content types or lists, they become "fields")
// ─────────────────────────────────────────────

export const columnTypeEnum = pgEnum("column_type", [
  "single_line_text",
  "multi_line_text",
  "rich_text",
  "markdown",
  "number",
  "currency",
  "percent",
  "date",
  "datetime",
  "time",
  "boolean",
  "choice",
  "multi_choice",
  "lookup",
  "multi_lookup",
  "person",
  "multi_person",
  "person_or_group",
  "url",
  "email",
  "phone",
  "calculated",
  "image",
  "file_attachment",
  "geolocation",
  "rating",
  "thumbs",
  "managed_metadata",
  "json",
  "color",
  "duration",
  "barcode",
  "external_data",
  "auto_number",
  "uuid",
  "ip_address",
  "country",
  "language",
  "currency_code",
  "rich_media",
  "code",
  "formula",
  "html",
  "tag",
  "progress",
  "status",
  "label",
  "signature",
  "audit",
]);

export const siteColumns = pgTable(
  "site_columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),

    internalName: varchar("internal_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    description: text("description"),
    group: varchar("group", { length: 100 }).default("Custom"),

    type: columnTypeEnum("type").notNull(),
    isRequired: boolean("is_required").notNull().default(false),
    isUnique: boolean("is_unique").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    isReadOnly: boolean("is_read_only").notNull().default(false),
    isIndexed: boolean("is_indexed").notNull().default(false),
    isSearchable: boolean("is_searchable").notNull().default(true),

    // Field-type-specific configuration
    config: jsonb("config")
      .$type<{
        // text
        maxLength?: number;
        minLength?: number;
        regex?: string;
        regexErrorMessage?: string;
        // number / currency
        min?: number;
        max?: number;
        precision?: number;
        currency?: string;
        // choice
        choices?: Array<{ value: string; label: string; color?: string; icon?: string }>;
        allowFillIn?: boolean;
        displayAs?: "dropdown" | "radio" | "checkbox" | "combo" | "tags" | "buttons";
        // date / time
        format?: string;
        showTime?: boolean;
        defaultToToday?: boolean;
        friendlyFormat?: boolean;
        // lookup
        lookupListId?: string;
        lookupColumn?: string;
        lookupAdditionalColumns?: string[];
        cascadeDelete?: boolean;
        restrictDelete?: boolean;
        // person
        allowMultiple?: boolean;
        showPresence?: boolean;
        showPicture?: boolean;
        groupOnly?: boolean;
        // calculated
        formula?: string;
        resultType?: string;
        // managed metadata
        termSetId?: string;
        anchorTermId?: string;
        // rating
        scale?: number;
        // image
        bucket?: string;
        maxSizeBytes?: number;
        allowedMimeTypes?: string[];
        // url
        target?: "_self" | "_blank";
        displayAsImage?: boolean;
        // formatting
        backgroundColor?: string;
        textColor?: string;
        icon?: string;
      }>()
      .default({}),

    defaultValue: jsonb("default_value").$type<unknown>(),
    validationFormula: text("validation_formula"),
    validationMessage: text("validation_message"),
    columnFormatJson: jsonb("column_format_json").$type<Record<string, unknown>>(),

    enforceUniqueValues: boolean("enforce_unique_values").notNull().default(false),
    auditChanges: boolean("audit_changes").notNull().default(false),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("site_columns_internal_idx").on(table.siteId, table.internalName),
    index("site_columns_tenant_idx").on(table.tenantId),
  ],
);

export type SiteColumn = typeof siteColumns.$inferSelect;

// ─────────────────────────────────────────────
// CONTENT TYPE COLUMNS — fields attached to content types
// ─────────────────────────────────────────────

export const contentTypeColumns = pgTable(
  "content_type_columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentTypeId: uuid("content_type_id")
      .notNull()
      .references(() => contentTypes.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => siteColumns.id, { onDelete: "cascade" }),

    // Per-CT overrides
    isRequired: boolean("is_required"),
    isHidden: boolean("is_hidden"),
    isReadOnly: boolean("is_read_only"),
    showInDisplayForm: boolean("show_display").notNull().default(true),
    showInEditForm: boolean("show_edit").notNull().default(true),
    showInNewForm: boolean("show_new").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    section: varchar("section", { length: 80 }),
  },
  (table) => [uniqueIndex("ct_cols_unique_idx").on(table.contentTypeId, table.columnId)],
);

// ─────────────────────────────────────────────
// LISTS — top-level data containers
// ─────────────────────────────────────────────

export const listTemplateEnum = pgEnum("list_template", [
  "generic_list",
  "document_library",
  "picture_library",
  "asset_library",
  "form_library",
  "wiki_library",
  "site_pages_library",
  "calendar",
  "tasks",
  "contacts",
  "links",
  "announcements",
  "discussions",
  "issues",
  "events",
  "kpi",
  "report_library",
  "data_connection_library",
  "process_diagram_library",
  "translation_library",
  "external_list",
  "survey",
]);

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    template: listTemplateEnum("template").notNull().default("generic_list"),

    icon: varchar("icon", { length: 60 }),
    color: varchar("color", { length: 20 }),

    // Visibility
    isHidden: boolean("is_hidden").notNull().default(false),
    showInQuickLaunch: boolean("show_quick_launch").notNull().default(true),
    showInSitePages: boolean("show_site_pages").notNull().default(false),

    // Versioning
    versioningEnabled: boolean("versioning_enabled").notNull().default(true),
    minorVersionsEnabled: boolean("minor_versions_enabled").notNull().default(false),
    majorVersionLimit: integer("major_version_limit").default(50),
    minorVersionLimit: integer("minor_version_limit").default(10),
    requireCheckout: boolean("require_checkout").notNull().default(false),

    // Approval
    contentApprovalEnabled: boolean("content_approval_enabled").notNull().default(false),
    draftItemSecurity: varchar("draft_item_security", { length: 30 }).default("readers"),

    // Attachments
    attachmentsEnabled: boolean("attachments_enabled").notNull().default(true),
    maxAttachmentSize: bigint("max_attachment_size", { mode: "number" }).default(104857600),

    // Folders & content types
    foldersEnabled: boolean("folders_enabled").notNull().default(true),
    contentTypesEnabled: boolean("content_types_enabled").notNull().default(false),

    // Row-level
    enableRatings: boolean("enable_ratings").notNull().default(false),
    enableLikes: boolean("enable_likes").notNull().default(false),
    enableComments: boolean("enable_comments").notNull().default(true),

    // Forms
    listFormType: varchar("list_form_type", { length: 30 }).default("default"),
    customFormUrl: text("custom_form_url"),

    // Validation
    validationFormula: text("validation_formula"),
    validationMessage: text("validation_message"),

    // Item count cache
    itemCount: integer("item_count").notNull().default(0),

    // Permissions
    inheritsPermissions: boolean("inherits_permissions").notNull().default(true),
    readSecurity: integer("read_security").notNull().default(1), // 1=all, 2=author only
    writeSecurity: integer("write_security").notNull().default(1), // 1=all, 2=author only, 4=none

    // Indexed columns
    indexedColumnIds: jsonb("indexed_column_ids").$type<string[]>().default([]),

    // Default content type for new items
    defaultContentTypeId: uuid("default_content_type_id").references(() => contentTypes.id),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    modifiedBy: uuid("modified_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lists_site_slug_idx").on(table.siteId, table.slug),
    index("lists_tenant_idx").on(table.tenantId),
  ],
);

export type List = typeof lists.$inferSelect;

// ─────────────────────────────────────────────
// LIST CONTENT TYPES — which CTs a list supports
// ─────────────────────────────────────────────

export const listContentTypes = pgTable(
  "list_content_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    contentTypeId: uuid("content_type_id")
      .notNull()
      .references(() => contentTypes.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("list_ct_unique_idx").on(table.listId, table.contentTypeId)],
);

// ─────────────────────────────────────────────
// LIST COLUMNS — concrete column definitions
// (either inherited from a content type or list-specific)
// ─────────────────────────────────────────────

export const listColumns = pgTable(
  "list_columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    sourceColumnId: uuid("source_column_id").references(() => siteColumns.id),

    internalName: varchar("internal_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    description: text("description"),

    type: columnTypeEnum("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),

    isRequired: boolean("is_required").notNull().default(false),
    isUnique: boolean("is_unique").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    isReadOnly: boolean("is_read_only").notNull().default(false),
    isIndexed: boolean("is_indexed").notNull().default(false),
    isSearchable: boolean("is_searchable").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),

    defaultValue: jsonb("default_value").$type<unknown>(),
    validationFormula: text("validation_formula"),
    validationMessage: text("validation_message"),
    columnFormatJson: jsonb("column_format_json").$type<Record<string, unknown>>(),

    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("list_columns_internal_idx").on(table.listId, table.internalName),
  ],
);

export type ListColumn = typeof listColumns.$inferSelect;

// ─────────────────────────────────────────────
// LIST ITEMS — actual data rows (EAV-ish via JSONB)
// ─────────────────────────────────────────────

export const listItemStatusEnum = pgEnum("list_item_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "published",
  "checked_out",
  "archived",
  "deleted",
]);

export const listItems = pgTable(
  "list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    contentTypeId: uuid("content_type_id").references(() => contentTypes.id),
    folderId: uuid("folder_id"),

    // Auto-incrementing ID per list (SharePoint-style)
    listItemNumber: integer("list_item_number").notNull(),
    title: varchar("title", { length: 500 }),

    // The actual values, keyed by column internalName
    values: jsonb("values").$type<Record<string, unknown>>().notNull().default({}),

    // System fields
    status: listItemStatusEnum("status").notNull().default("published"),
    contentApprovalStatus: varchar("approval_status", { length: 30 }),
    contentApprovalNotes: text("approval_notes"),

    versionMajor: integer("version_major").notNull().default(1),
    versionMinor: integer("version_minor").notNull().default(0),

    // Check-out
    checkedOutById: uuid("checked_out_by").references(() => users.id),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    checkInComment: text("check_in_comment"),

    // Engagement
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
    ratingCount: integer("rating_count").notNull().default(0),

    // Permissions inheritance
    inheritsPermissions: boolean("inherits_permissions").notNull().default(true),

    // Timestamps
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    modifiedBy: uuid("modified_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("list_items_number_idx").on(table.listId, table.listItemNumber),
    index("list_items_list_status_idx").on(table.listId, table.status),
    index("list_items_folder_idx").on(table.folderId),
    index("list_items_created_idx").on(table.createdAt),
  ],
);

export type ListItem = typeof listItems.$inferSelect;

// ─────────────────────────────────────────────
// LIST ITEM VERSIONS — full version history
// ─────────────────────────────────────────────

export const listItemVersions = pgTable(
  "list_item_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listItemId: uuid("list_item_id")
      .notNull()
      .references(() => listItems.id, { onDelete: "cascade" }),

    versionLabel: varchar("version_label", { length: 30 }).notNull(),
    versionMajor: integer("version_major").notNull(),
    versionMinor: integer("version_minor").notNull().default(0),

    isMinor: boolean("is_minor").notNull().default(false),
    isCurrent: boolean("is_current").notNull().default(false),

    values: jsonb("values").$type<Record<string, unknown>>().notNull(),
    title: varchar("title", { length: 500 }),
    comment: text("comment"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("list_item_ver_idx").on(table.listItemId, table.versionLabel),
    index("list_item_ver_current_idx").on(table.listItemId, table.isCurrent),
  ],
);

// ─────────────────────────────────────────────
// LIST VIEWS — saved queries with formatting
// ─────────────────────────────────────────────

export const viewTypeEnum = pgEnum("view_type", [
  "standard",
  "datasheet",
  "calendar",
  "gantt",
  "board",
  "timeline",
  "gallery",
  "tiles",
  "map",
  "chart",
  "pivot",
  "tree",
]);

export const listViews = pgTable(
  "list_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    type: viewTypeEnum("type").notNull().default("standard"),

    isDefault: boolean("is_default").notNull().default(false),
    isPersonal: boolean("is_personal").notNull().default(false),
    isMobileDefault: boolean("is_mobile_default").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),

    // Columns shown
    columns: jsonb("columns")
      .$type<
        Array<{
          internalName: string;
          width?: number;
          frozen?: boolean;
          format?: Record<string, unknown>;
          hidden?: boolean;
        }>
      >()
      .notNull()
      .default([]),

    // Filters
    filters: jsonb("filters")
      .$type<
        Array<{
          column: string;
          operator: string;
          value: unknown;
          logic?: "and" | "or";
        }>
      >()
      .default([]),

    // Sorting
    sorts: jsonb("sorts")
      .$type<Array<{ column: string; direction: "asc" | "desc" }>>()
      .default([]),

    // Grouping
    groupBy: jsonb("group_by")
      .$type<{
        column?: string;
        secondaryColumn?: string;
        collapseByDefault?: boolean;
        order?: "asc" | "desc";
      }>()
      .default({}),

    // Aggregations / totals
    totals: jsonb("totals")
      .$type<Record<string, "none" | "count" | "sum" | "avg" | "min" | "max" | "std" | "var">>()
      .default({}),

    // Limits
    rowLimit: integer("row_limit").default(30),
    paged: boolean("paged").notNull().default(true),

    // Type-specific config
    typeConfig: jsonb("type_config")
      .$type<{
        // calendar
        startDateColumn?: string;
        endDateColumn?: string;
        titleColumn?: string;
        descriptionColumn?: string;
        // gantt
        progressColumn?: string;
        dependenciesColumn?: string;
        // board (kanban)
        boardColumn?: string;
        boardLanes?: Array<{ value: string; label: string; color?: string }>;
        // gallery / tiles
        thumbnailColumn?: string;
        // map
        latColumn?: string;
        lngColumn?: string;
        // chart
        chartType?: "bar" | "line" | "pie" | "area" | "scatter" | "donut" | "radar";
        xAxisColumn?: string;
        yAxisColumns?: string[];
        seriesColumn?: string;
      }>()
      .default({}),

    // Conditional formatting
    rowFormatting: jsonb("row_formatting").$type<Record<string, unknown>>(),
    customCss: text("custom_css"),

    // Audience targeting
    audienceGroupIds: jsonb("audience_group_ids").$type<string[]>().default([]),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("list_views_slug_idx").on(table.listId, table.slug)],
);

export type ListView = typeof listViews.$inferSelect;

// ─────────────────────────────────────────────
// LIST FOLDERS — hierarchical folders within lists
// ─────────────────────────────────────────────

export const listFolders = pgTable(
  "list_folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => listFolders.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    path: text("path").notNull().default("/"),
    contentTypeId: uuid("content_type_id").references(() => contentTypes.id),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("list_folders_list_parent_idx").on(table.listId, table.parentId)],
);

export type ListFolder = typeof listFolders.$inferSelect;

// ─────────────────────────────────────────────
// LIST ITEM ATTACHMENTS — per-item file attachments
// ─────────────────────────────────────────────

export const listItemAttachments = pgTable(
  "list_item_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listItemId: uuid("list_item_id")
      .notNull()
      .references(() => listItems.id, { onDelete: "cascade" }),

    fileName: varchar("file_name", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 200 }),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull(),

    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("list_item_attach_idx").on(table.listItemId)],
);

// ─────────────────────────────────────────────
// LIKES & RATINGS
// ─────────────────────────────────────────────

export const itemLikes = pgTable(
  "item_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: varchar("target_type", { length: 30 }).notNull(),
    targetId: uuid("target_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("item_likes_unique_idx").on(table.targetType, table.targetId, table.userId),
  ],
);

export const itemRatings = pgTable(
  "item_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: varchar("target_type", { length: 30 }).notNull(),
    targetId: uuid("target_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    review: text("review"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("item_ratings_unique_idx").on(table.targetType, table.targetId, table.userId),
  ],
);
