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
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ═════════════════════════════════════════════════════════════════
// SITES — SharePoint-grade site model
// Site collections, hub associations, templates, themes,
// regional settings, features, quotas, audit, sharing.
// ═════════════════════════════════════════════════════════════════

export const siteTemplateEnum = pgEnum("site_template", [
  "blank",
  "team",
  "communication",
  "project",
  "wiki",
  "department",
  "intranet_portal",
  "publishing_portal",
  "knowledge_base",
  "community",
  "search_center",
  "developer",
  "hub",
  "extranet",
  "hr_portal",
  "finance_portal",
  "legal_portal",
  "it_portal",
  "education_portal",
  "healthcare_portal",
  "government_portal",
]);

export const siteTypeEnum = pgEnum("site_type", [
  "team",
  "communication",
  "project",
  "wiki",
  "hub",
  "private_channel",
]);

export const siteStatusEnum = pgEnum("site_status", [
  "provisioning",
  "active",
  "read_only",
  "locked",
  "archived",
  "deleted",
]);

export const siteVisibilityEnum = pgEnum("site_visibility", [
  "private",
  "internal",
  "public",
  "extranet",
]);

export const sharingCapabilityEnum = pgEnum("sharing_capability", [
  "disabled",
  "existing_internal_only",
  "existing_external_only",
  "existing_and_new_external",
  "anyone_with_link",
]);

export const sensitivityLabelEnum = pgEnum("sensitivity_label", [
  "public",
  "general",
  "internal",
  "confidential",
  "highly_confidential",
  "restricted",
  "secret",
  "top_secret",
]);

// ─────────────────────────────────────────────
// SITE COLLECTIONS — top-level container
// (a tenant has many site collections; a hub site is the root of one)
// ─────────────────────────────────────────────

export const siteCollections = pgTable(
  "site_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Quotas
    storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" })
      .notNull()
      .default(107374182400), // 100 GB
    storageWarningBytes: bigint("storage_warning_bytes", { mode: "number" })
      .notNull()
      .default(96636764160), // 90 GB
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" })
      .notNull()
      .default(0),
    serverResourceQuota: integer("server_resource_quota").default(300),
    serverResourceUsed: integer("server_resource_used").default(0),

    // Sharing & external
    sharingCapability: sharingCapabilityEnum("sharing_capability")
      .notNull()
      .default("existing_internal_only"),
    sharingDomainRestriction: jsonb("sharing_domain_restriction")
      .$type<{ mode: "none" | "allow" | "block"; domains: string[] }>()
      .default({ mode: "none", domains: [] }),
    requireAnonymousLinksExpire: boolean("require_anon_links_expire")
      .notNull()
      .default(true),
    anonymousLinkExpirationDays: integer("anon_link_expiration_days").default(90),

    // Information barriers / segments
    informationBarrierMode: varchar("information_barrier_mode", { length: 30 }).default("open"),
    informationBarrierSegments: jsonb("information_barrier_segments")
      .$type<string[]>()
      .default([]),

    // Compliance
    sensitivityLabel: sensitivityLabelEnum("sensitivity_label").default("internal"),
    geoLocation: varchar("geo_location", { length: 10 }).default("EU"),
    retentionPolicyId: uuid("retention_policy_id"),

    // Status
    isLocked: boolean("is_locked").notNull().default(false),
    lockReason: varchar("lock_reason", { length: 200 }),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("site_collections_tenant_idx").on(table.tenantId)],
);

export type SiteCollection = typeof siteCollections.$inferSelect;

// ─────────────────────────────────────────────
// SITES — Modern SharePoint site
// ─────────────────────────────────────────────

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => siteCollections.id, { onDelete: "cascade" }),

    // Identity
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    classificationName: varchar("classification_name", { length: 80 }),

    // Type & template
    type: siteTypeEnum("type").notNull().default("team"),
    template: siteTemplateEnum("template").notNull().default("team"),
    templateId: uuid("template_id"),
    status: siteStatusEnum("status").notNull().default("active"),
    visibility: siteVisibilityEnum("visibility").notNull().default("internal"),

    // Hierarchy
    parentSiteId: uuid("parent_site_id").references((): any => sites.id),
    hubSiteId: uuid("hub_site_id").references((): any => sites.id),
    isHub: boolean("is_hub").notNull().default(false),
    hubAssociations: jsonb("hub_associations")
      .$type<{
        joinedAt?: string;
        approverUserId?: string;
        themeFromHub?: boolean;
        navigationFromHub?: boolean;
      }>()
      .default({}),

    // Branding
    logo: text("logo"),
    coverImage: text("cover_image"),
    siteIcon: text("site_icon"),
    headerLayout: varchar("header_layout", { length: 30 }).default("standard"),
    headerEmphasis: varchar("header_emphasis", { length: 20 }).default("neutral"),
    headerBackground: text("header_background"),

    // Theme — full SharePoint-style theme
    theme: jsonb("theme")
      .$type<{
        name?: string;
        themePrimary?: string;
        themeLighterAlt?: string;
        themeLighter?: string;
        themeLight?: string;
        themeTertiary?: string;
        themeSecondary?: string;
        themeDarkAlt?: string;
        themeDark?: string;
        themeDarker?: string;
        neutralLighterAlt?: string;
        neutralLighter?: string;
        neutralLight?: string;
        neutralQuaternaryAlt?: string;
        neutralQuaternary?: string;
        neutralTertiaryAlt?: string;
        neutralTertiary?: string;
        neutralSecondary?: string;
        neutralPrimaryAlt?: string;
        neutralPrimary?: string;
        neutralDark?: string;
        black?: string;
        white?: string;
        bodyBackground?: string;
        bodyText?: string;
        accent?: string;
        font?: { heading?: string; body?: string };
        radius?: number;
        density?: "comfortable" | "compact" | "spacious";
        mode?: "light" | "dark" | "auto";
      }>()
      .default({}),

    // Navigation
    navigation: jsonb("navigation")
      .$type<
        Array<{
          id: string;
          label: string;
          url: string;
          icon?: string;
          target?: "_self" | "_blank";
          audience?: string[];
          children?: Array<{
            id: string;
            label: string;
            url: string;
            icon?: string;
            target?: "_self" | "_blank";
            audience?: string[];
          }>;
        }>
      >()
      .default([]),
    quickLaunchHidden: boolean("quick_launch_hidden").notNull().default(false),
    megaMenuEnabled: boolean("mega_menu_enabled").notNull().default(false),
    footer: jsonb("footer")
      .$type<{
        enabled: boolean;
        layout?: "simple" | "extended";
        logo?: string;
        emphasis?: "neutral" | "strong";
        links?: Array<{ id: string; label: string; url: string }>;
      }>()
      .default({ enabled: false }),

    // Regional & locale
    defaultLanguage: varchar("default_language", { length: 10 }).default("ro"),
    supportedLanguages: jsonb("supported_languages")
      .$type<string[]>()
      .default(["ro", "en"]),
    timeZone: varchar("time_zone", { length: 60 }).default("Europe/Bucharest"),
    workWeek: jsonb("work_week")
      .$type<{ days: number[]; startHour: number; endHour: number }>()
      .default({ days: [1, 2, 3, 4, 5], startHour: 9, endHour: 18 }),
    calendarType: varchar("calendar_type", { length: 30 }).default("gregorian"),
    firstDayOfWeek: integer("first_day_of_week").default(1),
    currency: varchar("currency", { length: 8 }).default("RON"),
    measurementUnits: varchar("measurement_units", { length: 20 }).default("metric"),

    // Features (modules enabled per-site)
    features: jsonb("features")
      .$type<{
        announcements?: boolean;
        events?: boolean;
        wiki?: boolean;
        forms?: boolean;
        workflows?: boolean;
        chat?: boolean;
        bookings?: boolean;
        kanban?: boolean;
        gantt?: boolean;
        helpdesk?: boolean;
        timeline?: boolean;
        searchScope?: boolean;
        contentApproval?: boolean;
        recycleBin?: boolean;
        socialFeatures?: boolean;
        followSite?: boolean;
        ratingsLikes?: boolean;
      }>()
      .default({
        announcements: true,
        events: true,
        wiki: true,
        forms: true,
        workflows: true,
        chat: true,
        recycleBin: true,
        socialFeatures: true,
        followSite: true,
        ratingsLikes: true,
      }),

    // Sharing
    sharingCapability: sharingCapabilityEnum("sharing_capability")
      .notNull()
      .default("existing_internal_only"),
    inheritSharingFromCollection: boolean("inherit_sharing").notNull().default(true),

    // Compliance
    sensitivityLabel: sensitivityLabelEnum("sensitivity_label").default("internal"),
    informationBarrierSegments: jsonb("ib_segments").$type<string[]>().default([]),
    retentionPolicyId: uuid("retention_policy_id"),
    auditLogEnabled: boolean("audit_log_enabled").notNull().default(true),

    // Storage tracking
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" })
      .notNull()
      .default(0),
    documentCount: integer("document_count").notNull().default(0),
    pageCount: integer("page_count").notNull().default(0),
    listCount: integer("list_count").notNull().default(0),

    // Engagement metrics
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    weeklyActiveUsers: integer("weekly_active_users").default(0),
    monthlyActiveUsers: integer("monthly_active_users").default(0),
    pageViewsLast30d: integer("page_views_last_30d").default(0),

    // SEO / metadata
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: jsonb("meta_keywords").$type<string[]>().default([]),
    canonicalUrl: text("canonical_url"),

    // Ownership
    primaryOwnerId: uuid("primary_owner_id")
      .notNull()
      .references(() => users.id),
    secondaryOwnerId: uuid("secondary_owner_id").references(() => users.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    modifiedBy: uuid("modified_by").references(() => users.id),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sites_tenant_slug_idx").on(table.tenantId, table.slug),
    index("sites_collection_idx").on(table.collectionId),
    index("sites_hub_idx").on(table.hubSiteId),
    index("sites_parent_idx").on(table.parentSiteId),
    index("sites_status_idx").on(table.tenantId, table.status),
  ],
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

// ─────────────────────────────────────────────
// SITE TEMPLATES — pre-built site definitions
// ─────────────────────────────────────────────

export const siteTemplates = pgTable("site_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null = global

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 80 }),
  baseTemplate: siteTemplateEnum("base_template").notNull().default("blank"),

  preview: text("preview"),
  thumbnails: jsonb("thumbnails").$type<string[]>().default([]),

  // The full blueprint
  definition: jsonb("definition")
    .$type<{
      pages?: Array<{
        title: string;
        slug: string;
        layout?: string;
        sections?: any[];
        webParts?: any[];
        isHomePage?: boolean;
      }>;
      lists?: Array<{
        title: string;
        template: string;
        contentTypes?: string[];
        columns?: any[];
        views?: any[];
      }>;
      libraries?: Array<{
        title: string;
        contentTypes?: string[];
        columns?: any[];
      }>;
      navigation?: any[];
      theme?: any;
      groups?: Array<{ name: string; role: string }>;
      features?: Record<string, boolean>;
    }>()
    .notNull(),

  isPublic: boolean("is_public").notNull().default(false),
  isOfficial: boolean("is_official").notNull().default(false),
  installCount: integer("install_count").notNull().default(0),
  rating: integer("rating").default(0),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteTemplate = typeof siteTemplates.$inferSelect;

// ─────────────────────────────────────────────
// SITE DESIGNS — themes that can be applied
// ─────────────────────────────────────────────

export const siteDesigns = pgTable("site_designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  preview: text("preview"),

  isDefault: boolean("is_default").notNull().default(false),
  isInverted: boolean("is_inverted").notNull().default(false),

  palette: jsonb("palette").$type<Record<string, string>>().notNull(),
  typography: jsonb("typography")
    .$type<{
      fontHeading?: string;
      fontBody?: string;
      fontMono?: string;
      sizeScale?: number;
    }>()
    .default({}),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteDesign = typeof siteDesigns.$inferSelect;

// ─────────────────────────────────────────────
// HUB SITE ASSOCIATIONS (m:n auxiliary)
// ─────────────────────────────────────────────

export const hubAssociations = pgTable(
  "hub_associations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hubSiteId: uuid("hub_site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    associatedSiteId: uuid("associated_site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    inheritsTheme: boolean("inherits_theme").notNull().default(true),
    inheritsNavigation: boolean("inherits_navigation").notNull().default(true),
    approvedBy: uuid("approved_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hub_assoc_unique_idx").on(table.hubSiteId, table.associatedSiteId),
  ],
);

export type HubAssociation = typeof hubAssociations.$inferSelect;

// ─────────────────────────────────────────────
// GROUPS — Reusable user groups (SharePoint groups)
// ─────────────────────────────────────────────

export const groupTypeEnum = pgEnum("group_type", [
  "security",
  "distribution",
  "microsoft365",
  "site_owners",
  "site_members",
  "site_visitors",
  "custom",
  "dynamic",
]);

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), // null = tenant-wide

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  email: varchar("email", { length: 255 }),

  type: groupTypeEnum("type").notNull().default("custom"),
  isSystem: boolean("is_system").notNull().default(false),

  // Dynamic membership (for type=dynamic)
  membershipRule: jsonb("membership_rule").$type<{
    enabled: boolean;
    rule?: string; // e.g., "user.department == 'IT'"
    refreshedAt?: string;
  }>(),

  // Settings
  allowExternalMembers: boolean("allow_external_members").notNull().default(false),
  visibility: varchar("visibility", { length: 20 }).default("private"), // private, public

  ownedBy: uuid("owned_by").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Group = typeof groups.$inferSelect;

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isOwner: boolean("is_owner").notNull().default(false),
    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("group_members_g_u_idx").on(table.groupId, table.userId)],
);

export type GroupMember = typeof groupMembers.$inferSelect;

// ─────────────────────────────────────────────
// SITE MEMBERS — quick lookup for users in a site
// ─────────────────────────────────────────────

export const siteRoleEnum = pgEnum("site_role", [
  "owner",
  "member",
  "visitor",
  "designer",
  "contributor",
  "reader",
  "limited",
  "approver",
  "hierarchy_manager",
  "restricted_reader",
  "view_only",
]);

export const siteMembers = pgTable(
  "site_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),

    role: siteRoleEnum("role").notNull().default("member"),
    isExternal: boolean("is_external").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("site_members_site_idx").on(table.siteId),
    index("site_members_user_idx").on(table.userId),
  ],
);

export type SiteMember = typeof siteMembers.$inferSelect;

// ─────────────────────────────────────────────
// SHARING LINKS — anonymous, internal, external
// ─────────────────────────────────────────────

export const sharingLinkTypeEnum = pgEnum("sharing_link_type", [
  "anonymous_view",
  "anonymous_edit",
  "internal_view",
  "internal_edit",
  "specific_users_view",
  "specific_users_edit",
  "embed",
  "review",
]);

export const sharingLinks = pgTable(
  "sharing_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Polymorphic target
    targetType: varchar("target_type", { length: 30 }).notNull(), // site, page, document, list, item
    targetId: uuid("target_id").notNull(),

    type: sharingLinkTypeEnum("type").notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    password: text("password"), // optional bcrypt-hashed
    requiresAuth: boolean("requires_auth").notNull().default(false),
    requiresMfa: boolean("requires_mfa").notNull().default(false),

    allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]),
    allowedEmails: jsonb("allowed_emails").$type<string[]>().default([]),
    blockDownload: boolean("block_download").notNull().default(false),
    watermark: boolean("watermark").notNull().default(false),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),

    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: uuid("revoked_by").references(() => users.id),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("sharing_links_target_idx").on(table.targetType, table.targetId),
    index("sharing_links_tenant_idx").on(table.tenantId),
  ],
);

export type SharingLink = typeof sharingLinks.$inferSelect;

// ─────────────────────────────────────────────
// EXTERNAL USERS — guest access tracking
// ─────────────────────────────────────────────

export const externalUsers = pgTable(
  "external_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 200 }),
    company: varchar("company", { length: 200 }),
    invitedBy: uuid("invited_by").references(() => users.id),

    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    lastAccessAt: timestamp("last_access_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ext_users_tenant_email_idx").on(table.tenantId, table.email)],
);

export type ExternalUser = typeof externalUsers.$inferSelect;

// ─────────────────────────────────────────────
// SITE FOLLOWERS — "follow site" feature
// ─────────────────────────────────────────────

export const siteFollowers = pgTable(
  "site_followers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    notificationsEmail: boolean("notif_email").notNull().default(true),
    notificationsInApp: boolean("notif_in_app").notNull().default(true),
    digestFrequency: varchar("digest_frequency", { length: 20 }).default("weekly"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("site_followers_unique_idx").on(table.siteId, table.userId)],
);

export type SiteFollower = typeof siteFollowers.$inferSelect;

// ─────────────────────────────────────────────
// SITE ACTIVITIES — recent activity stream
// ─────────────────────────────────────────────

export const siteActivities = pgTable(
  "site_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    action: varchar("action", { length: 60 }).notNull(),
    targetType: varchar("target_type", { length: 30 }),
    targetId: uuid("target_id"),
    targetName: varchar("target_name", { length: 500 }),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("site_activities_site_time_idx").on(table.siteId, table.createdAt),
    index("site_activities_user_idx").on(table.userId),
  ],
);

export type SiteActivity = typeof siteActivities.$inferSelect;
