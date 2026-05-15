import { Hono } from "hono";
import { db, webSites, webPages, webThemes, bookingServices, bookingResources } from "@openportal/db";
import { and, asc, eq, or } from "drizzle-orm";
import { AppError } from "../../middleware/error-handler";

export const siteBuilderPublicRoutes = new Hono();

// ─────────────────────────────────────────────
// GET /public/sites/by-host?host=salon-luna.openportal.app
// Resolves a site by its subdomain or custom domain. Returns site + theme + nav.
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/by-host", async (c) => {
  const host = c.req.query("host");
  if (!host) throw new AppError(400, "MISSING_HOST", "host query parameter is required");

  // Normalize host (strip port, lowercase)
  const cleanHost = host.toLowerCase().split(":")[0];

  // Try matching custom domain first, then subdomain.openportal.app
  const subdomain = cleanHost.endsWith(".openportal.app")
    ? cleanHost.replace(/\.openportal\.app$/, "")
    : null;

  const [site] = await db
    .select()
    .from(webSites)
    .where(
      or(
        eq(webSites.customDomain, cleanHost),
        subdomain ? eq(webSites.subdomain, subdomain) : undefined,
      )!,
    )
    .limit(1);

  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "No site for this host");
  if (site.status !== "published" && c.req.query("preview") !== "1") {
    throw new AppError(403, "NOT_PUBLISHED", "Site is not published");
  }

  let theme = null;
  if (site.themeId) {
    const [t] = await db.select().from(webThemes).where(eq(webThemes.id, site.themeId)).limit(1);
    theme = t || null;
  }

  return c.json({ success: true, data: { site, theme } });
});

// ─────────────────────────────────────────────
// GET /public/sites/:siteId/page?slug=...
// Returns a single published page (or draft when ?preview=1) for rendering.
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/:siteId/page", async (c) => {
  const siteId = c.req.param("siteId");
  const slug = c.req.query("slug") || "";
  const preview = c.req.query("preview") === "1";

  const [page] = await db
    .select()
    .from(webPages)
    .where(and(eq(webPages.siteId, siteId), eq(webPages.slug, slug)))
    .limit(1);

  if (!page) throw new AppError(404, "PAGE_NOT_FOUND", "Page not found");

  // For published pages return the snapshot; for preview return live blocks
  const blocks = preview
    ? page.blocks
    : (page.status === "published" && page.publishedBlocksSnapshot) || page.blocks;
  const title = preview
    ? page.title
    : page.publishedTitleSnapshot || page.title;

  return c.json({
    success: true,
    data: {
      id: page.id,
      slug: page.slug,
      title,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      ogImageUrl: page.ogImageUrl,
      blocks,
      locale: page.locale,
      isHomePage: page.isHomePage,
    },
  });
});

// ─────────────────────────────────────────────
// GET /public/sites/:siteId/pages
// Lists published pages (for nav/sitemap).
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/:siteId/pages", async (c) => {
  const siteId = c.req.param("siteId");
  const preview = c.req.query("preview") === "1";

  const pages = await db
    .select({
      id: webPages.id,
      slug: webPages.slug,
      title: webPages.title,
      isHomePage: webPages.isHomePage,
      sortOrder: webPages.sortOrder,
      status: webPages.status,
    })
    .from(webPages)
    .where(
      preview
        ? eq(webPages.siteId, siteId)
        : and(eq(webPages.siteId, siteId), eq(webPages.status, "published"))!,
    );

  return c.json({ success: true, data: pages });
});

// ─────────────────────────────────────────────
// GET /public/sites/by-id?id=...
// Returns site config + theme for rendering (in preview mode also drafts).
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/by-id", async (c) => {
  const id = c.req.query("id");
  if (!id) throw new AppError(400, "MISSING_ID", "id query parameter is required");
  const preview = c.req.query("preview") === "1";

  const [site] = await db.select().from(webSites).where(eq(webSites.id, id)).limit(1);
  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "Site not found");
  if (site.status !== "published" && !preview) {
    throw new AppError(403, "NOT_PUBLISHED", "Site is not published");
  }

  let theme = null;
  if (site.themeId) {
    const [t] = await db.select().from(webThemes).where(eq(webThemes.id, site.themeId)).limit(1);
    theme = t || null;
  }

  return c.json({ success: true, data: { site, theme } });
});

// ─────────────────────────────────────────────
// GET /public/sites/:siteId/services
// Returns active, bookable-online services for the site's tenant.
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/:siteId/services", async (c) => {
  const siteId = c.req.param("siteId");

  const [site] = await db
    .select({ tenantId: webSites.tenantId })
    .from(webSites)
    .where(eq(webSites.id, siteId))
    .limit(1);

  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "Site not found");

  const services = await db
    .select({
      id: bookingServices.id,
      name: bookingServices.name,
      slug: bookingServices.slug,
      description: bookingServices.description,
      category: bookingServices.category,
      durationMinutes: bookingServices.durationMinutes,
      price: bookingServices.price,
      currency: bookingServices.currency,
      color: bookingServices.color,
      imageUrl: bookingServices.imageUrl,
      sortOrder: bookingServices.sortOrder,
    })
    .from(bookingServices)
    .where(
      and(
        eq(bookingServices.tenantId, site.tenantId),
        eq(bookingServices.isActive, true),
        eq(bookingServices.isBookableOnline, true),
      ),
    )
    .orderBy(asc(bookingServices.sortOrder), asc(bookingServices.name));

  return c.json({ success: true, data: services });
});

// ─────────────────────────────────────────────
// GET /public/sites/:siteId/resources
// Returns active, bookable-online resources (staff) for the site's tenant.
// ─────────────────────────────────────────────

siteBuilderPublicRoutes.get("/sites/:siteId/resources", async (c) => {
  const siteId = c.req.param("siteId");

  const [site] = await db
    .select({ tenantId: webSites.tenantId })
    .from(webSites)
    .where(eq(webSites.id, siteId))
    .limit(1);

  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "Site not found");

  const resources = await db
    .select({
      id: bookingResources.id,
      name: bookingResources.name,
      type: bookingResources.type,
      description: bookingResources.description,
      avatarUrl: bookingResources.avatarUrl,
      color: bookingResources.color,
      sortOrder: bookingResources.sortOrder,
    })
    .from(bookingResources)
    .where(
      and(
        eq(bookingResources.tenantId, site.tenantId),
        eq(bookingResources.isActive, true),
        eq(bookingResources.isBookableOnline, true),
      ),
    )
    .orderBy(asc(bookingResources.sortOrder), asc(bookingResources.name));

  return c.json({ success: true, data: resources });
});
