import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db, pages, pageVersions, pageTemplates, pageTranslations, pageViews,
  webParts, sites, newsDigests, auditLog,
} from "@openportal/db";
import { eq, and, or, desc, sql, inArray, isNull } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const pageRoutes = new Hono();
pageRoutes.use("*", requireAuth);

async function audit(tenantId: string, userId: string, eventType: any, action: string, targetId: string, label?: string, details?: any) {
  try {
    await db.insert(auditLog).values({
      tenantId, eventType, severity: "info", actorType: "user", actorId: userId,
      targetType: "page", targetId, targetLabel: label, action, details: details || {},
    });
  } catch {}
}

// ══════════════════════════════════════════════════════════
// PAGES — CRUD with versions, web parts, publishing
// ══════════════════════════════════════════════════════════

pageRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const status = c.req.query("status");
  const news = c.req.query("news") === "true";
  const search = c.req.query("q");
  const limit = parseInt(c.req.query("limit") || "50");

  const conds: any[] = [eq(pages.tenantId, tenantId)];
  if (siteId) conds.push(eq(pages.siteId, siteId));
  if (status) conds.push(eq(pages.status, status as any));
  if (news) conds.push(eq(pages.promotedAsNews, true));
  if (search) conds.push(sql`(${pages.title} ILIKE ${"%" + search + "%"} OR ${pages.excerpt} ILIKE ${"%" + search + "%"})`);

  const list = await db.select({
    id: pages.id, title: pages.title, slug: pages.slug, excerpt: pages.excerpt,
    coverImage: pages.coverImage, layout: pages.layout, status: pages.status,
    publishedAt: pages.publishedAt, viewCount: pages.viewCount, likeCount: pages.likeCount,
    commentCount: pages.commentCount, promotedAsNews: pages.promotedAsNews,
    newsCategory: pages.newsCategory, language: pages.language, siteId: pages.siteId,
    createdBy: pages.createdBy, modifiedBy: pages.modifiedBy,
    createdAt: pages.createdAt, updatedAt: pages.updatedAt,
  }).from(pages).where(and(...conds))
    .orderBy(desc(pages.updatedAt)).limit(limit);

  return c.json({ success: true, data: list });
});

const createPageSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  layout: z.enum([
    "article", "home", "topic", "single_part", "blank", "wiki",
    "newsletter", "spaces", "landing", "campaign", "announcement",
    "event", "team_dashboard", "knowledge_base", "press_release",
  ]).default("article"),
  language: z.string().default("ro"),
  templateId: z.string().uuid().optional(),
});

pageRoutes.post("/", zValidator("json", createPageSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [existing] = await db.select({ id: pages.id }).from(pages)
    .where(and(eq(pages.siteId, body.siteId), eq(pages.slug, body.slug))).limit(1);
  if (existing) throw new AppError(409, "SLUG_TAKEN", "Există deja o pagină cu acest URL");

  let canvas: any = { sections: [{
    id: "section-1", layout: "one_column", spacing: "normal",
    columns: [{ id: "col-1", width: 12, webParts: [] }],
  }]};

  if (body.templateId) {
    const [tpl] = await db.select().from(pageTemplates).where(eq(pageTemplates.id, body.templateId)).limit(1);
    if (tpl) canvas = tpl.canvas;
  }

  const [page] = await db.insert(pages).values({
    tenantId, siteId: body.siteId, title: body.title, slug: body.slug,
    excerpt: body.excerpt, coverImage: body.coverImage, layout: body.layout,
    language: body.language, canvas, status: "draft", createdBy: user.id,
  }).returning();

  await audit(tenantId, user.id, "item_created", "create", page!.id, page!.title);
  return c.json({ success: true, data: page }, 201);
});

pageRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [page] = await db.select().from(pages).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  const parts = await db.select().from(webParts).where(eq(webParts.pageId, id)).orderBy(webParts.sortOrder);
  return c.json({ success: true, data: { ...page, webParts: parts } });
});

pageRoutes.get("/by-slug/:siteId/:slug", async (c) => {
  const tenantId = c.get("tenantId");
  const { siteId, slug } = c.req.param();
  const [page] = await db.select().from(pages).where(and(
    eq(pages.tenantId, tenantId), eq(pages.siteId, siteId), eq(pages.slug, slug),
  )).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  const parts = await db.select().from(webParts).where(eq(webParts.pageId, page.id)).orderBy(webParts.sortOrder);
  return c.json({ success: true, data: { ...page, webParts: parts } });
});

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  coverImageAlt: z.string().nullable().optional(),
  coverImageFocalPoint: z.object({ x: z.number(), y: z.number() }).nullable().optional(),
  layout: z.string().optional(),
  headerLayout: z.string().optional(),
  headerTextAlignment: z.string().optional(),
  showAuthor: z.boolean().optional(),
  showPublishedDate: z.boolean().optional(),
  showTopicHeader: z.boolean().optional(),
  topicHeaderLabel: z.string().nullable().optional(),
  canvas: z.object({ sections: z.array(z.any()) }).optional(),
  promotedAsNews: z.boolean().optional(),
  newsCategory: z.string().nullable().optional(),
  commentsEnabled: z.boolean().optional(),
  likesEnabled: z.boolean().optional(),
  language: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  audienceGroupIds: z.array(z.string()).optional(),
  scheduledPublishAt: z.string().datetime().nullable().optional(),
  scheduledExpireAt: z.string().datetime().nullable().optional(),
});

pageRoutes.patch("/:id", zValidator("json", updatePageSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const data: any = { ...body, modifiedBy: user.id, updatedAt: new Date() };
  if (body.scheduledPublishAt) data.scheduledPublishAt = new Date(body.scheduledPublishAt);
  if (body.scheduledExpireAt) data.scheduledExpireAt = new Date(body.scheduledExpireAt);
  const [updated] = await db.update(pages).set(data)
    .where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  await audit(tenantId, user.id, "item_modified", "update", updated.id, updated.title);
  return c.json({ success: true, data: updated });
});

pageRoutes.post("/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const [page] = await db.select().from(pages).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");

  const newMajor = (await db.select({ max: sql<number>`COALESCE(MAX(${pageVersions.versionMajor}), 0)` })
    .from(pageVersions).where(eq(pageVersions.pageId, id)))[0]?.max || 0;

  await db.update(pageVersions).set({ isCurrent: false }).where(eq(pageVersions.pageId, id));
  await db.insert(pageVersions).values({
    pageId: id, versionLabel: `${newMajor + 1}.0`,
    versionMajor: newMajor + 1, versionMinor: 0, isCurrent: true, isPublished: true,
    title: page.title, excerpt: page.excerpt, canvas: page.canvas, createdBy: user.id,
  });

  const [updated] = await db.update(pages).set({
    status: "published", publishedAt: new Date(), publishedBy: user.id, modifiedBy: user.id,
  }).where(eq(pages.id, id)).returning();

  await audit(tenantId, user.id, "item_published", "publish", id, updated!.title);
  return c.json({ success: true, data: updated });
});

pageRoutes.post("/:id/unpublish", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const [updated] = await db.update(pages).set({ status: "draft", modifiedBy: user.id })
    .where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  await audit(tenantId, user.id, "item_unpublished", "unpublish", id, updated.title);
  return c.json({ success: true, data: updated });
});

pageRoutes.post("/:id/promote-as-news", zValidator("json", z.object({
  newsCategory: z.string().optional(),
  boostedUntil: z.string().datetime().optional(),
  boostScore: z.number().int().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [updated] = await db.update(pages).set({
    promotedAsNews: true, newsCategory: body.newsCategory,
    boostedUntil: body.boostedUntil ? new Date(body.boostedUntil) : null,
    boostScore: body.boostScore || 0, modifiedBy: user.id,
  }).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  return c.json({ success: true, data: updated });
});

pageRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  await db.delete(pages).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId)));
  await audit(tenantId, user.id, "item_deleted", "delete", id);
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// VERSIONS
// ══════════════════════════════════════════════════════════

pageRoutes.get("/:id/versions", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [page] = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId))).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  const versions = await db.select().from(pageVersions).where(eq(pageVersions.pageId, id))
    .orderBy(desc(pageVersions.versionMajor), desc(pageVersions.versionMinor));
  return c.json({ success: true, data: versions });
});

pageRoutes.post("/:id/versions/:versionId/restore", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const { id, versionId } = c.req.param();
  const [version] = await db.select().from(pageVersions).where(eq(pageVersions.id, versionId)).limit(1);
  if (!version) throw new AppError(404, "NOT_FOUND", "Versiune negăsită");
  await db.update(pages).set({
    title: version.title, excerpt: version.excerpt, canvas: version.canvas as any,
    modifiedBy: user.id, updatedAt: new Date(),
  }).where(and(eq(pages.id, id), eq(pages.tenantId, tenantId)));
  await audit(tenantId, user.id, "item_restored", "restore_version", id);
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// WEB PARTS — full CRUD per page
// ══════════════════════════════════════════════════════════

pageRoutes.get("/:id/web-parts", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(webParts).where(eq(webParts.pageId, id)).orderBy(webParts.sortOrder);
  return c.json({ success: true, data: list });
});

const webPartSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  config: z.record(z.unknown()).default({}),
  appearance: z.record(z.unknown()).default({}),
  connections: z.array(z.any()).optional(),
  audienceGroupIds: z.array(z.string()).optional(),
  isHidden: z.boolean().default(false),
  visibilityRule: z.record(z.unknown()).optional(),
  sectionId: z.string().optional(),
  columnId: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

pageRoutes.post("/:id/web-parts", zValidator("json", webPartSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [page] = await db.select({ siteId: pages.siteId }).from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Pagină negăsită");
  const [wp] = await db.insert(webParts).values({
    tenantId, pageId: id, siteId: page.siteId, type: body.type as any,
    title: body.title, config: body.config, appearance: body.appearance,
    connections: body.connections || [], audienceGroupIds: body.audienceGroupIds || [],
    isHidden: body.isHidden, visibilityRule: body.visibilityRule,
    sectionId: body.sectionId, columnId: body.columnId,
    sortOrder: body.sortOrder, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: wp }, 201);
});

pageRoutes.patch("/web-parts/:wpId", zValidator("json", z.object({
  title: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  appearance: z.record(z.unknown()).optional(),
  connections: z.array(z.any()).optional(),
  audienceGroupIds: z.array(z.string()).optional(),
  isHidden: z.boolean().optional(),
  visibilityRule: z.record(z.unknown()).nullable().optional(),
  sectionId: z.string().optional(),
  columnId: z.string().optional(),
  sortOrder: z.number().int().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const wpId = c.req.param("wpId");
  const body = c.req.valid("json");
  const [updated] = await db.update(webParts).set({ ...body, modifiedBy: user.id, updatedAt: new Date() } as any)
    .where(and(eq(webParts.id, wpId), eq(webParts.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Web Part negăsit");
  return c.json({ success: true, data: updated });
});

pageRoutes.delete("/web-parts/:wpId", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(webParts).where(and(eq(webParts.id, c.req.param("wpId")), eq(webParts.tenantId, tenantId)));
  return c.json({ success: true });
});

pageRoutes.post("/:id/web-parts/reorder", zValidator("json", z.object({
  order: z.array(z.object({ id: z.string(), sortOrder: z.number(), sectionId: z.string().optional(), columnId: z.string().optional() })),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  await db.transaction(async (tx) => {
    for (const item of body.order) {
      await tx.update(webParts).set({
        sortOrder: item.sortOrder, sectionId: item.sectionId, columnId: item.columnId,
      }).where(and(eq(webParts.id, item.id), eq(webParts.pageId, id)));
    }
  });
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// TEMPLATES
// ══════════════════════════════════════════════════════════

pageRoutes.get("/templates/all", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(pageTemplates)
    .where(or(eq(pageTemplates.tenantId, tenantId), isNull(pageTemplates.tenantId))!)
    .orderBy(desc(pageTemplates.installCount));
  return c.json({ success: true, data: list });
});

pageRoutes.post("/templates", zValidator("json", z.object({
  name: z.string(), description: z.string().optional(), category: z.string().optional(),
  layout: z.string().default("article"), preview: z.string().optional(),
  canvas: z.record(z.unknown()), webPartsBlueprint: z.array(z.any()).optional(),
  isPublic: z.boolean().default(false),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [tpl] = await db.insert(pageTemplates).values({
    tenantId, name: body.name, description: body.description,
    category: body.category, layout: body.layout as any, preview: body.preview,
    canvas: body.canvas, webPartsBlueprint: body.webPartsBlueprint || [],
    isPublic: body.isPublic, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: tpl }, 201);
});

// ══════════════════════════════════════════════════════════
// VIEWS / ANALYTICS / NEWS DIGESTS
// ══════════════════════════════════════════════════════════

pageRoutes.post("/:id/track-view", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  await db.insert(pageViews).values({
    pageId: id, userId: user?.id || null,
    sessionId: body.sessionId, durationSeconds: body.duration, scrollDepth: body.scrollDepth,
    referrer: body.referrer, userAgent: c.req.header("user-agent") || null,
    deviceType: body.deviceType,
  });
  await db.update(pages).set({ viewCount: sql`${pages.viewCount} + 1` }).where(eq(pages.id, id));
  return c.json({ success: true });
});

pageRoutes.post("/news-digests", zValidator("json", z.object({
  title: z.string(), introHtml: z.string().optional(),
  pageIds: z.array(z.string().uuid()), siteId: z.string().uuid().optional(),
  scheduledFor: z.string().datetime().optional(),
  recipientGroupIds: z.array(z.string()).optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [d] = await db.insert(newsDigests).values({
    tenantId, siteId: body.siteId, title: body.title, introHtml: body.introHtml,
    pageIds: body.pageIds, scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
    recipientGroupIds: body.recipientGroupIds || [], createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: d }, 201);
});
