import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const webSiteStatusEnum = pgEnum("web_site_status", [
  "draft",
  "published",
  "unpublished",
  "suspended",
  "archived",
]);

export const webPageStatusEnum = pgEnum("web_page_status", [
  "draft",
  "scheduled",
  "published",
  "unpublished",
]);

export const webDomainStatusEnum = pgEnum("web_domain_status", [
  "pending",
  "verifying",
  "verified",
  "provisioning_ssl",
  "active",
  "failed",
  "expired",
]);

export const webTemplateCategoryEnum = pgEnum("web_template_category", [
  "beauty",
  "barbershop",
  "spa_wellness",
  "fitness",
  "yoga_pilates",
  "restaurant",
  "cafe",
  "bakery",
  "florist",
  "photographer",
  "medical",
  "dental",
  "veterinary",
  "legal",
  "accounting",
  "consulting",
  "education",
  "real_estate",
  "automotive",
  "hotel_bnb",
  "events",
  "tattoo_studio",
  "fashion_retail",
  "general_business",
  "portfolio",
  "landing_page",
]);

export const webAssetTypeEnum = pgEnum("web_asset_type", [
  "image",
  "video",
  "audio",
  "document",
  "font",
  "icon",
  "other",
]);

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────

export const webThemes = pgTable("web_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  // tenantId null = system theme available to all
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  previewImageUrl: text("preview_image_url"),

  // Design tokens
  colors: jsonb("colors").$type<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
  }>().notNull(),

  typography: jsonb("typography").$type<{
    fontFamilyHeading: string;
    fontFamilyBody: string;
    baseFontSize: number;
    headingScale: number;
    lineHeight: number;
  }>().notNull(),

  spacing: jsonb("spacing").$type<{
    baseUnit: number;
    scale: number[];
  }>().default({ baseUnit: 4, scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] }),

  borderRadius: jsonb("border_radius").$type<{
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  }>().default({ none: 0, sm: 4, md: 8, lg: 16, full: 9999 }),

  shadows: jsonb("shadows").$type<Record<string, string>>().default({}),
  customCss: text("custom_css"),

  isSystem: boolean("is_system").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("web_themes_tenant_slug_idx").on(table.tenantId, table.slug),
  index("web_themes_system_idx").on(table.isSystem),
]);

export type WebTheme = typeof webThemes.$inferSelect;
export type NewWebTheme = typeof webThemes.$inferInsert;

// ─────────────────────────────────────────────
// TEMPLATES CATALOG (40 industry-specific starter sites)
// ─────────────────────────────────────────────

export const webTemplates = pgTable("web_templates", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),

  category: webTemplateCategoryEnum("category").notNull(),
  industryTags: jsonb("industry_tags").$type<string[]>().default([]),
  // ISO codes — templates targeted at specific markets
  marketTags: jsonb("market_tags").$type<string[]>().default(["RO"]),
  languages: jsonb("languages").$type<string[]>().default(["ro", "en"]),

  // Visual
  previewImageUrl: text("preview_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  demoUrl: text("demo_url"),

  // Bundled theme
  themeId: uuid("theme_id").references(() => webThemes.id),

  // Page set as JSON: [{ slug, title, blocks: [...] }, ...]
  pagesContent: jsonb("pages_content").$type<Array<{
    slug: string;
    title: string;
    isHome: boolean;
    blocks: Array<Record<string, unknown>>;
  }>>().notNull().default([]),

  // Default content snippets used by AI generator
  defaultCopy: jsonb("default_copy").$type<Record<string, string>>().default({}),

  // Required modules (booking, pos, etc.)
  requiredModules: jsonb("required_modules").$type<string[]>().default([]),

  isPremium: boolean("is_premium").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  installCount: integer("install_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("web_templates_slug_idx").on(table.slug),
  index("web_templates_category_idx").on(table.category),
  index("web_templates_featured_idx").on(table.isFeatured, table.sortOrder),
]);

export type WebTemplate = typeof webTemplates.$inferSelect;
export type NewWebTemplate = typeof webTemplates.$inferInsert;

// ─────────────────────────────────────────────
// PUBLISHED SITES (customer-facing websites)
// ─────────────────────────────────────────────

export const webSites = pgTable("web_sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),

  // Subdomain on our platform: "salon-luna" → salon-luna.openportal.app
  subdomain: varchar("subdomain", { length: 64 }).notNull(),
  // Optional custom domain bought by the customer
  customDomain: varchar("custom_domain", { length: 253 }),
  customDomainStatus: webDomainStatusEnum("custom_domain_status").default("pending"),
  customDomainVerifiedAt: timestamp("custom_domain_verified_at", { withTimezone: true }),
  customDomainSslExpiresAt: timestamp("custom_domain_ssl_expires_at", { withTimezone: true }),

  // Build configuration
  themeId: uuid("theme_id").references(() => webThemes.id),
  // Per-site overrides on top of the theme
  themeOverrides: jsonb("theme_overrides").$type<Record<string, unknown>>().default({}),
  templateId: uuid("template_id").references(() => webTemplates.id),

  // Branding
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  ogImageUrl: text("og_image_url"),

  // SEO defaults
  defaultTitle: varchar("default_title", { length: 200 }),
  defaultDescription: text("default_description"),
  metaKeywords: jsonb("meta_keywords").$type<string[]>().default([]),

  // Analytics & tracking
  plausibleEnabled: boolean("plausible_enabled").notNull().default(true),
  gaTrackingId: varchar("ga_tracking_id", { length: 64 }),
  fbPixelId: varchar("fb_pixel_id", { length: 64 }),
  customHeadScripts: text("custom_head_scripts"),

  // Locale
  defaultLocale: varchar("default_locale", { length: 8 }).default("ro"),
  availableLocales: jsonb("available_locales").$type<string[]>().default(["ro"]),

  // Business info displayed in footer / contact
  businessName: varchar("business_name", { length: 300 }),
  businessAddress: text("business_address"),
  businessCity: varchar("business_city", { length: 120 }),
  businessPhone: varchar("business_phone", { length: 32 }),
  businessEmail: varchar("business_email", { length: 320 }),
  businessHours: jsonb("business_hours").$type<Array<{
    dayOfWeek: number;
    open: string;
    close: string;
    closed: boolean;
  }>>().default([]),

  // Social links
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),

  // Navigation
  primaryNav: jsonb("primary_nav").$type<Array<{
    label: string;
    href: string;
    children?: Array<{ label: string; href: string }>;
  }>>().default([]),
  footerNav: jsonb("footer_nav").$type<Array<{
    title: string;
    items: Array<{ label: string; href: string }>;
  }>>().default([]),

  // Module activations on this site
  modules: jsonb("modules").$type<{
    booking?: boolean;
    pos?: boolean;
    blog?: boolean;
    chat?: boolean;
    forms?: boolean;
    newsletter?: boolean;
    members?: boolean;
  }>().default({ booking: true }),

  status: webSiteStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastBuildAt: timestamp("last_build_at", { withTimezone: true }),

  // Cookie banner / GDPR
  gdprBannerEnabled: boolean("gdpr_banner_enabled").notNull().default(true),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsOfServiceUrl: text("terms_of_service_url"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("web_sites_subdomain_idx").on(table.subdomain),
  uniqueIndex("web_sites_custom_domain_idx").on(table.customDomain),
  index("web_sites_tenant_idx").on(table.tenantId),
  index("web_sites_status_idx").on(table.tenantId, table.status),
]);

export type WebSite = typeof webSites.$inferSelect;
export type NewWebSite = typeof webSites.$inferInsert;

// ─────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────

export const webPages = pgTable("web_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => webSites.id, { onDelete: "cascade" }),

  // URL path: "" = homepage, "servicii", "contact", "blog/articol-1"
  slug: varchar("slug", { length: 500 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull().default("ro"),

  // SEO
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  ogImageUrl: text("og_image_url"),
  canonicalUrl: text("canonical_url"),
  noIndex: boolean("no_index").notNull().default(false),
  schemaOrg: jsonb("schema_org").$type<Record<string, unknown>>(),

  // Page content as block tree
  // Structure: [{ id, type: "section", columns: [{ width, blocks: [...] }] }, ...]
  blocks: jsonb("blocks").$type<Array<Record<string, unknown>>>().notNull().default([]),

  // Layout overrides
  layoutType: varchar("layout_type", { length: 32 }).default("default"),
  hideHeader: boolean("hide_header").notNull().default(false),
  hideFooter: boolean("hide_footer").notNull().default(false),

  // Status & publishing
  status: webPageStatusEnum("status").notNull().default("draft"),
  isHomePage: boolean("is_home_page").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),

  // Versioning — most recent published version stored as snapshot
  publishedBlocksSnapshot: jsonb("published_blocks_snapshot").$type<Array<Record<string, unknown>>>(),
  publishedTitleSnapshot: varchar("published_title_snapshot", { length: 300 }),

  // Stats
  viewCount: integer("view_count").notNull().default(0),

  // Localization grouping — pages that are translations of each other share groupId
  translationGroupId: uuid("translation_group_id"),

  sortOrder: integer("sort_order").notNull().default(0),

  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("web_pages_site_slug_locale_idx").on(table.siteId, table.slug, table.locale),
  index("web_pages_site_status_idx").on(table.siteId, table.status),
  index("web_pages_home_idx").on(table.siteId, table.isHomePage),
  index("web_pages_translation_group_idx").on(table.translationGroupId),
]);

export type WebPage = typeof webPages.$inferSelect;
export type NewWebPage = typeof webPages.$inferInsert;

// ─────────────────────────────────────────────
// ASSETS (media library per site/tenant)
// ─────────────────────────────────────────────

export const webAssets = pgTable("web_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => webSites.id, { onDelete: "set null" }),

  type: webAssetTypeEnum("type").notNull().default("image"),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalFilename: varchar("original_filename", { length: 500 }),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),

  storageProvider: varchar("storage_provider", { length: 32 }).default("s3"),
  storagePath: text("storage_path").notNull(),
  cdnUrl: text("cdn_url").notNull(),

  // Image-specific
  width: integer("width"),
  height: integer("height"),
  blurhash: varchar("blurhash", { length: 64 }),
  // Pre-computed variants (thumbnails, webp, avif)
  variants: jsonb("variants").$type<Record<string, { url: string; width: number; height: number }>>().default({}),

  fileSizeBytes: integer("file_size_bytes").notNull().default(0),

  // Metadata
  altText: varchar("alt_text", { length: 500 }),
  caption: text("caption"),
  tags: jsonb("tags").$type<string[]>().default([]),
  folder: varchar("folder", { length: 200 }),

  // Tracking
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("web_assets_tenant_type_idx").on(table.tenantId, table.type),
  index("web_assets_site_idx").on(table.siteId),
  index("web_assets_folder_idx").on(table.tenantId, table.folder),
]);

export type WebAsset = typeof webAssets.$inferSelect;
export type NewWebAsset = typeof webAssets.$inferInsert;
