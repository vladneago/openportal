import { Hono } from "hono";
import { db, properties, propertyViewings } from "@openportal/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const realestateRoutes = new Hono();
realestateRoutes.use("*", requireAuth);

realestateRoutes.get("/properties", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status"); const type = c.req.query("type");
  const conditions: any[] = [eq(properties.tenantId, tenantId)];
  if (status) conditions.push(eq(properties.status, status as any));
  if (type) conditions.push(eq(properties.propertyType, type as any));
  const results = await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
  const withViewings = await Promise.all(results.map(async (p) => {
    const [vc] = await db.select({ count: count() }).from(propertyViewings).where(eq(propertyViewings.propertyId, p.id));
    return { ...p, viewingCount: vc?.count || 0 };
  }));
  return c.json({ success: true, data: withViewings });
});

realestateRoutes.post("/properties", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [prop] = await db.insert(properties).values({
    tenantId, title: body.title, propertyType: body.propertyType || "apartment",
    listingType: body.listingType || "sale", price: body.price || 0, currency: body.currency || "EUR",
    rentPrice: body.rentPrice || 0, address: body.address || null, city: body.city || null,
    zone: body.zone || null, area: body.area || null, rooms: body.rooms || null,
    bathrooms: body.bathrooms || null, floor: body.floor || null, description: body.description || null,
    features: body.features || [], agentId: body.agentId || user.id, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: prop }, 201);
});

realestateRoutes.patch("/properties/:id", async (c) => {
  const id = c.req.param("id"); const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.status) update.status = body.status;
  if (body.price !== undefined) update.price = body.price;
  if (body.title) update.title = body.title;
  await db.update(properties).set(update).where(eq(properties.id, id));
  return c.json({ success: true });
});

realestateRoutes.delete("/properties/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(properties).where(and(eq(properties.id, c.req.param("id")), eq(properties.tenantId, tenantId)));
  return c.json({ success: true });
});

// Viewings
realestateRoutes.get("/properties/:id/viewings", async (c) => {
  const results = await db.select().from(propertyViewings).where(eq(propertyViewings.propertyId, c.req.param("id"))).orderBy(desc(propertyViewings.scheduledAt));
  return c.json({ success: true, data: results });
});

realestateRoutes.post("/properties/:id/viewings", async (c) => {
  const user = c.get("user"); const body = await c.req.json();
  const [viewing] = await db.insert(propertyViewings).values({
    propertyId: c.req.param("id"), clientName: body.clientName,
    clientPhone: body.clientPhone || null, clientEmail: body.clientEmail || null,
    scheduledAt: new Date(body.scheduledAt), agentId: user.id,
  }).returning();
  return c.json({ success: true, data: viewing }, 201);
});
