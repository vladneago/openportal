import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, pages } from "@openportal/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const pageRoutes = new Hono();
pageRoutes.use("*", requireAuth);

// GET /pages — List pages
pageRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const status = c.req.query("status");
  const conditions: any[] = [eq(pages.tenantId, tenantId)];
  if (siteId) conditions.push(eq(pages.siteId, siteId));
  if (status) conditions.push(eq(pages.status, status as any));
  const results = await db.select().from(pages).where(and(...conditions)).orderBy(desc(pages.updatedAt));
  return c.json({ success: true, data: results });
});

// POST /pages — Create page
const createPageSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(500),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional(),
  layout: z.enum(["default", "full-width", "sidebar"]).optional(),
});

pageRoutes.post("/", zValidator("json", createPageSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const defaultContent = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: body.title }] },
      { type: "paragraph", content: [{ type: "text", text: "Începe să scrii aici..." }] },
    ],
  };

  const [page] = await db.insert(pages).values({
    tenantId, siteId: body.siteId, title: body.title, slug: body.slug,
    excerpt: body.excerpt || null, layout: body.layout || "default",
    content: defaultContent, createdBy: user.id, modifiedBy: user.id,
  }).returning();

  return c.json({ success: true, data: page }, 201);
});

// GET /pages/:id — Get page
pageRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const pageId = c.req.param("id");
  const [page] = await db.select().from(pages).where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId))).limit(1);
  if (!page) throw new AppError(404, "NOT_FOUND", "Page not found");

  // Increment view count
  await db.update(pages).set({ viewCount: sql`${pages.viewCount} + 1` }).where(eq(pages.id, pageId));

  return c.json({ success: true, data: page });
});

// PATCH /pages/:id — Update page content
const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  content: z.any().optional(),
  layout: z.enum(["default", "full-width", "sidebar"]).optional(),
});

pageRoutes.patch("/:id", zValidator("json", updatePageSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const pageId = c.req.param("id");
  const body = c.req.valid("json");

  const [updated] = await db.update(pages)
    .set({ ...body, modifiedBy: user.id, updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();

  if (!updated) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: updated });
});

// POST /pages/:id/publish — Publish page
pageRoutes.post("/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const pageId = c.req.param("id");
  const [updated] = await db.update(pages)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: updated });
});

// POST /pages/:id/unpublish — Unpublish page
pageRoutes.post("/:id/unpublish", async (c) => {
  const tenantId = c.get("tenantId");
  const pageId = c.req.param("id");
  const [updated] = await db.update(pages)
    .set({ status: "draft", updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: updated });
});

// DELETE /pages/:id
pageRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const pageId = c.req.param("id");
  const [updated] = await db.update(pages)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Page not found");
  return c.json({ success: true, data: { message: "Page archived" } });
});
