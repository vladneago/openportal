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
import { sites } from "./sites";

// ═════════════════════════════════════════════════════════════════
// MODERN PAGES — SharePoint-grade
// Sections, columns, web parts (40+ types), templates, news,
// translations, audience targeting, scheduled publishing.
// ═════════════════════════════════════════════════════════════════

export const pageStatusEnum = pgEnum("page_status", [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
  "expired",
]);

export const pageLayoutEnum = pgEnum("page_layout", [
  "article",
  "home",
  "topic",
  "single_part",
  "blank",
  "wiki",
  "newsletter",
  "spaces",
  "landing",
  "campaign",
  "announcement",
  "event",
  "team_dashboard",
  "knowledge_base",
  "press_release",
]);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    coverImageAlt: varchar("cover_image_alt", { length: 500 }),
    coverImageFocalPoint: jsonb("cover_image_focal_point").$type<{ x: number; y: number }>(),

    // Content type & layout
    contentTypeId: uuid("content_type_id"),
    layout: pageLayoutEnum("layout").notNull().default("article"),
    headerLayout: varchar("header_layout", { length: 30 }).default("full_width"),
    headerTextAlignment: varchar("header_text_align", { length: 20 }).default("left"),
    showAuthor: boolean("show_author").notNull().default(true),
    showPublishedDate: boolean("show_published_date").notNull().default(true),
    showTopicHeader: boolean("show_topic_header").notNull().default(false),
    topicHeaderLabel: varchar("topic_header", { length: 200 }),

    // Page canvas — sections, columns, web parts
    canvas: jsonb("canvas")
      .$type<{
        sections: Array<{
          id: string;
          layout:
            | "one_column"
            | "two_column"
            | "three_column"
            | "left_sidebar"
            | "right_sidebar"
            | "vertical_section"
            | "one_column_full"
            | "thirty_seventy"
            | "seventy_thirty";
          background?: {
            type: "color" | "image" | "gradient" | "none";
            color?: string;
            image?: string;
            gradient?: string;
            overlay?: string;
            blur?: number;
          };
          spacing?: "compact" | "normal" | "spacious";
          padding?: { top?: number; bottom?: number; left?: number; right?: number };
          isCollapsed?: boolean;
          isCollapsible?: boolean;
          audience?: string[];
          columns: Array<{
            id: string;
            width: number; // 1-12 grid
            verticalAlign?: "top" | "center" | "bottom";
            webParts: string[]; // ids referencing web_parts table
          }>;
        }>;
      }>()
      .default({ sections: [] }),

    // Status / lifecycle
    status: pageStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true }),
    scheduledExpireAt: timestamp("scheduled_expire_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),

    // News
    promotedAsNews: boolean("promoted_as_news").notNull().default(false),
    newsCategory: varchar("news_category", { length: 100 }),
    boostedUntil: timestamp("boosted_until", { withTimezone: true }),
    boostScore: integer("boost_score").default(0),

    // Comments / engagement
    commentsEnabled: boolean("comments_enabled").notNull().default(true),
    likesEnabled: boolean("likes_enabled").notNull().default(true),

    // Translation
    isTranslation: boolean("is_translation").notNull().default(false),
    sourcePageId: uuid("source_page_id").references((): any => pages.id),
    language: varchar("language", { length: 10 }).default("ro"),

    // SEO
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: jsonb("meta_keywords").$type<string[]>().default([]),
    canonicalUrl: text("canonical_url"),
    ogImage: text("og_image"),
    twitterCard: varchar("twitter_card", { length: 30 }).default("summary_large_image"),
    noIndex: boolean("no_index").notNull().default(false),

    // Audience targeting
    audienceGroupIds: jsonb("audience_group_ids").$type<string[]>().default([]),

    // Engagement
    viewCount: integer("view_count").notNull().default(0),
    uniqueViewCount: integer("unique_view_count").notNull().default(0),
    averageReadTime: integer("average_read_time").default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),

    // Approval
    approvalStatus: varchar("approval_status", { length: 30 }),
    requiresApproval: boolean("requires_approval").notNull().default(false),

    // Permissions
    inheritsPermissions: boolean("inherits_permissions").notNull().default(true),
    isPasswordProtected: boolean("is_password_protected").notNull().default(false),
    accessPasswordHash: text("access_password_hash"),

    // Ownership
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    modifiedBy: uuid("modified_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("pages_site_slug_idx").on(table.siteId, table.slug),
    index("pages_tenant_status_idx").on(table.tenantId, table.status),
    index("pages_news_idx").on(table.tenantId, table.promotedAsNews, table.publishedAt),
    index("pages_published_idx").on(table.publishedAt),
  ],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

// ─────────────────────────────────────────────
// PAGE VERSIONS — full history
// ─────────────────────────────────────────────

export const pageVersions = pgTable(
  "page_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),

    versionLabel: varchar("version_label", { length: 30 }).notNull(),
    versionMajor: integer("version_major").notNull(),
    versionMinor: integer("version_minor").notNull().default(0),

    title: varchar("title", { length: 500 }).notNull(),
    excerpt: text("excerpt"),
    canvas: jsonb("canvas").$type<unknown>().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    isCurrent: boolean("is_current").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),

    comment: text("comment"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("page_ver_unique_idx").on(table.pageId, table.versionLabel),
    index("page_ver_current_idx").on(table.pageId, table.isCurrent),
  ],
);

// ─────────────────────────────────────────────
// WEB PARTS — the building blocks of pages
// ─────────────────────────────────────────────

export const webPartTypeEnum = pgEnum("web_part_type", [
  "text",
  "rich_text",
  "image",
  "image_gallery",
  "video",
  "audio",
  "embed",
  "file_viewer",
  "code_snippet",
  "markdown",
  "divider",
  "spacer",
  "heading",
  "quote",
  "callout",
  "button",
  "icon",
  "hero",
  "banner",
  "carousel",
  "tabs",
  "accordion",
  "card_set",
  "people",
  "people_picker",
  "org_chart",
  "list_view",
  "list_form",
  "document_library",
  "documents",
  "recent_documents",
  "calendar",
  "events",
  "news",
  "highlighted_content",
  "quick_links",
  "link_picker",
  "site_activity",
  "user_profile",
  "site_membership",
  "site_logo",
  "search_box",
  "search_results",
  "yammer_feed",
  "twitter_feed",
  "rss_feed",
  "weather",
  "world_clock",
  "countdown",
  "stock_ticker",
  "form",
  "survey",
  "poll",
  "map",
  "iframe",
  "html",
  "script",
  "kpi",
  "chart",
  "metric",
  "gauge",
  "progress",
  "table",
  "spreadsheet",
  "kanban",
  "gantt",
  "timeline",
  "tasks",
  "issues",
  "approvals",
  "workflow_status",
  "feedback",
  "comments",
  "tags",
  "navigation",
  "breadcrumb",
  "table_of_contents",
  "footer",
  "social_share",
  "follow_button",
  "translate_button",
  "ai_summary",
  "ai_chat",
  "custom",
]);

export const webParts = pgTable(
  "web_parts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),

    type: webPartTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }),

    // Per-type configuration
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),

    // Common appearance
    appearance: jsonb("appearance")
      .$type<{
        backgroundColor?: string;
        backgroundImage?: string;
        textColor?: string;
        accentColor?: string;
        padding?: number;
        margin?: number;
        borderRadius?: number;
        borderColor?: string;
        borderWidth?: number;
        boxShadow?: string;
        textAlign?: "left" | "center" | "right" | "justify";
        animation?: string;
        animationDelay?: number;
        customCss?: string;
      }>()
      .default({}),

    // Connections (web parts that pass data to this one)
    connections: jsonb("connections")
      .$type<
        Array<{
          fromWebPartId: string;
          fromOutput: string;
          toInput: string;
          transform?: string;
        }>
      >()
      .default([]),

    // Audience targeting
    audienceGroupIds: jsonb("audience_group_ids").$type<string[]>().default([]),

    // Visibility
    isHidden: boolean("is_hidden").notNull().default(false),
    visibilityRule: jsonb("visibility_rule").$type<Record<string, unknown>>(),

    sortOrder: integer("sort_order").notNull().default(0),
    columnId: varchar("column_id", { length: 60 }),
    sectionId: varchar("section_id", { length: 60 }),

    createdBy: uuid("created_by").references(() => users.id),
    modifiedBy: uuid("modified_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("web_parts_page_idx").on(table.pageId),
    index("web_parts_site_idx").on(table.siteId),
  ],
);

export type WebPart = typeof webParts.$inferSelect;

// ─────────────────────────────────────────────
// PAGE TEMPLATES — pre-built pages
// ─────────────────────────────────────────────

export const pageTemplates = pgTable(
  "page_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 80 }),
    layout: pageLayoutEnum("layout").notNull().default("article"),

    preview: text("preview"),
    thumbnails: jsonb("thumbnails").$type<string[]>().default([]),

    canvas: jsonb("canvas").$type<unknown>().notNull(),
    webPartsBlueprint: jsonb("web_parts_blueprint")
      .$type<Array<{ type: string; config: Record<string, unknown>; appearance?: Record<string, unknown> }>>()
      .default([]),

    isOfficial: boolean("is_official").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(false),
    installCount: integer("install_count").notNull().default(0),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("page_templates_tenant_idx").on(table.tenantId),
    index("page_templates_site_idx").on(table.siteId),
  ],
);

export type PageTemplate = typeof pageTemplates.$inferSelect;

// ─────────────────────────────────────────────
// PAGE TRANSLATIONS — multi-language linking
// ─────────────────────────────────────────────

export const pageTranslations = pgTable(
  "page_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    translatedPageId: uuid("translated_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    language: varchar("language", { length: 10 }).notNull(),
    translatedBy: uuid("translated_by").references(() => users.id),
    machineTranslated: boolean("machine_translated").notNull().default(false),
    translationProvider: varchar("translation_provider", { length: 50 }),
    qualityScore: integer("quality_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("page_trans_unique_idx").on(table.sourcePageId, table.language),
  ],
);

// ─────────────────────────────────────────────
// PAGE VIEWS — analytics
// ─────────────────────────────────────────────

export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: varchar("session_id", { length: 100 }),

    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    country: varchar("country", { length: 4 }),
    deviceType: varchar("device_type", { length: 20 }),

    durationSeconds: integer("duration_seconds"),
    scrollDepth: integer("scroll_depth"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("page_views_page_time_idx").on(table.pageId, table.createdAt),
    index("page_views_user_idx").on(table.userId),
  ],
);

// ─────────────────────────────────────────────
// NEWS DIGESTS — automatic & manual digests
// ─────────────────────────────────────────────

export const newsDigests = pgTable("news_digests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 300 }).notNull(),
  introHtml: text("intro_html"),
  pageIds: jsonb("page_ids").$type<string[]>().notNull(),

  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),

  recipientGroupIds: jsonb("recipient_group_ids").$type<string[]>().default([]),
  recipientCount: integer("recipient_count").default(0),
  openRate: integer("open_rate").default(0),
  clickRate: integer("click_rate").default(0),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
