import { Hono } from "hono";
import { db, incidents, changeRequests, itAssets, statusServices } from "@openportal/db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const itopsRoutes = new Hono();
itopsRoutes.use("*", requireAuth);

// Incidents
itopsRoutes.get("/incidents", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).orderBy(desc(incidents.createdAt));
  return c.json({ success: true, data: results });
});

itopsRoutes.post("/incidents", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [last] = await db.select({ maxNum: sql<number>`COALESCE(MAX(${incidents.number}), 0)` }).from(incidents).where(eq(incidents.tenantId, tenantId));
  const [inc] = await db.insert(incidents).values({
    tenantId, number: (last?.maxNum || 0) + 1, title: body.title,
    description: body.description || null, severity: body.severity || "minor",
    service: body.service || null, impact: body.impact || null,
    timeline: [{ timestamp: new Date().toISOString(), status: "open", message: "Incident creat" }],
    createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: inc }, 201);
});

itopsRoutes.patch("/incidents/:id", async (c) => {
  const user = c.get("user"); const id = c.req.param("id"); const body = await c.req.json();
  const [existing] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  if (!existing) return c.json({ success: false }, 404);
  const update: any = { updatedAt: new Date() };
  if (body.status) {
    update.status = body.status;
    if (body.status === "resolved") update.resolvedAt = new Date();
    const timeline = [...(existing.timeline as any[] || []), { timestamp: new Date().toISOString(), status: body.status, message: body.message || `Status: ${body.status}`, userId: user.id }];
    update.timeline = timeline;
  }
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
  if (body.rootCause) update.rootCause = body.rootCause;
  if (body.resolution) update.resolution = body.resolution;
  await db.update(incidents).set(update).where(eq(incidents.id, id));
  return c.json({ success: true });
});

itopsRoutes.delete("/incidents/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(incidents).where(and(eq(incidents.id, c.req.param("id")), eq(incidents.tenantId, tenantId)));
  return c.json({ success: true });
});

// Change Requests
itopsRoutes.get("/changes", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(changeRequests).where(eq(changeRequests.tenantId, tenantId)).orderBy(desc(changeRequests.createdAt));
  return c.json({ success: true, data: results });
});

itopsRoutes.post("/changes", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [cr] = await db.insert(changeRequests).values({
    tenantId, title: body.title, description: body.description || null,
    type: body.type || "normal", risk: body.risk || "medium",
    impact: body.impact || null, rollbackPlan: body.rollbackPlan || null,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null, requestedBy: user.id,
  }).returning();
  return c.json({ success: true, data: cr }, 201);
});

itopsRoutes.patch("/changes/:id", async (c) => {
  const user = c.get("user"); const id = c.req.param("id"); const body = await c.req.json();
  const update: any = {};
  if (body.status) { update.status = body.status; if (body.status === "approved") update.approvedBy = user.id; if (body.status === "completed") update.completedAt = new Date(); }
  await db.update(changeRequests).set(update).where(eq(changeRequests.id, id));
  return c.json({ success: true });
});

// Assets
itopsRoutes.get("/assets", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(itAssets).where(eq(itAssets.tenantId, tenantId)).orderBy(itAssets.name);
  return c.json({ success: true, data: results });
});

itopsRoutes.post("/assets", async (c) => {
  const tenantId = c.get("tenantId"); const body = await c.req.json();
  const [asset] = await db.insert(itAssets).values({
    tenantId, name: body.name, type: body.type, serialNumber: body.serialNumber || null,
    manufacturer: body.manufacturer || null, model: body.model || null,
    assignedTo: body.assignedTo || null, location: body.location || null,
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
    purchaseCost: body.purchaseCost || 0,
    warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
  }).returning();
  return c.json({ success: true, data: asset }, 201);
});

itopsRoutes.delete("/assets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(itAssets).where(and(eq(itAssets.id, c.req.param("id")), eq(itAssets.tenantId, tenantId)));
  return c.json({ success: true });
});

// Status Page
itopsRoutes.get("/status", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(statusServices).where(eq(statusServices.tenantId, tenantId)).orderBy(asc(statusServices.order));
  return c.json({ success: true, data: results });
});

itopsRoutes.post("/status", async (c) => {
  const tenantId = c.get("tenantId"); const body = await c.req.json();
  const [svc] = await db.insert(statusServices).values({ tenantId, name: body.name, description: body.description || null }).returning();
  return c.json({ success: true, data: svc }, 201);
});

itopsRoutes.patch("/status/:id", async (c) => {
  const body = await c.req.json();
  await db.update(statusServices).set({ status: body.status, updatedAt: new Date() }).where(eq(statusServices.id, c.req.param("id")));
  return c.json({ success: true });
});
