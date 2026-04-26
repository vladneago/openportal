import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, courses, courseModules, lessons, enrollments } from "@openportal/db";
import { eq, and, asc, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const educationRoutes = new Hono();
educationRoutes.use("*", requireAuth);

// ─── COURSES ───

educationRoutes.get("/courses", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(courses).where(eq(courses.tenantId, tenantId)).orderBy(desc(courses.updatedAt));
  const withStats = await Promise.all(results.map(async (course) => {
    const mods = await db.select().from(courseModules).where(eq(courseModules.courseId, course.id));
    let lessonCount = 0;
    for (const mod of mods) {
      const [lc] = await db.select({ count: count() }).from(lessons).where(eq(lessons.moduleId, mod.id));
      lessonCount += lc?.count || 0;
    }
    const [ec] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, course.id));
    return { ...course, moduleCount: mods.length, lessonCount, enrollmentCount: ec?.count || 0 };
  }));
  return c.json({ success: true, data: withStats });
});

const createCourseSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  settings: z.record(z.unknown()).optional(),
});

educationRoutes.post("/courses", zValidator("json", createCourseSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [course] = await tx.insert(courses).values({
      tenantId, title: body.title, slug: body.slug,
      description: body.description || null, settings: body.settings || {}, createdBy: user.id,
    }).returning();

    // Create default module
    await tx.insert(courseModules).values({ courseId: course!.id, title: "Modulul 1: Introducere", order: 0 });
    return course!;
  });

  return c.json({ success: true, data: result }, 201);
});

educationRoutes.get("/courses/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");

  const [course] = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.tenantId, tenantId))).limit(1);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");

  const mods = await db.select().from(courseModules).where(eq(courseModules.courseId, id)).orderBy(asc(courseModules.order));
  const modsWithLessons = await Promise.all(mods.map(async (mod) => {
    const lessonList = await db.select().from(lessons).where(eq(lessons.moduleId, mod.id)).orderBy(asc(lessons.order));
    return { ...mod, lessons: lessonList };
  }));

  // Get user enrollment
  const [enrollment] = await db.select().from(enrollments).where(and(eq(enrollments.courseId, id), eq(enrollments.userId, user.id))).limit(1);
  const [ec] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, id));

  return c.json({ success: true, data: { ...course, modules: modsWithLessons, enrollment, enrollmentCount: ec?.count || 0 } });
});

educationRoutes.post("/courses/:id/publish", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.update(courses).set({ status: "published", updatedAt: new Date() }).where(and(eq(courses.id, id), eq(courses.tenantId, tenantId)));
  return c.json({ success: true });
});

educationRoutes.delete("/courses/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.delete(courses).where(and(eq(courses.id, id), eq(courses.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Course deleted" } });
});

// ─── MODULES ───

educationRoutes.post("/courses/:courseId/modules", async (c) => {
  const courseId = c.req.param("courseId");
  const body = await c.req.json();
  const existing = await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0;
  const [mod] = await db.insert(courseModules).values({ courseId, title: body.title || `Modulul ${maxOrder + 1}`, order: maxOrder }).returning();
  return c.json({ success: true, data: mod }, 201);
});

educationRoutes.delete("/modules/:id", async (c) => {
  await db.delete(courseModules).where(eq(courseModules.id, c.req.param("id")));
  return c.json({ success: true });
});

// ─── LESSONS ───

educationRoutes.post("/modules/:moduleId/lessons", async (c) => {
  const moduleId = c.req.param("moduleId");
  const body = await c.req.json();
  const existing = await db.select().from(lessons).where(eq(lessons.moduleId, moduleId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((l) => l.order)) + 1 : 0;
  const [lesson] = await db.insert(lessons).values({
    moduleId, title: body.title || "Lecție nouă", type: body.type || "text",
    content: body.content || null, order: maxOrder, durationMinutes: body.durationMinutes || 0,
    videoUrl: body.videoUrl || null,
  }).returning();
  return c.json({ success: true, data: lesson }, 201);
});

educationRoutes.patch("/lessons/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const updateData: any = {};
  if (body.title) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
  if (body.type) updateData.type = body.type;
  if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
  if (body.quizConfig !== undefined) updateData.quizConfig = body.quizConfig;
  const [updated] = await db.update(lessons).set(updateData).where(eq(lessons.id, id)).returning();
  return c.json({ success: true, data: updated });
});

educationRoutes.delete("/lessons/:id", async (c) => {
  await db.delete(lessons).where(eq(lessons.id, c.req.param("id")));
  return c.json({ success: true });
});

// ─── ENROLLMENTS ───

educationRoutes.post("/courses/:courseId/enroll", async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("courseId");
  const [existing] = await db.select().from(enrollments).where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, user.id))).limit(1);
  if (existing) return c.json({ success: true, data: existing });
  const [enrollment] = await db.insert(enrollments).values({ courseId, userId: user.id }).returning();
  return c.json({ success: true, data: enrollment }, 201);
});

educationRoutes.post("/courses/:courseId/complete-lesson", async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("courseId");
  const { lessonId } = await c.req.json();

  const [enrollment] = await db.select().from(enrollments).where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, user.id))).limit(1);
  if (!enrollment) throw new AppError(400, "NOT_ENROLLED", "Not enrolled in this course");

  const completed = [...(enrollment.completedLessons || [])];
  if (!completed.includes(lessonId)) completed.push(lessonId);

  // Calculate progress
  const mods = await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
  let totalLessons = 0;
  for (const mod of mods) {
    const [lc] = await db.select({ count: count() }).from(lessons).where(eq(lessons.moduleId, mod.id));
    totalLessons += lc?.count || 0;
  }
  const progress = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;

  await db.update(enrollments).set({
    completedLessons: completed, progress,
    completedAt: progress === 100 ? new Date() : null,
    status: progress === 100 ? "completed" : "active",
  }).where(eq(enrollments.id, enrollment.id));

  return c.json({ success: true, data: { progress, completedLessons: completed } });
});
