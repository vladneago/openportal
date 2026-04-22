import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, sites, siteMembers } from "@openportal/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const siteRoutes = new Hono();

// All site routes require authentication
siteRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /sites — List all sites for current tenant
// ─────────────────────────────────────────────

siteRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");

  // Get all sites the user has access to
  const results = await db
    .select({
      id: sites.id,
      title: sites.title,
      slug: sites.slug,
      description: sites.description,
      type: sites.type,
      status: sites.status,
      logo: sites.logo,
      coverImage: sites.coverImage,
      isPublic: sites.isPublic,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .where(and(
      eq(sites.tenantId, tenantId),
      eq(sites.status, "active"),
    ))
    .orderBy(sites.title);

  return c.json({ success: true, data: results });
});

// ─────────────────────────────────────────────
// POST /sites — Create a new site
// ─────────────────────────────────────────────

const createSiteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000).optional(),
  type: z.enum(["team", "communication", "project", "wiki"]).default("team"),
  isPublic: z.boolean().default(false),
});

siteRoutes.post("/", zValidator("json", createSiteSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // Check if slug is taken within this tenant
  const [existing] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, body.slug)))
    .limit(1);

  if (existing) {
    throw new AppError(409, "SLUG_TAKEN", "A site with this URL already exists");
  }

  // Create site and add creator as owner
  const result = await db.transaction(async (tx) => {
    const [newSite] = await tx
      .insert(sites)
      .values({
        tenantId,
        title: body.title,
        slug: body.slug,
        description: body.description || null,
        type: body.type,
        isPublic: body.isPublic,
        createdBy: user.id,
        navigation: [
          { id: "home", label: "Home", url: `/sites/${body.slug}` },
          { id: "docs", label: "Documents", url: `/sites/${body.slug}/documents` },
          { id: "pages", label: "Pages", url: `/sites/${body.slug}/pages` },
        ],
      })
      .returning();

    // Add creator as site owner
    await tx.insert(siteMembers).values({
      siteId: newSite!.id,
      userId: user.id,
      role: "owner",
      addedBy: user.id,
    });

    return newSite!;
  });

  return c.json({ success: true, data: result }, 201);
});

// ─────────────────────────────────────────────
// GET /sites/:slug — Get site by slug
// ─────────────────────────────────────────────

siteRoutes.get("/:slug", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug)))
    .limit(1);

  if (!site) {
    throw new AppError(404, "NOT_FOUND", "Site not found");
  }

  // Get member count
  const [memberCount] = await db
    .select({ count: count() })
    .from(siteMembers)
    .where(eq(siteMembers.siteId, site.id));

  return c.json({
    success: true,
    data: { ...site, memberCount: memberCount?.count || 0 },
  });
});

// ─────────────────────────────────────────────
// PATCH /sites/:slug — Update site
// ─────────────────────────────────────────────

const updateSiteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  theme: z.object({
    primaryColor: z.string().optional(),
    headerLayout: z.enum(["standard", "compact", "minimal"]).optional(),
    navStyle: z.enum(["left", "top"]).optional(),
  }).optional(),
  navigation: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string(),
    icon: z.string().optional(),
    children: z.array(z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
      icon: z.string().optional(),
    })).optional(),
  })).optional(),
  isPublic: z.boolean().optional(),
});

siteRoutes.patch("/:slug", zValidator("json", updateSiteSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");

  const [updated] = await db
    .update(sites)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug)))
    .returning();

  if (!updated) {
    throw new AppError(404, "NOT_FOUND", "Site not found");
  }

  return c.json({ success: true, data: updated });
});

// ─────────────────────────────────────────────
// DELETE /sites/:slug — Soft delete site
// ─────────────────────────────────────────────

siteRoutes.delete("/:slug", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");

  const [updated] = await db
    .update(sites)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug)))
    .returning();

  if (!updated) {
    throw new AppError(404, "NOT_FOUND", "Site not found");
  }

  return c.json({ success: true, data: { message: "Site deleted successfully" } });
});
