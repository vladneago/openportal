import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, portals, portalPages } from "@openportal/db";
import { eq, and, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const portalRoutes = new Hono();
portalRoutes.use("*", requireAuth);

portalRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(portals).where(eq(portals.tenantId, tenantId)).orderBy(portals.title);
  const withPages = await Promise.all(results.map(async (p) => {
    const [pc] = await db.select({ count: count() }).from(portalPages).where(eq(portalPages.portalId, p.id));
    return { ...p, pageCount: pc?.count || 0 };
  }));
  return c.json({ success: true, data: withPages });
});

const createSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  template: z.enum(["default", "corporate", "minimal", "government"]).optional(),
});

portalRoutes.post("/", zValidator("json", createSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [portal] = await tx.insert(portals).values({
      tenantId, title: body.title, slug: body.slug,
      description: body.description || null, template: body.template || "default", createdBy: user.id,
    }).returning();

    // Create default home page
    await tx.insert(portalPages).values({
      portalId: portal!.id, title: "Acasă", slug: "home", isHomePage: true,
      content: { type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: `Bine ați venit la ${body.title}` }] },
        { type: "paragraph", content: [{ type: "text", text: "Aceasta este pagina principală a portalului." }] },
      ]},
    });
    return portal!;
  });

  return c.json({ success: true, data: result }, 201);
});

portalRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [portal] = await db.select().from(portals).where(and(eq(portals.id, id), eq(portals.tenantId, tenantId))).limit(1);
  if (!portal) throw new AppError(404, "NOT_FOUND", "Portal not found");
  const pages = await db.select().from(portalPages).where(eq(portalPages.portalId, id)).orderBy(asc(portalPages.order));
  return c.json({ success: true, data: { ...portal, pages } });
});

portalRoutes.post("/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.update(portals).set({ status: "published", updatedAt: new Date() }).where(and(eq(portals.id, id), eq(portals.tenantId, tenantId)));
  return c.json({ success: true });
});

portalRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.delete(portals).where(and(eq(portals.id, id), eq(portals.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Portal deleted" } });
});

// Portal pages
portalRoutes.post("/:id/pages", async (c) => {
  const portalId = c.req.param("id");
  const body = await c.req.json();
  const [page] = await db.insert(portalPages).values({
    portalId, title: body.title || "Pagină nouă", slug: body.slug || "page-" + Date.now(),
    content: body.content || null,
  }).returning();
  return c.json({ success: true, data: page }, 201);
});
