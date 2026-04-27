import { Hono } from "hono";
import { db, tickets, ticketReplies, kbArticles, users } from "@openportal/db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const supportRoutes = new Hono();
supportRoutes.use("*", requireAuth);

supportRoutes.get("/tickets", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const conditions: any[] = [eq(tickets.tenantId, tenantId)];
  if (status) conditions.push(eq(tickets.status, status as any));
  const results = await db.select().from(tickets).where(and(...conditions)).orderBy(desc(tickets.createdAt));
  return c.json({ success: true, data: results });
});

supportRoutes.post("/tickets", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = await c.req.json();
  // Auto-increment ticket number
  const [last] = await db.select({ maxNum: sql<number>`COALESCE(MAX(${tickets.number}), 0)` }).from(tickets).where(eq(tickets.tenantId, tenantId));
  const nextNum = (last?.maxNum || 0) + 1;
  const [ticket] = await db.insert(tickets).values({
    tenantId, number: nextNum, subject: body.subject, description: body.description || null,
    priority: body.priority || "medium", category: body.category || "general", createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: ticket }, 201);
});

supportRoutes.get("/tickets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [ticket] = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))).limit(1);
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Ticket not found");
  const replies = await db.select({
    id: ticketReplies.id, body: ticketReplies.body, isInternal: ticketReplies.isInternal,
    createdAt: ticketReplies.createdAt, createdBy: ticketReplies.createdBy,
    authorFirstName: users.firstName, authorLastName: users.lastName,
  }).from(ticketReplies).innerJoin(users, eq(ticketReplies.createdBy, users.id))
    .where(eq(ticketReplies.ticketId, id)).orderBy(asc(ticketReplies.createdAt));
  return c.json({ success: true, data: { ...ticket, replies } });
});

supportRoutes.patch("/tickets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.status) { update.status = body.status; if (body.status === "resolved") update.resolvedAt = new Date(); }
  if (body.priority) update.priority = body.priority;
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
  await db.update(tickets).set(update).where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)));
  return c.json({ success: true });
});

supportRoutes.post("/tickets/:id/replies", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const [reply] = await db.insert(ticketReplies).values({
    ticketId: id, body: body.body, isInternal: body.isInternal || false, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: reply }, 201);
});

supportRoutes.delete("/tickets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(tickets).where(and(eq(tickets.id, c.req.param("id")), eq(tickets.tenantId, tenantId)));
  return c.json({ success: true });
});

// Knowledge Base
supportRoutes.get("/kb", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(kbArticles).where(eq(kbArticles.tenantId, tenantId)).orderBy(desc(kbArticles.updatedAt));
  return c.json({ success: true, data: results });
});

supportRoutes.post("/kb", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = await c.req.json();
  const [article] = await db.insert(kbArticles).values({
    tenantId, title: body.title, slug: body.slug, content: body.content || null,
    category: body.category || null, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: article }, 201);
});
