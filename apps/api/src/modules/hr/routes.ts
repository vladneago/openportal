import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, jobPostings, applications, leaveRequests, users } from "@openportal/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const hrRoutes = new Hono();
hrRoutes.use("*", requireAuth);

// ─── JOBS ───
hrRoutes.get("/jobs", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(jobPostings).where(eq(jobPostings.tenantId, tenantId)).orderBy(desc(jobPostings.createdAt));
  const withCounts = await Promise.all(results.map(async (job) => {
    const [ac] = await db.select({ count: count() }).from(applications).where(eq(applications.jobId, job.id));
    return { ...job, applicationCount: ac?.count || 0 };
  }));
  return c.json({ success: true, data: withCounts });
});

const createJobSchema = z.object({
  title: z.string().min(1).max(500),
  department: z.string().max(200).optional(),
  location: z.string().max(300).optional(),
  type: z.string().max(50).optional(),
  description: z.string().max(10000).optional(),
  requirements: z.string().max(10000).optional(),
  salaryRange: z.string().max(100).optional(),
});

hrRoutes.post("/jobs", zValidator("json", createJobSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [job] = await db.insert(jobPostings).values({ tenantId, ...body, createdBy: user.id }).returning();
  return c.json({ success: true, data: job }, 201);
});

hrRoutes.post("/jobs/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.update(jobPostings).set({ status: "open", updatedAt: new Date() }).where(and(eq(jobPostings.id, id), eq(jobPostings.tenantId, tenantId)));
  return c.json({ success: true });
});

hrRoutes.delete("/jobs/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(jobPostings).where(and(eq(jobPostings.id, c.req.param("id")), eq(jobPostings.tenantId, tenantId)));
  return c.json({ success: true });
});

// ─── APPLICATIONS ───
hrRoutes.get("/jobs/:jobId/applications", async (c) => {
  const jobId = c.req.param("jobId");
  const results = await db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.appliedAt));
  return c.json({ success: true, data: results });
});

hrRoutes.post("/jobs/:jobId/applications", async (c) => {
  const tenantId = c.get("tenantId");
  const jobId = c.req.param("jobId");
  const body = await c.req.json();
  const [app] = await db.insert(applications).values({
    jobId, tenantId, candidateName: body.candidateName, candidateEmail: body.candidateEmail,
    candidatePhone: body.candidatePhone || null, coverLetter: body.coverLetter || null,
  }).returning();
  return c.json({ success: true, data: app }, 201);
});

hrRoutes.patch("/applications/:id/status", async (c) => {
  const id = c.req.param("id");
  const { status, notes } = await c.req.json();
  const updateData: any = { status, updatedAt: new Date() };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(applications).set(updateData).where(eq(applications.id, id));
  return c.json({ success: true });
});

// ─── LEAVE REQUESTS ───
hrRoutes.get("/leaves", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select({
    id: leaveRequests.id, type: leaveRequests.type, startDate: leaveRequests.startDate,
    endDate: leaveRequests.endDate, reason: leaveRequests.reason, status: leaveRequests.status,
    createdAt: leaveRequests.createdAt, userId: leaveRequests.userId,
    userName: users.displayName, userFirstName: users.firstName, userLastName: users.lastName,
  }).from(leaveRequests)
    .innerJoin(users, eq(leaveRequests.userId, users.id))
    .where(eq(leaveRequests.tenantId, tenantId))
    .orderBy(desc(leaveRequests.createdAt));
  return c.json({ success: true, data: results });
});

hrRoutes.post("/leaves", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = await c.req.json();
  const [leave] = await db.insert(leaveRequests).values({
    tenantId, userId: user.id, type: body.type, startDate: new Date(body.startDate),
    endDate: new Date(body.endDate), reason: body.reason || null,
  }).returning();
  return c.json({ success: true, data: leave }, 201);
});

hrRoutes.post("/leaves/:id/approve", async (c) => {
  const user = c.get("user");
  await db.update(leaveRequests).set({ status: "approved", approvedBy: user.id }).where(eq(leaveRequests.id, c.req.param("id")));
  return c.json({ success: true });
});

hrRoutes.post("/leaves/:id/reject", async (c) => {
  await db.update(leaveRequests).set({ status: "rejected" }).where(eq(leaveRequests.id, c.req.param("id")));
  return c.json({ success: true });
});
