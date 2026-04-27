import { Hono } from "hono";
import { db, companies, contacts, deals, crmActivities } from "@openportal/db";
import { eq, and, desc, count, sum } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const crmRoutes = new Hono();
crmRoutes.use("*", requireAuth);

// Companies
crmRoutes.get("/companies", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(companies).where(eq(companies.tenantId, tenantId)).orderBy(companies.name);
  return c.json({ success: true, data: results });
});

crmRoutes.post("/companies", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [company] = await db.insert(companies).values({ tenantId, name: body.name, domain: body.domain || null, industry: body.industry || null, size: body.size || null, phone: body.phone || null, address: body.address || null, createdBy: user.id }).returning();
  return c.json({ success: true, data: company }, 201);
});

crmRoutes.delete("/companies/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(companies).where(and(eq(companies.id, c.req.param("id")), eq(companies.tenantId, tenantId)));
  return c.json({ success: true });
});

// Contacts
crmRoutes.get("/contacts", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, email: contacts.email, phone: contacts.phone, jobTitle: contacts.jobTitle, companyId: contacts.companyId, companyName: companies.name, createdAt: contacts.createdAt }).from(contacts).leftJoin(companies, eq(contacts.companyId, companies.id)).where(eq(contacts.tenantId, tenantId)).orderBy(contacts.lastName);
  return c.json({ success: true, data: results });
});

crmRoutes.post("/contacts", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [contact] = await db.insert(contacts).values({ tenantId, firstName: body.firstName, lastName: body.lastName, email: body.email || null, phone: body.phone || null, jobTitle: body.jobTitle || null, companyId: body.companyId || null, createdBy: user.id }).returning();
  return c.json({ success: true, data: contact }, 201);
});

crmRoutes.delete("/contacts/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(contacts).where(and(eq(contacts.id, c.req.param("id")), eq(contacts.tenantId, tenantId)));
  return c.json({ success: true });
});

// Deals
crmRoutes.get("/deals", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select({ id: deals.id, title: deals.title, value: deals.value, currency: deals.currency, stage: deals.stage, probability: deals.probability, companyId: deals.companyId, companyName: companies.name, expectedCloseDate: deals.expectedCloseDate, createdAt: deals.createdAt }).from(deals).leftJoin(companies, eq(deals.companyId, companies.id)).where(eq(deals.tenantId, tenantId)).orderBy(desc(deals.createdAt));
  return c.json({ success: true, data: results });
});

crmRoutes.post("/deals", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [deal] = await db.insert(deals).values({ tenantId, title: body.title, value: body.value || 0, currency: body.currency || "RON", stage: body.stage || "lead", probability: body.probability || 0, companyId: body.companyId || null, contactId: body.contactId || null, ownerId: user.id, expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null, createdBy: user.id }).returning();
  return c.json({ success: true, data: deal }, 201);
});

crmRoutes.patch("/deals/:id", async (c) => {
  const id = c.req.param("id"); const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.stage) { update.stage = body.stage; if (body.stage === "won" || body.stage === "lost") update.closedAt = new Date(); }
  if (body.title) update.title = body.title;
  if (body.value !== undefined) update.value = body.value;
  if (body.probability !== undefined) update.probability = body.probability;
  await db.update(deals).set(update).where(eq(deals.id, id));
  return c.json({ success: true });
});

crmRoutes.delete("/deals/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(deals).where(and(eq(deals.id, c.req.param("id")), eq(deals.tenantId, tenantId)));
  return c.json({ success: true });
});

// Pipeline summary
crmRoutes.get("/pipeline", async (c) => {
  const tenantId = c.get("tenantId");
  const stages = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
  const pipeline = await Promise.all(stages.map(async (stage) => {
    const [result] = await db.select({ count: count(), totalValue: sum(deals.value) }).from(deals).where(and(eq(deals.tenantId, tenantId), eq(deals.stage, stage as any)));
    return { stage, count: result?.count || 0, totalValue: Number(result?.totalValue || 0) };
  }));
  return c.json({ success: true, data: pipeline });
});
