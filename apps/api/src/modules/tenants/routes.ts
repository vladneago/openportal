import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tenants } from "@openportal/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireOwner } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const tenantRoutes = new Hono();

// All tenant routes require authentication
tenantRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /tenants/current — Get current tenant info
// ─────────────────────────────────────────────

tenantRoutes.get("/current", async (c) => {
  const tenantId = c.get("tenantId");

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError(404, "NOT_FOUND", "Tenant not found");
  }

  return c.json({
    success: true,
    data: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo,
      plan: tenant.plan,
      primaryColor: tenant.primaryColor,
      customDomain: tenant.customDomain,
      enabledModules: tenant.enabledModules,
      maxUsers: tenant.maxUsers,
      maxStorageBytes: tenant.maxStorageBytes,
      maxSites: tenant.maxSites,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
    },
  });
});

// ─────────────────────────────────────────────
// PATCH /tenants/current — Update tenant settings
// ─────────────────────────────────────────────

const updateTenantSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  logo: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  settings: z.record(z.unknown()).optional(),
});

tenantRoutes.patch("/current", requireOwner, zValidator("json", updateTenantSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [updated] = await db
    .update(tenants)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning();

  return c.json({ success: true, data: updated });
});

// ─────────────────────────────────────────────
// GET /tenants/check-slug/:slug — Check slug availability
// ─────────────────────────────────────────────

tenantRoutes.get("/check-slug/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return c.json({
    success: true,
    data: { available: !existing },
  });
});
