import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, users } from "@openportal/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const userRoutes = new Hono();

// All user routes require authentication
userRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /users — List all users in current tenant
// ─────────────────────────────────────────────

userRoutes.get("/", requireAdmin, async (c) => {
  const tenantId = c.get("tenantId");

  const results = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatar: users.avatar,
      jobTitle: users.jobTitle,
      department: users.department,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(users.firstName);

  return c.json({ success: true, data: results });
});

// ─────────────────────────────────────────────
// GET /users/:id — Get user by ID
// ─────────────────────────────────────────────

userRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("id");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatar: users.avatar,
      jobTitle: users.jobTitle,
      department: users.department,
      phone: users.phone,
      role: users.role,
      status: users.status,
      timezone: users.timezone,
      locale: users.locale,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);

  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  return c.json({ success: true, data: user });
});

// ─────────────────────────────────────────────
// PATCH /users/me — Update own profile
// ─────────────────────────────────────────────

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(200).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  jobTitle: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  preferences: z.record(z.unknown()).optional(),
});

userRoutes.patch("/me", zValidator("json", updateProfileSchema), async (c) => {
  const currentUser = c.get("user");

  const body = c.req.valid("json");

  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, currentUser.id))
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatar: users.avatar,
      jobTitle: users.jobTitle,
      department: users.department,
      role: users.role,
    });

  return c.json({ success: true, data: updated });
});
