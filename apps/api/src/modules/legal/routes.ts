import { Hono } from "hono";
import { db, legalCases, courtDeadlines, legalContracts, timeEntries } from "@openportal/db";
import { eq, and, desc, asc, count, sum } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const legalRoutes = new Hono();
legalRoutes.use("*", requireAuth);

// Cases
legalRoutes.get("/cases", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(legalCases).where(eq(legalCases.tenantId, tenantId)).orderBy(desc(legalCases.createdAt));
  const withStats = await Promise.all(results.map(async (cs) => {
    const [dc] = await db.select({ count: count() }).from(courtDeadlines).where(eq(courtDeadlines.caseId, cs.id));
    const [te] = await db.select({ total: sum(timeEntries.minutes) }).from(timeEntries).where(eq(timeEntries.caseId, cs.id));
    return { ...cs, deadlineCount: dc?.count || 0, totalMinutes: Number(te?.total || 0) };
  }));
  return c.json({ success: true, data: withStats });
});

legalRoutes.post("/cases", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [cs] = await db.insert(legalCases).values({
    tenantId, caseNumber: body.caseNumber || `CASE-${Date.now()}`, title: body.title,
    clientName: body.clientName, clientEmail: body.clientEmail || null,
    opposingParty: body.opposingParty || null, court: body.court || null,
    caseType: body.caseType || null, description: body.description || null,
    value: body.value || 0, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: cs }, 201);
});

legalRoutes.patch("/cases/:id", async (c) => {
  const id = c.req.param("id"); const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.status) { update.status = body.status; if (["won", "lost", "settled", "closed"].includes(body.status)) update.closedAt = new Date(); }
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
  await db.update(legalCases).set(update).where(eq(legalCases.id, id));
  return c.json({ success: true });
});

legalRoutes.delete("/cases/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(legalCases).where(and(eq(legalCases.id, c.req.param("id")), eq(legalCases.tenantId, tenantId)));
  return c.json({ success: true });
});

// Deadlines
legalRoutes.get("/cases/:caseId/deadlines", async (c) => {
  const results = await db.select().from(courtDeadlines).where(eq(courtDeadlines.caseId, c.req.param("caseId"))).orderBy(asc(courtDeadlines.date));
  return c.json({ success: true, data: results });
});

legalRoutes.post("/cases/:caseId/deadlines", async (c) => {
  const body = await c.req.json();
  const [dl] = await db.insert(courtDeadlines).values({
    caseId: c.req.param("caseId"), title: body.title, type: body.type || null,
    date: new Date(body.date), location: body.location || null, notes: body.notes || null,
  }).returning();
  return c.json({ success: true, data: dl }, 201);
});

legalRoutes.post("/deadlines/:id/complete", async (c) => {
  await db.update(courtDeadlines).set({ completed: true }).where(eq(courtDeadlines.id, c.req.param("id")));
  return c.json({ success: true });
});

// Contracts
legalRoutes.get("/contracts", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(legalContracts).where(eq(legalContracts.tenantId, tenantId)).orderBy(desc(legalContracts.createdAt));
  return c.json({ success: true, data: results });
});

legalRoutes.post("/contracts", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [ct] = await db.insert(legalContracts).values({
    tenantId, title: body.title, clientName: body.clientName, contractType: body.contractType || null,
    value: body.value || 0, currency: body.currency || "RON",
    startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null,
    caseId: body.caseId || null, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: ct }, 201);
});

// Time Entries
legalRoutes.get("/time-entries", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(timeEntries).where(eq(timeEntries.tenantId, tenantId)).orderBy(desc(timeEntries.date));
  return c.json({ success: true, data: results });
});

legalRoutes.post("/time-entries", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [te] = await db.insert(timeEntries).values({
    tenantId, caseId: body.caseId || null, userId: user.id, description: body.description,
    minutes: body.minutes, hourlyRate: body.hourlyRate || 0, billable: body.billable !== false,
    date: body.date ? new Date(body.date) : new Date(),
  }).returning();
  return c.json({ success: true, data: te }, 201);
});
