import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, forms, formFields, formSubmissions } from "@openportal/db";
import { eq, and, asc, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { nanoid } from "nanoid";

export const formRoutes = new Hono();
formRoutes.use("*", requireAuth);

// ─── FORMS ───

formRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(forms).where(eq(forms.tenantId, tenantId)).orderBy(desc(forms.updatedAt));
  // Get submission counts
  const withCounts = await Promise.all(results.map(async (form) => {
    const [sc] = await db.select({ count: count() }).from(formSubmissions).where(eq(formSubmissions.formId, form.id));
    return { ...form, submissionCount: sc?.count || 0 };
  }));
  return c.json({ success: true, data: withCounts });
});

const createFormSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(500),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
});

formRoutes.post("/", zValidator("json", createFormSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [form] = await tx.insert(forms).values({
      tenantId, siteId: body.siteId, title: body.title, slug: body.slug,
      description: body.description || null, publicToken: nanoid(32), createdBy: user.id,
    }).returning();

    // Default fields
    const defaults = [
      { type: "text" as const, label: "Nume complet", placeholder: "Ion Popescu", required: true, order: 0 },
      { type: "email" as const, label: "Email", placeholder: "ion@email.com", required: true, order: 1 },
      { type: "textarea" as const, label: "Mesaj", placeholder: "Scrie mesajul tău...", required: false, order: 2 },
    ];
    for (const f of defaults) {
      await tx.insert(formFields).values({ formId: form!.id, type: f.type, label: f.label, placeholder: f.placeholder, required: f.required, order: f.order });
    }
    return form!;
  });

  return c.json({ success: true, data: result }, 201);
});

formRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const formId = c.req.param("id");
  const [form] = await db.select().from(forms).where(and(eq(forms.id, formId), eq(forms.tenantId, tenantId))).limit(1);
  if (!form) throw new AppError(404, "NOT_FOUND", "Form not found");
  const fields = await db.select().from(formFields).where(eq(formFields.formId, formId)).orderBy(asc(formFields.order));
  const [sc] = await db.select({ count: count() }).from(formSubmissions).where(eq(formSubmissions.formId, formId));
  return c.json({ success: true, data: { ...form, fields, submissionCount: sc?.count || 0 } });
});

formRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const formId = c.req.param("id");
  await db.delete(forms).where(and(eq(forms.id, formId), eq(forms.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Form deleted" } });
});

// Publish / Close
formRoutes.post("/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const formId = c.req.param("id");
  await db.update(forms).set({ status: "active", isPublic: true, updatedAt: new Date() }).where(and(eq(forms.id, formId), eq(forms.tenantId, tenantId)));
  return c.json({ success: true });
});

formRoutes.post("/:id/close", async (c) => {
  const tenantId = c.get("tenantId");
  const formId = c.req.param("id");
  await db.update(forms).set({ status: "closed", updatedAt: new Date() }).where(and(eq(forms.id, formId), eq(forms.tenantId, tenantId)));
  return c.json({ success: true });
});

// ─── FIELDS ───

const addFieldSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1).max(500),
  placeholder: z.string().max(500).optional(),
  helpText: z.string().max(1000).optional(),
  required: z.boolean().default(false),
  config: z.record(z.unknown()).optional(),
});

formRoutes.post("/:id/fields", zValidator("json", addFieldSchema), async (c) => {
  const formId = c.req.param("id");
  const body = c.req.valid("json");
  const existing = await db.select().from(formFields).where(eq(formFields.formId, formId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((f) => f.order)) + 1 : 0;
  const [field] = await db.insert(formFields).values({
    formId, type: body.type as any, label: body.label, placeholder: body.placeholder || null,
    helpText: body.helpText || null, required: body.required, order: maxOrder, config: body.config || {},
  }).returning();
  return c.json({ success: true, data: field }, 201);
});

formRoutes.delete("/:formId/fields/:fieldId", async (c) => {
  const fieldId = c.req.param("fieldId");
  await db.delete(formFields).where(eq(formFields.id, fieldId));
  return c.json({ success: true, data: { message: "Field deleted" } });
});

// ─── SUBMISSIONS ───

formRoutes.get("/:id/submissions", async (c) => {
  const formId = c.req.param("id");
  const results = await db.select().from(formSubmissions).where(eq(formSubmissions.formId, formId)).orderBy(desc(formSubmissions.submittedAt));
  return c.json({ success: true, data: results });
});

formRoutes.post("/:id/submissions", async (c) => {
  const formId = c.req.param("id");
  const user = c.get("user");
  const body = await c.req.json();
  const [sub] = await db.insert(formSubmissions).values({ formId, data: body.data || {}, submittedBy: user.id }).returning();
  return c.json({ success: true, data: sub }, 201);
});
