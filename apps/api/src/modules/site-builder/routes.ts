import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  webSites,
  webPages,
  webThemes,
  webTemplates,
  webAssets,
} from "@openportal/db";
import { and, eq, sql, desc, asc, count, or, isNull } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { assertFeature } from "../../lib/plan-limits";

export const siteBuilderRoutes = new Hono();
siteBuilderRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────

const colorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
  success: z.string(),
  warning: z.string(),
  error: z.string(),
});

const typographySchema = z.object({
  fontFamilyHeading: z.string(),
  fontFamilyBody: z.string(),
  baseFontSize: z.number(),
  headingScale: z.number(),
  lineHeight: z.number(),
});

const themeCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  previewImageUrl: z.string().url().optional(),
  colors: colorsSchema,
  typography: typographySchema,
  spacing: z
    .object({
      baseUnit: z.number(),
      scale: z.array(z.number()),
    })
    .optional(),
  borderRadius: z
    .object({
      none: z.number(),
      sm: z.number(),
      md: z.number(),
      lg: z.number(),
      full: z.number(),
    })
    .optional(),
  shadows: z.record(z.string(), z.string()).default({}),
  customCss: z.string().max(50000).optional(),
  isActive: z.boolean().default(true),
});

siteBuilderRoutes.get("/themes", async (c) => {
  const tenantId = c.get("tenantId");
  const includeSystem = c.req.query("includeSystem") !== "false";

  const conds = includeSystem
    ? [or(eq(webThemes.tenantId, tenantId), isNull(webThemes.tenantId))!]
    : [eq(webThemes.tenantId, tenantId)];

  const rows = await db
    .select()
    .from(webThemes)
    .where(and(...conds))
    .orderBy(desc(webThemes.isSystem), asc(webThemes.name));

  return c.json({ success: true, data: rows });
});

siteBuilderRoutes.get("/themes/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(webThemes)
    .where(and(eq(webThemes.id, id), or(eq(webThemes.tenantId, tenantId), isNull(webThemes.tenantId))!))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Theme not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/themes", zValidator("json", themeCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(webThemes)
    .values({
      tenantId,
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      previewImageUrl: body.previewImageUrl ?? null,
      colors: body.colors,
      typography: body.typography,
      spacing: body.spacing ?? undefined,
      borderRadius: body.borderRadius ?? undefined,
      shadows: body.shadows,
      customCss: body.customCss ?? null,
      isSystem: false,
      isPremium: false,
      isActive: body.isActive,
      createdBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

siteBuilderRoutes.patch("/themes/:id", zValidator("json", themeCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(webThemes)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(webThemes.tenantId, tenantId), eq(webThemes.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Theme not found (or system theme)");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.delete("/themes/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(webThemes)
    .where(and(eq(webThemes.tenantId, tenantId), eq(webThemes.id, id)))
    .returning({ id: webThemes.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Theme not found (or system theme)");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// TEMPLATES (read-only catalog — admin populates these)
// ─────────────────────────────────────────────

siteBuilderRoutes.get("/templates", async (c) => {
  const category = c.req.query("category");
  const featured = c.req.query("featured") === "true";

  const conds = [eq(webTemplates.isActive, true)];
  if (category) {
    conds.push(eq(webTemplates.category, category as "beauty" | "barbershop" | "spa_wellness" | "fitness" | "yoga_pilates" | "restaurant" | "cafe" | "bakery" | "florist" | "photographer" | "medical" | "dental" | "veterinary" | "legal" | "accounting" | "consulting" | "education" | "real_estate" | "automotive" | "hotel_bnb" | "events" | "tattoo_studio" | "fashion_retail" | "general_business" | "portfolio" | "landing_page"));
  }
  if (featured) conds.push(eq(webTemplates.isFeatured, true));

  const rows = await db
    .select()
    .from(webTemplates)
    .where(and(...conds))
    .orderBy(desc(webTemplates.isFeatured), asc(webTemplates.sortOrder), asc(webTemplates.name));

  return c.json({ success: true, data: rows });
});

siteBuilderRoutes.get("/templates/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [row] = await db
    .select()
    .from(webTemplates)
    .where(eq(webTemplates.slug, slug))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Template not found");
  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// SITES
// ─────────────────────────────────────────────

const siteCreateSchema = z.object({
  name: z.string().min(1).max(200),
  subdomain: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, hyphens"),
  customDomain: z.string().max(253).optional(),
  themeId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  themeOverrides: z.record(z.string(), z.unknown()).default({}),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  defaultTitle: z.string().max(200).optional(),
  defaultDescription: z.string().max(500).optional(),
  metaKeywords: z.array(z.string()).default([]),
  defaultLocale: z.string().max(8).default("ro"),
  availableLocales: z.array(z.string()).default(["ro"]),
  businessName: z.string().max(300).optional(),
  businessAddress: z.string().max(500).optional(),
  businessCity: z.string().max(120).optional(),
  businessPhone: z.string().max(32).optional(),
  businessEmail: z.string().email().optional(),
  businessHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      }),
    )
    .default([]),
  socialLinks: z.record(z.string(), z.string()).default({}),
  primaryNav: z.array(z.any()).default([]),
  footerNav: z.array(z.any()).default([]),
  modules: z
    .object({
      booking: z.boolean().optional(),
      pos: z.boolean().optional(),
      blog: z.boolean().optional(),
      chat: z.boolean().optional(),
      forms: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      members: z.boolean().optional(),
    })
    .default({ booking: true }),
});

siteBuilderRoutes.get("/sites", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");

  const conds = [eq(webSites.tenantId, tenantId)];
  if (status) {
    conds.push(eq(webSites.status, status as "draft" | "published" | "unpublished" | "suspended" | "archived"));
  }

  const rows = await db
    .select()
    .from(webSites)
    .where(and(...conds))
    .orderBy(desc(webSites.updatedAt));

  return c.json({ success: true, data: rows });
});

siteBuilderRoutes.get("/sites/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(webSites)
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Site not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/sites", zValidator("json", siteCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // Plan: custom domain requires Solo Pro
  if (body.customDomain) {
    await assertFeature(tenantId, "hasCustomDomain");
  }

  // Check subdomain uniqueness globally
  const [existing] = await db
    .select({ id: webSites.id })
    .from(webSites)
    .where(eq(webSites.subdomain, body.subdomain))
    .limit(1);

  if (existing) {
    throw new AppError(409, "SUBDOMAIN_TAKEN", "This subdomain is already taken");
  }

  const result = await db.transaction(async (tx) => {
    const [site] = await tx
      .insert(webSites)
      .values({
        tenantId,
        name: body.name,
        subdomain: body.subdomain,
        customDomain: body.customDomain ?? null,
        themeId: body.themeId ?? null,
        templateId: body.templateId ?? null,
        themeOverrides: body.themeOverrides,
        logoUrl: body.logoUrl ?? null,
        faviconUrl: body.faviconUrl ?? null,
        ogImageUrl: body.ogImageUrl ?? null,
        defaultTitle: body.defaultTitle ?? null,
        defaultDescription: body.defaultDescription ?? null,
        metaKeywords: body.metaKeywords,
        defaultLocale: body.defaultLocale,
        availableLocales: body.availableLocales,
        businessName: body.businessName ?? null,
        businessAddress: body.businessAddress ?? null,
        businessCity: body.businessCity ?? null,
        businessPhone: body.businessPhone ?? null,
        businessEmail: body.businessEmail ?? null,
        businessHours: body.businessHours,
        socialLinks: body.socialLinks,
        primaryNav: body.primaryNav,
        footerNav: body.footerNav,
        modules: body.modules,
        status: "draft",
        createdBy: user.id,
      })
      .returning();

    // If a template is selected, scaffold pages from template
    if (body.templateId) {
      const [template] = await tx
        .select()
        .from(webTemplates)
        .where(eq(webTemplates.id, body.templateId))
        .limit(1);

      if (template && template.pagesContent && template.pagesContent.length > 0) {
        const now = new Date();
        await tx.insert(webPages).values(
          template.pagesContent.map((page, idx) => ({
            tenantId,
            siteId: site!.id,
            slug: page.slug,
            title: page.title,
            locale: body.defaultLocale,
            blocks: page.blocks as Array<Record<string, unknown>>,
            status: "draft" as const,
            isHomePage: page.isHome,
            sortOrder: idx,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: now,
            updatedAt: now,
          })),
        );

        await tx
          .update(webTemplates)
          .set({ installCount: sql`${webTemplates.installCount} + 1` })
          .where(eq(webTemplates.id, body.templateId));
      }
    }

    return site;
  });

  return c.json({ success: true, data: result }, 201);
});

siteBuilderRoutes.patch("/sites/:id", zValidator("json", siteCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  // Plan: custom domain requires Solo Pro
  if (body.customDomain) {
    await assertFeature(tenantId, "hasCustomDomain");
  }

  if (body.subdomain) {
    const [existing] = await db
      .select({ id: webSites.id })
      .from(webSites)
      .where(eq(webSites.subdomain, body.subdomain))
      .limit(1);
    if (existing && existing.id !== id) {
      throw new AppError(409, "SUBDOMAIN_TAKEN", "This subdomain is already taken");
    }
  }

  const [row] = await db
    .update(webSites)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Site not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/sites/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .update(webSites)
    .set({
      status: "published",
      publishedAt: new Date(),
      lastBuildAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Site not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/sites/:id/unpublish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .update(webSites)
    .set({ status: "unpublished", updatedAt: new Date() })
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Site not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.delete("/sites/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(webSites)
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, id)))
    .returning({ id: webSites.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Site not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────

const pageCreateSchema = z.object({
  siteId: z.string().uuid(),
  slug: z.string().max(500),
  title: z.string().min(1).max(300),
  locale: z.string().max(8).default("ro"),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  ogImageUrl: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().default(false),
  schemaOrg: z.record(z.string(), z.unknown()).optional(),
  blocks: z.array(z.record(z.string(), z.unknown())).default([]),
  layoutType: z.string().max(32).default("default"),
  hideHeader: z.boolean().default(false),
  hideFooter: z.boolean().default(false),
  isHomePage: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  scheduledFor: z.string().optional(),
  translationGroupId: z.string().uuid().optional(),
});

siteBuilderRoutes.get("/pages", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const status = c.req.query("status");

  const conds = [eq(webPages.tenantId, tenantId)];
  if (siteId) conds.push(eq(webPages.siteId, siteId));
  if (status) {
    conds.push(eq(webPages.status, status as "draft" | "scheduled" | "published" | "unpublished"));
  }

  const rows = await db
    .select()
    .from(webPages)
    .where(and(...conds))
    .orderBy(desc(webPages.isHomePage), asc(webPages.sortOrder), asc(webPages.title));

  return c.json({ success: true, data: rows });
});

siteBuilderRoutes.get("/pages/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(webPages)
    .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/pages", zValidator("json", pageCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // Verify site belongs to tenant
  const [site] = await db
    .select({ id: webSites.id })
    .from(webSites)
    .where(and(eq(webSites.tenantId, tenantId), eq(webSites.id, body.siteId)))
    .limit(1);

  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "Site not found");

  // If new page is marked home, unset previous home
  if (body.isHomePage) {
    await db
      .update(webPages)
      .set({ isHomePage: false })
      .where(and(eq(webPages.siteId, body.siteId), eq(webPages.isHomePage, true)));
  }

  const [row] = await db
    .insert(webPages)
    .values({
      tenantId,
      siteId: body.siteId,
      slug: body.slug,
      title: body.title,
      locale: body.locale,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      ogImageUrl: body.ogImageUrl ?? null,
      canonicalUrl: body.canonicalUrl ?? null,
      noIndex: body.noIndex,
      schemaOrg: body.schemaOrg as Record<string, unknown> | undefined,
      blocks: body.blocks,
      layoutType: body.layoutType,
      hideHeader: body.hideHeader,
      hideFooter: body.hideFooter,
      isHomePage: body.isHomePage,
      sortOrder: body.sortOrder,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      translationGroupId: body.translationGroupId ?? null,
      status: "draft",
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

siteBuilderRoutes.patch("/pages/:id", zValidator("json", pageCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  // If switching to home page, unset other home in same site
  if (body.isHomePage) {
    const [current] = await db
      .select({ siteId: webPages.siteId })
      .from(webPages)
      .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
      .limit(1);
    if (current) {
      await db
        .update(webPages)
        .set({ isHomePage: false })
        .where(and(eq(webPages.siteId, current.siteId), eq(webPages.isHomePage, true)));
    }
  }

  const updates = {
    ...body,
    schemaOrg: body.schemaOrg as Record<string, unknown> | undefined,
    scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    updatedBy: user.id,
    updatedAt: new Date(),
  };

  const [row] = await db
    .update(webPages)
    .set(updates)
    .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: row });
});

siteBuilderRoutes.post("/pages/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [current] = await db
    .select()
    .from(webPages)
    .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
    .limit(1);

  if (!current) throw new AppError(404, "NOT_FOUND", "Page not found");

  const [row] = await db
    .update(webPages)
    .set({
      status: "published",
      publishedAt: new Date(),
      publishedBlocksSnapshot: current.blocks,
      publishedTitleSnapshot: current.title,
      updatedAt: new Date(),
    })
    .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
    .returning();

  return c.json({ success: true, data: row });
});

siteBuilderRoutes.delete("/pages/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(webPages)
    .where(and(eq(webPages.tenantId, tenantId), eq(webPages.id, id)))
    .returning({ id: webPages.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// ASSETS (media library)
// ─────────────────────────────────────────────

const assetCreateSchema = z.object({
  siteId: z.string().uuid().optional(),
  type: z.enum(["image", "video", "audio", "document", "font", "icon", "other"]).default("image"),
  filename: z.string().min(1).max(500),
  originalFilename: z.string().max(500).optional(),
  mimeType: z.string().min(1).max(100),
  storageProvider: z.string().max(32).default("s3"),
  storagePath: z.string().min(1),
  cdnUrl: z.string().url(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  blurhash: z.string().max(64).optional(),
  variants: z.record(z.string(), z.object({ url: z.string(), width: z.number(), height: z.number() })).default({}),
  fileSizeBytes: z.number().int().nonnegative().default(0),
  altText: z.string().max(500).optional(),
  caption: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  folder: z.string().max(200).optional(),
});

siteBuilderRoutes.get("/assets", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const type = c.req.query("type");
  const folder = c.req.query("folder");
  const limit = Math.min(parseInt(c.req.query("limit") || "100"), 500);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(webAssets.tenantId, tenantId)];
  if (siteId) conds.push(eq(webAssets.siteId, siteId));
  if (type) {
    conds.push(eq(webAssets.type, type as "image" | "video" | "audio" | "document" | "font" | "icon" | "other"));
  }
  if (folder) conds.push(eq(webAssets.folder, folder));

  const rows = await db
    .select()
    .from(webAssets)
    .where(and(...conds))
    .orderBy(desc(webAssets.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(webAssets).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

siteBuilderRoutes.post("/assets", zValidator("json", assetCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(webAssets)
    .values({
      tenantId,
      siteId: body.siteId ?? null,
      type: body.type,
      filename: body.filename,
      originalFilename: body.originalFilename ?? null,
      mimeType: body.mimeType,
      storageProvider: body.storageProvider,
      storagePath: body.storagePath,
      cdnUrl: body.cdnUrl,
      width: body.width ?? null,
      height: body.height ?? null,
      blurhash: body.blurhash ?? null,
      variants: body.variants,
      fileSizeBytes: body.fileSizeBytes,
      altText: body.altText ?? null,
      caption: body.caption ?? null,
      tags: body.tags,
      folder: body.folder ?? null,
      uploadedBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

siteBuilderRoutes.patch(
  "/assets/:id",
  zValidator(
    "json",
    z.object({
      altText: z.string().max(500).optional(),
      caption: z.string().max(2000).optional(),
      tags: z.array(z.string()).optional(),
      folder: z.string().max(200).optional(),
    }),
  ),
  async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [row] = await db
      .update(webAssets)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(webAssets.tenantId, tenantId), eq(webAssets.id, id)))
      .returning();

    if (!row) throw new AppError(404, "NOT_FOUND", "Asset not found");
    return c.json({ success: true, data: row });
  },
);

siteBuilderRoutes.delete("/assets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(webAssets)
    .where(and(eq(webAssets.tenantId, tenantId), eq(webAssets.id, id)))
    .returning({ id: webAssets.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Asset not found");
  return c.json({ success: true });
});
