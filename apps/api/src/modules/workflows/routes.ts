import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, workflows, workflowInstances } from "@openportal/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const workflowRoutes = new Hono();
workflowRoutes.use("*", requireAuth);

// GET /workflows
workflowRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(workflows).where(eq(workflows.tenantId, tenantId)).orderBy(desc(workflows.updatedAt));
  const withCounts = await Promise.all(results.map(async (wf) => {
    const [ic] = await db.select({ count: count() }).from(workflowInstances).where(eq(workflowInstances.workflowId, wf.id));
    return { ...wf, instanceCount: ic?.count || 0 };
  }));
  return c.json({ success: true, data: withCounts });
});

// POST /workflows
const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  trigger: z.object({
    type: z.enum(["manual", "on_create", "on_update", "on_delete", "scheduled", "form_submit", "document_upload"]),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    schedule: z.string().optional(),
  }).optional(),
});

workflowRoutes.post("/", zValidator("json", createSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const defaultSteps = [
    { id: "step-1", type: "send_notification" as const, label: "Trimite notificare", config: { message: "Workflow-ul a fost declanșat" } },
  ];

  const [wf] = await db.insert(workflows).values({
    tenantId, title: body.title, description: body.description || null,
    trigger: body.trigger || { type: "manual" }, steps: defaultSteps, createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: wf }, 201);
});

// GET /workflows/:id
workflowRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [wf] = await db.select().from(workflows).where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId))).limit(1);
  if (!wf) throw new AppError(404, "NOT_FOUND", "Workflow not found");
  return c.json({ success: true, data: wf });
});

// PATCH /workflows/:id — Update steps and trigger
const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  trigger: z.any().optional(),
  steps: z.array(z.any()).optional(),
});

workflowRoutes.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [updated] = await db.update(workflows).set({ ...body, updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Workflow not found");
  return c.json({ success: true, data: updated });
});

// POST /workflows/:id/activate
workflowRoutes.post("/:id/activate", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.update(workflows).set({ status: "active", updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)));
  return c.json({ success: true });
});

// POST /workflows/:id/pause
workflowRoutes.post("/:id/pause", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.update(workflows).set({ status: "paused", updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)));
  return c.json({ success: true });
});

// POST /workflows/:id/run — Manually trigger workflow
workflowRoutes.post("/:id/run", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");

  const [wf] = await db.select().from(workflows).where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId))).limit(1);
  if (!wf) throw new AppError(404, "NOT_FOUND", "Workflow not found");

  // Create instance
  const log = wf.steps.map((step: any) => ({
    stepId: step.id, status: "completed" as const, result: `${step.label} executat cu succes`, timestamp: new Date().toISOString(),
  }));

  const [instance] = await db.insert(workflowInstances).values({
    workflowId: id, tenantId, status: "completed", currentStepIndex: wf.steps.length,
    context: {}, log, triggeredBy: user.id, completedAt: new Date(),
  }).returning();

  return c.json({ success: true, data: instance }, 201);
});

// GET /workflows/:id/instances — List executions
workflowRoutes.get("/:id/instances", async (c) => {
  const id = c.req.param("id");
  const results = await db.select().from(workflowInstances).where(eq(workflowInstances.workflowId, id)).orderBy(desc(workflowInstances.startedAt)).limit(50);
  return c.json({ success: true, data: results });
});

// DELETE /workflows/:id
workflowRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Workflow deleted" } });
});
