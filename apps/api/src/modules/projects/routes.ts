import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, projects, tasks, milestones, users } from "@openportal/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const projectRoutes = new Hono();
projectRoutes.use("*", requireAuth);

// ─── PROJECTS ───
projectRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(projects).where(eq(projects.tenantId, tenantId)).orderBy(desc(projects.updatedAt));
  const withStats = await Promise.all(results.map(async (p) => {
    const [tc] = await db.select({ count: count() }).from(tasks).where(eq(tasks.projectId, p.id));
    const doneTasks = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.projectId, p.id), eq(tasks.status, "done")));
    return { ...p, taskCount: tc?.count || 0, doneTaskCount: doneTasks[0]?.count || 0 };
  }));
  return c.json({ success: true, data: withStats });
});

const createProjectSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  color: z.string().max(7).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

projectRoutes.post("/", zValidator("json", createProjectSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [project] = await db.insert(projects).values({
    tenantId, title: body.title, slug: body.slug, description: body.description || null,
    color: body.color || "#6366F1",
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: project }, 201);
});

projectRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId))).limit(1);
  if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");

  const taskList = await db.select({
    id: tasks.id, title: tasks.title, status: tasks.status, priority: tasks.priority,
    dueDate: tasks.dueDate, order: tasks.order, assigneeId: tasks.assigneeId,
    estimatedHours: tasks.estimatedHours, loggedMinutes: tasks.loggedMinutes,
    tags: tasks.tags, createdAt: tasks.createdAt,
    assigneeName: users.displayName,
  }).from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.projectId, id))
    .orderBy(asc(tasks.order));

  const msList = await db.select().from(milestones).where(eq(milestones.projectId, id)).orderBy(asc(milestones.dueDate));

  return c.json({ success: true, data: { ...project, tasks: taskList, milestones: msList } });
});

projectRoutes.patch("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.title) update.title = body.title;
  if (body.status) update.status = body.status;
  if (body.description !== undefined) update.description = body.description;
  await db.update(projects).set(update).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
  return c.json({ success: true });
});

projectRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(projects).where(and(eq(projects.id, c.req.param("id")), eq(projects.tenantId, tenantId)));
  return c.json({ success: true });
});

// ─── TASKS ───
projectRoutes.post("/:projectId/tasks", async (c) => {
  const projectId = c.req.param("projectId");
  const user = c.get("user");
  const body = await c.req.json();
  const existing = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) + 1 : 0;
  const [task] = await db.insert(tasks).values({
    projectId, title: body.title || "Task nou", status: body.status || "todo",
    priority: body.priority || "medium", assigneeId: body.assigneeId || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null, order: maxOrder,
    estimatedHours: body.estimatedHours || null, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: task }, 201);
});

projectRoutes.patch("/tasks/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.title) update.title = body.title;
  if (body.status) update.status = body.status;
  if (body.priority) update.priority = body.priority;
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
  if (body.dueDate !== undefined) update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  await db.update(tasks).set(update).where(eq(tasks.id, taskId));
  return c.json({ success: true });
});

projectRoutes.delete("/tasks/:taskId", async (c) => {
  await db.delete(tasks).where(eq(tasks.id, c.req.param("taskId")));
  return c.json({ success: true });
});

// ─── MILESTONES ───
projectRoutes.post("/:projectId/milestones", async (c) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json();
  const [ms] = await db.insert(milestones).values({
    projectId, title: body.title || "Milestone nou",
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  }).returning();
  return c.json({ success: true, data: ms }, 201);
});

projectRoutes.post("/milestones/:id/complete", async (c) => {
  await db.update(milestones).set({ completed: true, completedAt: new Date() }).where(eq(milestones.id, c.req.param("id")));
  return c.json({ success: true });
});
