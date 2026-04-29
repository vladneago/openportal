import { Hono } from "hono";
import { db, citizenRequests, publicDecisions, publicServices } from "@openportal/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const governmentRoutes = new Hono();
governmentRoutes.use("*", requireAuth);

// Citizen Requests
governmentRoutes.get("/requests", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const conditions: any[] = [eq(citizenRequests.tenantId, tenantId)];
  if (status) conditions.push(eq(citizenRequests.status, status as any));
  const results = await db.select().from(citizenRequests).where(and(...conditions)).orderBy(desc(citizenRequests.createdAt));
  return c.json({ success: true, data: results });
});

governmentRoutes.post("/requests", async (c) => {
  const tenantId = c.get("tenantId"); const body = await c.req.json();
  const [last] = await db.select({ maxNum: sql<string>`COALESCE(MAX(CAST(${citizenRequests.registrationNumber} AS INTEGER)), 0)` }).from(citizenRequests).where(eq(citizenRequests.tenantId, tenantId));
  const nextNum = String(parseInt(String(last?.maxNum || "0")) + 1).padStart(6, "0");
  const deadline = new Date(); deadline.setDate(deadline.getDate() + 30);
  const [req] = await db.insert(citizenRequests).values({
    tenantId, registrationNumber: nextNum, citizenName: body.citizenName, citizenEmail: body.citizenEmail || null,
    citizenPhone: body.citizenPhone || null, category: body.category || "general", subject: body.subject,
    description: body.description || null, department: body.department || null, legalDeadline: deadline,
  }).returning();
  return c.json({ success: true, data: req }, 201);
});

governmentRoutes.patch("/requests/:id", async (c) => {
  const id = c.req.param("id"); const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.status) { update.status = body.status; if (body.status === "completed") update.completedAt = new Date(); }
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
  if (body.resolution) update.resolution = body.resolution;
  if (body.department) update.department = body.department;
  await db.update(citizenRequests).set(update).where(eq(citizenRequests.id, id));
  return c.json({ success: true });
});

// Decisions
governmentRoutes.get("/decisions", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(publicDecisions).where(eq(publicDecisions.tenantId, tenantId)).orderBy(desc(publicDecisions.createdAt));
  return c.json({ success: true, data: results });
});

governmentRoutes.post("/decisions", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [dec] = await db.insert(publicDecisions).values({
    tenantId, number: body.number || `HCL-${Date.now()}`, title: body.title, body: body.body || null,
    category: body.category || null, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: dec }, 201);
});

governmentRoutes.post("/decisions/:id/publish", async (c) => {
  await db.update(publicDecisions).set({ status: "published", publishedAt: new Date() }).where(eq(publicDecisions.id, c.req.param("id")));
  return c.json({ success: true });
});

// Services
governmentRoutes.get("/services", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(publicServices).where(eq(publicServices.tenantId, tenantId));
  return c.json({ success: true, data: results });
});

governmentRoutes.post("/services", async (c) => {
  const tenantId = c.get("tenantId"); const body = await c.req.json();
  const [svc] = await db.insert(publicServices).values({
    tenantId, title: body.title, description: body.description || null, category: body.category || null,
    department: body.department || null, estimatedDays: body.estimatedDays || null,
    requiredDocuments: body.requiredDocuments || [], fee: body.fee || 0,
  }).returning();
  return c.json({ success: true, data: svc }, 201);
});
