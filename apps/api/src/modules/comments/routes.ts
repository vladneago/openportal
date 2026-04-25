import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, comments, users, notifications } from "@openportal/db";
import { eq, and, isNull, asc } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const commentRoutes = new Hono();
commentRoutes.use("*", requireAuth);

// GET /comments?resourceType=xxx&resourceId=xxx
commentRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const resourceType = c.req.query("resourceType");
  const resourceId = c.req.query("resourceId");
  if (!resourceType || !resourceId) throw new AppError(400, "MISSING_PARAM", "resourceType and resourceId required");

  const results = await db.select({
    id: comments.id, body: comments.body, resourceType: comments.resourceType,
    resourceId: comments.resourceId, parentId: comments.parentId,
    createdAt: comments.createdAt, updatedAt: comments.updatedAt,
    createdBy: comments.createdBy,
    authorName: users.displayName, authorEmail: users.email,
    authorFirstName: users.firstName, authorLastName: users.lastName,
  }).from(comments)
    .innerJoin(users, eq(comments.createdBy, users.id))
    .where(and(eq(comments.tenantId, tenantId), eq(comments.resourceType, resourceType), eq(comments.resourceId, resourceId)))
    .orderBy(asc(comments.createdAt));

  return c.json({ success: true, data: results });
});

// POST /comments
const createCommentSchema = z.object({
  resourceType: z.string().min(1).max(50),
  resourceId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

commentRoutes.post("/", zValidator("json", createCommentSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [comment] = await db.insert(comments).values({
    tenantId, resourceType: body.resourceType, resourceId: body.resourceId,
    body: body.body, parentId: body.parentId || null, createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: comment }, 201);
});

// DELETE /comments/:id
commentRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.tenantId, tenantId), eq(comments.createdBy, user.id)));
  return c.json({ success: true, data: { message: "Comment deleted" } });
});
