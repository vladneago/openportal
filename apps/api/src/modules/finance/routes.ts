import { Hono } from "hono";
import { db, invoices, expenses } from "@openportal/db";
import { eq, and, desc, count, sum } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const financeRoutes = new Hono();
financeRoutes.use("*", requireAuth);

// Invoices
financeRoutes.get("/invoices", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(desc(invoices.createdAt));
  return c.json({ success: true, data: results });
});

financeRoutes.post("/invoices", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const items = body.items || [];
  const subtotal = items.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const tax = Math.round(subtotal * (body.taxRate || 0.19));
  const total = subtotal + tax;
  const [inv] = await db.insert(invoices).values({
    tenantId, number: body.number || `INV-${Date.now()}`, clientName: body.clientName,
    clientEmail: body.clientEmail || null, items, subtotal, tax, total,
    currency: body.currency || "RON", dueDate: body.dueDate ? new Date(body.dueDate) : null,
    notes: body.notes || null, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: inv }, 201);
});

financeRoutes.patch("/invoices/:id/status", async (c) => {
  const id = c.req.param("id"); const { status } = await c.req.json();
  const update: any = { status, updatedAt: new Date() };
  if (status === "paid") update.paidAt = new Date();
  await db.update(invoices).set(update).where(eq(invoices.id, id));
  return c.json({ success: true });
});

financeRoutes.delete("/invoices/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(invoices).where(and(eq(invoices.id, c.req.param("id")), eq(invoices.tenantId, tenantId)));
  return c.json({ success: true });
});

// Expenses
financeRoutes.get("/expenses", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(expenses).where(eq(expenses.tenantId, tenantId)).orderBy(desc(expenses.createdAt));
  return c.json({ success: true, data: results });
});

financeRoutes.post("/expenses", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [expense] = await db.insert(expenses).values({
    tenantId, title: body.title, amount: body.amount, currency: body.currency || "RON",
    category: body.category || null, date: body.date ? new Date(body.date) : new Date(),
    description: body.description || null, submittedBy: user.id,
  }).returning();
  return c.json({ success: true, data: expense }, 201);
});

financeRoutes.post("/expenses/:id/approve", async (c) => {
  const user = c.get("user");
  await db.update(expenses).set({ status: "approved", approvedBy: user.id }).where(eq(expenses.id, c.req.param("id")));
  return c.json({ success: true });
});

// Summary
financeRoutes.get("/summary", async (c) => {
  const tenantId = c.get("tenantId");
  const [invTotal] = await db.select({ count: count(), total: sum(invoices.total) }).from(invoices).where(and(eq(invoices.tenantId, tenantId), eq(invoices.status, "paid")));
  const [invPending] = await db.select({ count: count(), total: sum(invoices.total) }).from(invoices).where(and(eq(invoices.tenantId, tenantId), eq(invoices.status, "sent")));
  const [expTotal] = await db.select({ count: count(), total: sum(expenses.amount) }).from(expenses).where(eq(expenses.tenantId, tenantId));
  return c.json({ success: true, data: { paidInvoices: invTotal?.count || 0, paidAmount: Number(invTotal?.total || 0), pendingInvoices: invPending?.count || 0, pendingAmount: Number(invPending?.total || 0), totalExpenses: expTotal?.count || 0, expenseAmount: Number(expTotal?.total || 0) } });
});
