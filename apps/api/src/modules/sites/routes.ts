import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db, sites, siteCollections, siteMembers, siteTemplates, siteDesigns,
  hubAssociations, siteFollowers, siteActivities, externalUsers, sharingLinks,
  groups, groupMembers, roleDefinitions, roleAssignments, accessRequests, auditLog,
} from "@openportal/db";
import { eq, and, or, desc, count, sql, inArray, isNull } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { randomBytes } from "crypto";

export const siteRoutes = new Hono();
siteRoutes.use("*", requireAuth);

// ──────────────────────────────────────────────────────────
// Helper — log audit event for a site
// ──────────────────────────────────────────────────────────
async function audit(
  tenantId: string, userId: string, eventType: any, action: string,
  targetType: string, targetId: string, targetLabel?: string, details?: any,
) {
  try {
    await db.insert(auditLog).values({
      tenantId, eventType, severity: "info", actorType: "user", actorId: userId,
      targetType, targetId, targetLabel, action, details: details || {},
    });
  } catch (e) { /* best-effort */ }
}

// Helper — provision SharePoint-style default groups for a site
async function provisionSiteGroups(tenantId: string, siteId: string, ownerId: string, siteTitle: string) {
  const ownersGroup = (await db.insert(groups).values({
    tenantId, siteId, name: `${siteTitle} Owners`, type: "site_owners",
    description: "Has full control of the site", isSystem: true, ownedBy: ownerId, createdBy: ownerId,
  }).returning())[0];
  const membersGroup = (await db.insert(groups).values({
    tenantId, siteId, name: `${siteTitle} Members`, type: "site_members",
    description: "Can edit content", isSystem: true, ownedBy: ownerId, createdBy: ownerId,
  }).returning())[0];
  const visitorsGroup = (await db.insert(groups).values({
    tenantId, siteId, name: `${siteTitle} Visitors`, type: "site_visitors",
    description: "Can read content", isSystem: true, ownedBy: ownerId, createdBy: ownerId,
  }).returning())[0];

  await db.insert(groupMembers).values({ groupId: ownersGroup!.id, userId: ownerId, isOwner: true });
  return { ownersGroup, membersGroup, visitorsGroup };
}

// ══════════════════════════════════════════════════════════
// SITE COLLECTIONS
// ══════════════════════════════════════════════════════════

siteRoutes.get("/collections", async (c) => {
  const tenantId = c.get("tenantId");
  const collections = await db.select().from(siteCollections).where(eq(siteCollections.tenantId, tenantId));
  return c.json({ success: true, data: collections });
});

siteRoutes.post(
  "/collections",
  zValidator("json", z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    storageQuotaGb: z.number().min(1).max(25000).default(100),
    sharingCapability: z.enum([
      "disabled", "existing_internal_only", "existing_external_only",
      "existing_and_new_external", "anyone_with_link",
    ]).default("existing_internal_only"),
    sensitivityLabel: z.enum([
      "public", "general", "internal", "confidential",
      "highly_confidential", "restricted", "secret", "top_secret",
    ]).default("internal"),
    geoLocation: z.string().default("EU"),
  })),
  async (c) => {
    const tenantId = c.get("tenantId");
    const user = c.get("user");
    const body = c.req.valid("json");
    const [collection] = await db.insert(siteCollections).values({
      tenantId, name: body.name, description: body.description || null,
      storageQuotaBytes: body.storageQuotaGb * 1073741824,
      storageWarningBytes: Math.floor((body.storageQuotaGb * 1073741824 * 9) / 10),
      sharingCapability: body.sharingCapability, sensitivityLabel: body.sensitivityLabel,
      geoLocation: body.geoLocation, createdBy: user.id,
    }).returning();
    return c.json({ success: true, data: collection }, 201);
  }
);

// ══════════════════════════════════════════════════════════
// SITES — list, create, read, update, delete
// ══════════════════════════════════════════════════════════

siteRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const onlyMine = c.req.query("scope") === "mine";
  const includeArchived = c.req.query("includeArchived") === "true";
  const search = c.req.query("q");
  const type = c.req.query("type");

  const conditions: any[] = [eq(sites.tenantId, tenantId)];
  if (!includeArchived) conditions.push(or(eq(sites.status, "active"), eq(sites.status, "read_only"))!);
  if (type) conditions.push(eq(sites.type, type as any));
  if (search) conditions.push(sql`(${sites.title} ILIKE ${"%" + search + "%"} OR ${sites.description} ILIKE ${"%" + search + "%"})`);

  let results;
  if (onlyMine) {
    results = await db.select({
      id: sites.id, title: sites.title, slug: sites.slug, description: sites.description,
      type: sites.type, template: sites.template, status: sites.status, visibility: sites.visibility,
      logo: sites.logo, coverImage: sites.coverImage, isHub: sites.isHub, hubSiteId: sites.hubSiteId,
      lastActivityAt: sites.lastActivityAt, createdAt: sites.createdAt,
    }).from(sites)
      .innerJoin(siteMembers, eq(siteMembers.siteId, sites.id))
      .where(and(...conditions, eq(siteMembers.userId, user.id)))
      .orderBy(desc(sites.lastActivityAt));
  } else {
    results = await db.select({
      id: sites.id, title: sites.title, slug: sites.slug, description: sites.description,
      type: sites.type, template: sites.template, status: sites.status, visibility: sites.visibility,
      logo: sites.logo, coverImage: sites.coverImage, isHub: sites.isHub, hubSiteId: sites.hubSiteId,
      lastActivityAt: sites.lastActivityAt, createdAt: sites.createdAt,
    }).from(sites).where(and(...conditions)).orderBy(desc(sites.lastActivityAt));
  }
  return c.json({ success: true, data: results });
});

const createSiteSchema = z.object({
  collectionId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  type: z.enum(["team", "communication", "project", "wiki", "hub"]).default("team"),
  template: z.enum([
    "blank", "team", "communication", "project", "wiki", "department",
    "intranet_portal", "publishing_portal", "knowledge_base", "community",
    "search_center", "developer", "hub", "extranet", "hr_portal",
    "finance_portal", "legal_portal", "it_portal", "education_portal",
    "healthcare_portal", "government_portal",
  ]).default("team"),
  visibility: z.enum(["private", "internal", "public", "extranet"]).default("internal"),
  hubSiteId: z.string().uuid().optional(),
  isHub: z.boolean().default(false),
  language: z.string().default("ro"),
  timeZone: z.string().default("Europe/Bucharest"),
  templateId: z.string().uuid().optional(),
});

siteRoutes.post("/", zValidator("json", createSiteSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [existing] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, body.slug))).limit(1);
  if (existing) throw new AppError(409, "SLUG_TAKEN", "Un site cu acest URL există deja");

  let collectionId = body.collectionId;
  if (!collectionId) {
    const [defaultCol] = await db.select({ id: siteCollections.id }).from(siteCollections)
      .where(eq(siteCollections.tenantId, tenantId)).limit(1);
    if (defaultCol) {
      collectionId = defaultCol.id;
    } else {
      const [newCol] = await db.insert(siteCollections).values({
        tenantId, name: "Default Site Collection", createdBy: user.id,
      }).returning();
      collectionId = newCol!.id;
    }
  }

  const result = await db.transaction(async (tx) => {
    const [newSite] = await tx.insert(sites).values({
      tenantId, collectionId: collectionId!, title: body.title, slug: body.slug,
      description: body.description, type: body.type, template: body.template,
      visibility: body.visibility, hubSiteId: body.hubSiteId, isHub: body.isHub,
      defaultLanguage: body.language, timeZone: body.timeZone,
      templateId: body.templateId, primaryOwnerId: user.id, createdBy: user.id,
      navigation: [
        { id: "home", label: "Acasă", url: `/sites/${body.slug}`, icon: "home" },
        { id: "docs", label: "Documente", url: `/sites/${body.slug}/documents`, icon: "folder" },
        { id: "pages", label: "Pagini", url: `/sites/${body.slug}/pages`, icon: "file" },
        { id: "lists", label: "Liste", url: `/sites/${body.slug}/lists`, icon: "list" },
        { id: "members", label: "Membri", url: `/sites/${body.slug}/members`, icon: "users" },
      ],
    }).returning();

    await tx.insert(siteMembers).values({ siteId: newSite!.id, userId: user.id, role: "owner", addedBy: user.id });
    return newSite!;
  });

  await provisionSiteGroups(tenantId, result.id, user.id, result.title).catch(() => {});
  await audit(tenantId, user.id, "site_created", "create", "site", result.id, result.title);
  return c.json({ success: true, data: result }, 201);
});

siteRoutes.get("/:slug", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const [site] = await db.select().from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");

  const [memberCount] = await db.select({ count: count() }).from(siteMembers).where(eq(siteMembers.siteId, site.id));
  const [followerCount] = await db.select({ count: count() }).from(siteFollowers).where(eq(siteFollowers.siteId, site.id));
  return c.json({
    success: true,
    data: { ...site, memberCount: memberCount?.count || 0, followerCount: followerCount?.count || 0 },
  });
});

const updateSiteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  logo: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  siteIcon: z.string().nullable().optional(),
  headerLayout: z.string().optional(),
  headerEmphasis: z.string().optional(),
  headerBackground: z.string().nullable().optional(),
  theme: z.record(z.unknown()).optional(),
  navigation: z.array(z.any()).optional(),
  quickLaunchHidden: z.boolean().optional(),
  megaMenuEnabled: z.boolean().optional(),
  footer: z.record(z.unknown()).optional(),
  defaultLanguage: z.string().optional(),
  supportedLanguages: z.array(z.string()).optional(),
  timeZone: z.string().optional(),
  workWeek: z.record(z.unknown()).optional(),
  features: z.record(z.boolean()).optional(),
  visibility: z.enum(["private", "internal", "public", "extranet"]).optional(),
  sharingCapability: z.string().optional(),
  sensitivityLabel: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  isHub: z.boolean().optional(),
});

siteRoutes.patch("/:slug", zValidator("json", updateSiteSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const [updated] = await db.update(sites).set({ ...body, modifiedBy: user.id, updatedAt: new Date() } as any)
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await audit(tenantId, user.id, "site_modified", "update", "site", updated.id, updated.title);
  return c.json({ success: true, data: updated });
});

siteRoutes.post("/:slug/archive", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [updated] = await db.update(sites)
    .set({ status: "archived", archivedAt: new Date(), modifiedBy: user.id })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await audit(tenantId, user.id, "site_archived", "archive", "site", updated.id, updated.title);
  return c.json({ success: true, data: updated });
});

siteRoutes.post("/:slug/restore", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [updated] = await db.update(sites)
    .set({ status: "active", archivedAt: null, modifiedBy: user.id })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await audit(tenantId, user.id, "site_restored", "restore", "site", updated.id, updated.title);
  return c.json({ success: true, data: updated });
});

siteRoutes.delete("/:slug", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [updated] = await db.update(sites)
    .set({ status: "deleted", deletedAt: new Date() })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await audit(tenantId, user.id, "site_deleted", "delete", "site", updated.id, updated.title);
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// HUB associations
// ══════════════════════════════════════════════════════════

siteRoutes.post("/:slug/hub/associate", zValidator("json", z.object({
  hubSiteId: z.string().uuid(),
  inheritsTheme: z.boolean().default(true),
  inheritsNavigation: z.boolean().default(true),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const [site] = await db.select().from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await db.update(sites).set({ hubSiteId: body.hubSiteId }).where(eq(sites.id, site.id));
  await db.insert(hubAssociations).values({
    hubSiteId: body.hubSiteId, associatedSiteId: site.id,
    inheritsTheme: body.inheritsTheme, inheritsNavigation: body.inheritsNavigation, approvedBy: user.id,
  }).onConflictDoNothing();
  return c.json({ success: true });
});

siteRoutes.delete("/:slug/hub/associate", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const [site] = await db.select().from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  if (site.hubSiteId) {
    await db.delete(hubAssociations).where(and(
      eq(hubAssociations.hubSiteId, site.hubSiteId), eq(hubAssociations.associatedSiteId, site.id),
    ));
  }
  await db.update(sites).set({ hubSiteId: null }).where(eq(sites.id, site.id));
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// MEMBERS / GROUPS / FOLLOWERS / SHARING
// ══════════════════════════════════════════════════════════

siteRoutes.get("/:slug/members", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  const members = await db.select().from(siteMembers).where(eq(siteMembers.siteId, site.id));
  const siteGroups = await db.select().from(groups).where(eq(groups.siteId, site.id));
  return c.json({ success: true, data: { members, groups: siteGroups } });
});

siteRoutes.post("/:slug/members", zValidator("json", z.object({
  userId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  role: z.enum(["owner", "member", "visitor", "designer", "contributor", "reader", "limited", "approver", "hierarchy_manager", "restricted_reader", "view_only"]),
  expiresAt: z.string().datetime().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const [site] = await db.select({ id: sites.id, title: sites.title }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  if (!body.userId && !body.groupId) throw new AppError(400, "VALIDATION_ERROR", "Lipsește userId sau groupId");
  const [member] = await db.insert(siteMembers).values({
    siteId: site.id, userId: body.userId, groupId: body.groupId, role: body.role,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, addedBy: user.id,
  }).returning();
  await audit(tenantId, user.id, "permission_granted", "add_member", "site", site.id, site.title, { role: body.role });
  return c.json({ success: true, data: member }, 201);
});

siteRoutes.delete("/:slug/members/:memberId", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await db.delete(siteMembers).where(and(eq(siteMembers.id, c.req.param("memberId")), eq(siteMembers.siteId, site.id)));
  await audit(tenantId, user.id, "permission_revoked", "remove_member", "site", site.id);
  return c.json({ success: true });
});

siteRoutes.post("/:slug/follow", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await db.insert(siteFollowers).values({ siteId: site.id, userId: user.id }).onConflictDoNothing();
  return c.json({ success: true });
});

siteRoutes.delete("/:slug/follow", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  await db.delete(siteFollowers).where(and(eq(siteFollowers.siteId, site.id), eq(siteFollowers.userId, user.id)));
  return c.json({ success: true });
});

siteRoutes.get("/:slug/activity", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  const limit = parseInt(c.req.query("limit") || "50");
  const items = await db.select().from(siteActivities).where(eq(siteActivities.siteId, site.id))
    .orderBy(desc(siteActivities.createdAt)).limit(limit);
  return c.json({ success: true, data: items });
});

// ══════════════════════════════════════════════════════════
// SHARING LINKS (anonymous, internal, external)
// ══════════════════════════════════════════════════════════

siteRoutes.post("/:slug/share", zValidator("json", z.object({
  type: z.enum([
    "anonymous_view", "anonymous_edit", "internal_view", "internal_edit",
    "specific_users_view", "specific_users_edit", "embed", "review",
  ]),
  targetType: z.enum(["site", "page", "document", "list", "item"]).default("site"),
  targetId: z.string().uuid().optional(),
  password: z.string().optional(),
  requiresAuth: z.boolean().default(false),
  requiresMfa: z.boolean().default(false),
  allowedDomains: z.array(z.string()).optional(),
  allowedEmails: z.array(z.string().email()).optional(),
  blockDownload: z.boolean().default(false),
  watermark: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  const token = randomBytes(24).toString("hex");
  const [link] = await db.insert(sharingLinks).values({
    tenantId, type: body.type, targetType: body.targetType,
    targetId: body.targetId || site.id, token,
    password: body.password || null, requiresAuth: body.requiresAuth, requiresMfa: body.requiresMfa,
    allowedDomains: body.allowedDomains || [], allowedEmails: body.allowedEmails || [],
    blockDownload: body.blockDownload, watermark: body.watermark,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, maxUses: body.maxUses, createdBy: user.id,
  }).returning();
  await audit(tenantId, user.id, "share_link_created", "share", "site", site.id);
  return c.json({ success: true, data: link }, 201);
});

siteRoutes.delete("/share/:linkId", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  await db.update(sharingLinks).set({ revokedAt: new Date(), revokedBy: user.id })
    .where(and(eq(sharingLinks.id, c.req.param("linkId")), eq(sharingLinks.tenantId, tenantId)));
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// SITE TEMPLATES — reusable blueprints
// ══════════════════════════════════════════════════════════

siteRoutes.get("/templates/all", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(siteTemplates)
    .where(or(eq(siteTemplates.tenantId, tenantId), isNull(siteTemplates.tenantId))!);
  return c.json({ success: true, data: list });
});

siteRoutes.post("/templates", zValidator("json", z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  baseTemplate: z.string(),
  preview: z.string().optional(),
  definition: z.record(z.any()),
  isPublic: z.boolean().default(false),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [tpl] = await db.insert(siteTemplates).values({
    tenantId, name: body.name, description: body.description,
    category: body.category, baseTemplate: body.baseTemplate as any,
    preview: body.preview, definition: body.definition,
    isPublic: body.isPublic, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: tpl }, 201);
});

// ══════════════════════════════════════════════════════════
// DESIGNS / THEMES
// ══════════════════════════════════════════════════════════

siteRoutes.get("/designs/all", async (c) => {
  const tenantId = c.get("tenantId");
  const designs = await db.select().from(siteDesigns)
    .where(or(eq(siteDesigns.tenantId, tenantId), isNull(siteDesigns.tenantId))!);
  return c.json({ success: true, data: designs });
});

siteRoutes.post("/designs", zValidator("json", z.object({
  name: z.string(),
  description: z.string().optional(),
  isInverted: z.boolean().default(false),
  palette: z.record(z.string()),
  typography: z.record(z.unknown()).optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [d] = await db.insert(siteDesigns).values({
    tenantId, name: body.name, description: body.description,
    isInverted: body.isInverted, palette: body.palette,
    typography: body.typography || {}, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: d }, 201);
});

// ══════════════════════════════════════════════════════════
// ACCESS REQUESTS
// ══════════════════════════════════════════════════════════

siteRoutes.get("/:slug/access-requests", async (c) => {
  const tenantId = c.get("tenantId");
  const slug = c.req.param("slug");
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  const requests = await db.select().from(accessRequests).where(and(
    eq(accessRequests.tenantId, tenantId),
    eq(accessRequests.scopeType, "site"),
    eq(accessRequests.scopeId, site.id),
  )).orderBy(desc(accessRequests.createdAt));
  return c.json({ success: true, data: requests });
});

siteRoutes.post("/:slug/access-requests", zValidator("json", z.object({
  message: z.string().optional(),
  requestedRole: z.string().default("member"),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const [site] = await db.select({ id: sites.id, title: sites.title }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug))).limit(1);
  if (!site) throw new AppError(404, "NOT_FOUND", "Site negăsit");
  const [req] = await db.insert(accessRequests).values({
    tenantId, requesterId: user.id, requesterEmail: user.email,
    requesterName: `${user.firstName} ${user.lastName}`,
    scopeType: "site", scopeId: site.id, scopeLabel: site.title,
    requestedRole: body.requestedRole, message: body.message,
  }).returning();
  return c.json({ success: true, data: req }, 201);
});

siteRoutes.post("/access-requests/:id/approve", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const [req] = await db.update(accessRequests)
    .set({ status: "approved", decidedBy: user.id, decidedAt: new Date() })
    .where(and(eq(accessRequests.id, id), eq(accessRequests.tenantId, tenantId))).returning();
  if (!req) throw new AppError(404, "NOT_FOUND", "Cerere negăsită");
  if (req.scopeType === "site" && req.requesterId && req.scopeId) {
    await db.insert(siteMembers).values({
      siteId: req.scopeId, userId: req.requesterId,
      role: (req.requestedRole as any) || "member", addedBy: user.id,
    }).onConflictDoNothing();
  }
  return c.json({ success: true, data: req });
});

siteRoutes.post("/access-requests/:id/deny", zValidator("json", z.object({
  notes: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [req] = await db.update(accessRequests)
    .set({ status: "denied", decidedBy: user.id, decidedAt: new Date(), decisionNotes: body.notes })
    .where(and(eq(accessRequests.id, id), eq(accessRequests.tenantId, tenantId))).returning();
  if (!req) throw new AppError(404, "NOT_FOUND", "Cerere negăsită");
  return c.json({ success: true, data: req });
});

// ══════════════════════════════════════════════════════════
// EXTERNAL USERS (guest access)
// ══════════════════════════════════════════════════════════

siteRoutes.post("/external-users/invite", zValidator("json", z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  company: z.string().optional(),
  expiresInDays: z.number().int().positive().default(90),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);
  const [ext] = await db.insert(externalUsers).values({
    tenantId, email: body.email, displayName: body.displayName,
    company: body.company, invitedBy: user.id, expiresAt,
  }).onConflictDoNothing().returning();
  return c.json({ success: true, data: ext }, 201);
});

siteRoutes.get("/external-users/all", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(externalUsers).where(eq(externalUsers.tenantId, tenantId));
  return c.json({ success: true, data: list });
});
