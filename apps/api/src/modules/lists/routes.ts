import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db, lists, listColumns, listItems, listItemVersions, listViews,
  listFolders, listItemAttachments, contentTypes, contentTypeColumns,
  siteColumns, listContentTypes, sites, itemLikes, itemRatings,
  taggedItems, terms, auditLog,
} from "@openportal/db";
import { eq, and, or, desc, asc, sql, inArray, count, isNull } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const listRoutes = new Hono();
listRoutes.use("*", requireAuth);

// ══════════════════════════════════════════════════════════
// CONTENT TYPES
// ══════════════════════════════════════════════════════════

listRoutes.get("/content-types", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const conds: any[] = [eq(contentTypes.tenantId, tenantId)];
  if (siteId) conds.push(or(eq(contentTypes.siteId, siteId), isNull(contentTypes.siteId))!);
  const list = await db.select().from(contentTypes).where(and(...conds)).orderBy(contentTypes.name);
  return c.json({ success: true, data: list });
});

listRoutes.post("/content-types", zValidator("json", z.object({
  siteId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  group: z.string().default("Custom"),
  kind: z.enum([
    "item", "document", "folder", "page", "event", "task",
    "issue", "announcement", "discussion", "contact", "link",
    "form_response", "wiki_page", "publication", "system", "custom",
  ]).default("item"),
  parentContentTypeId: z.string().uuid().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [ct] = await db.insert(contentTypes).values({
    tenantId, ...body, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: ct }, 201);
});

listRoutes.post("/content-types/:id/columns", zValidator("json", z.object({
  columnId: z.string().uuid(),
  isRequired: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  showInDisplayForm: z.boolean().default(true),
  showInEditForm: z.boolean().default(true),
  showInNewForm: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  section: z.string().optional(),
})), async (c) => {
  const ctId = c.req.param("id");
  const body = c.req.valid("json");
  const [ctCol] = await db.insert(contentTypeColumns).values({
    contentTypeId: ctId, ...body,
  }).returning();
  return c.json({ success: true, data: ctCol }, 201);
});

// ══════════════════════════════════════════════════════════
// SITE COLUMNS — reusable column definitions
// ══════════════════════════════════════════════════════════

listRoutes.get("/site-columns", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const conds: any[] = [eq(siteColumns.tenantId, tenantId)];
  if (siteId) conds.push(or(eq(siteColumns.siteId, siteId), isNull(siteColumns.siteId))!);
  const list = await db.select().from(siteColumns).where(and(...conds)).orderBy(siteColumns.displayName);
  return c.json({ success: true, data: list });
});

listRoutes.post("/site-columns", zValidator("json", z.object({
  siteId: z.string().uuid().optional(),
  internalName: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,99}$/),
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  group: z.string().default("Custom"),
  type: z.string(),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  isReadOnly: z.boolean().default(false),
  isIndexed: z.boolean().default(false),
  isSearchable: z.boolean().default(true),
  config: z.record(z.unknown()).default({}),
  defaultValue: z.unknown().optional(),
  validationFormula: z.string().optional(),
  validationMessage: z.string().optional(),
  columnFormatJson: z.record(z.unknown()).optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [col] = await db.insert(siteColumns).values({
    tenantId, ...body, type: body.type as any,
    defaultValue: body.defaultValue as any, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: col }, 201);
});

// ══════════════════════════════════════════════════════════
// LISTS
// ══════════════════════════════════════════════════════════

listRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const template = c.req.query("template");
  const conds: any[] = [eq(lists.tenantId, tenantId)];
  if (siteId) conds.push(eq(lists.siteId, siteId));
  if (template) conds.push(eq(lists.template, template as any));
  const list = await db.select().from(lists).where(and(...conds)).orderBy(lists.title);
  return c.json({ success: true, data: list });
});

listRoutes.post("/", zValidator("json", z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  template: z.enum([
    "generic_list", "document_library", "picture_library", "asset_library",
    "form_library", "wiki_library", "site_pages_library", "calendar",
    "tasks", "contacts", "links", "announcements", "discussions",
    "issues", "events", "kpi", "report_library", "data_connection_library",
    "process_diagram_library", "translation_library", "external_list", "survey",
  ]).default("generic_list"),
  icon: z.string().optional(),
  color: z.string().optional(),
  versioningEnabled: z.boolean().default(true),
  minorVersionsEnabled: z.boolean().default(false),
  requireCheckout: z.boolean().default(false),
  contentApprovalEnabled: z.boolean().default(false),
  attachmentsEnabled: z.boolean().default(true),
  foldersEnabled: z.boolean().default(true),
  contentTypesEnabled: z.boolean().default(false),
  enableRatings: z.boolean().default(false),
  enableLikes: z.boolean().default(false),
  enableComments: z.boolean().default(true),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [existing] = await db.select({ id: lists.id }).from(lists)
    .where(and(eq(lists.siteId, body.siteId), eq(lists.slug, body.slug))).limit(1);
  if (existing) throw new AppError(409, "SLUG_TAKEN", "Există deja o listă cu acest URL");

  const result = await db.transaction(async (tx) => {
    const [newList] = await tx.insert(lists).values({
      tenantId, ...body, createdBy: user.id,
    }).returning();

    // Default columns: Title, Created, Modified
    await tx.insert(listColumns).values([
      {
        listId: newList!.id, internalName: "title", displayName: "Titlu",
        type: "single_line_text", isRequired: true, sortOrder: 0, isSystem: true,
      },
      {
        listId: newList!.id, internalName: "createdAt", displayName: "Creat",
        type: "datetime", isReadOnly: true, sortOrder: 100, isSystem: true,
      },
      {
        listId: newList!.id, internalName: "createdBy", displayName: "Creat de",
        type: "person", isReadOnly: true, sortOrder: 101, isSystem: true,
      },
      {
        listId: newList!.id, internalName: "updatedAt", displayName: "Modificat",
        type: "datetime", isReadOnly: true, sortOrder: 102, isSystem: true,
      },
    ]);

    // Default view
    await tx.insert(listViews).values({
      listId: newList!.id, title: "All Items", slug: "all",
      type: "standard", isDefault: true,
      columns: [
        { internalName: "title" }, { internalName: "createdAt" },
        { internalName: "createdBy" }, { internalName: "updatedAt" },
      ], createdBy: user.id,
    });

    return newList!;
  });

  return c.json({ success: true, data: result }, 201);
});

listRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [list] = await db.select().from(lists).where(and(eq(lists.id, id), eq(lists.tenantId, tenantId))).limit(1);
  if (!list) throw new AppError(404, "NOT_FOUND", "Listă negăsită");
  const cols = await db.select().from(listColumns).where(eq(listColumns.listId, id)).orderBy(listColumns.sortOrder);
  const views = await db.select().from(listViews).where(eq(listViews.listId, id));
  return c.json({ success: true, data: { ...list, columns: cols, views } });
});

listRoutes.patch("/:id", zValidator("json", z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isHidden: z.boolean().optional(),
  showInQuickLaunch: z.boolean().optional(),
  versioningEnabled: z.boolean().optional(),
  minorVersionsEnabled: z.boolean().optional(),
  requireCheckout: z.boolean().optional(),
  contentApprovalEnabled: z.boolean().optional(),
  attachmentsEnabled: z.boolean().optional(),
  foldersEnabled: z.boolean().optional(),
  contentTypesEnabled: z.boolean().optional(),
  enableRatings: z.boolean().optional(),
  enableLikes: z.boolean().optional(),
  enableComments: z.boolean().optional(),
  validationFormula: z.string().nullable().optional(),
  validationMessage: z.string().nullable().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [updated] = await db.update(lists).set({ ...body, modifiedBy: user.id, updatedAt: new Date() } as any)
    .where(and(eq(lists.id, id), eq(lists.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Listă negăsită");
  return c.json({ success: true, data: updated });
});

listRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(lists).where(and(eq(lists.id, c.req.param("id")), eq(lists.tenantId, tenantId)));
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// LIST COLUMNS
// ══════════════════════════════════════════════════════════

listRoutes.post("/:id/columns", zValidator("json", z.object({
  internalName: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,99}$/),
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.string(),
  config: z.record(z.unknown()).default({}),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  isReadOnly: z.boolean().default(false),
  isIndexed: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  validationFormula: z.string().optional(),
  validationMessage: z.string().optional(),
  columnFormatJson: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().default(0),
  sourceColumnId: z.string().uuid().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [col] = await db.insert(listColumns).values({
    listId: id, ...body, type: body.type as any, defaultValue: body.defaultValue as any,
  }).returning();
  return c.json({ success: true, data: col }, 201);
});

listRoutes.patch("/columns/:columnId", zValidator("json", z.object({
  displayName: z.string().optional(),
  description: z.string().nullable().optional(),
  config: z.record(z.unknown()).optional(),
  isRequired: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  isIndexed: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  validationFormula: z.string().nullable().optional(),
  validationMessage: z.string().nullable().optional(),
  columnFormatJson: z.record(z.unknown()).nullable().optional(),
  sortOrder: z.number().int().optional(),
})), async (c) => {
  const colId = c.req.param("columnId");
  const body = c.req.valid("json");
  const [updated] = await db.update(listColumns).set(body as any).where(eq(listColumns.id, colId)).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Coloană negăsită");
  return c.json({ success: true, data: updated });
});

listRoutes.delete("/columns/:columnId", async (c) => {
  await db.delete(listColumns).where(eq(listColumns.id, c.req.param("columnId")));
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// LIST ITEMS — values stored in JSONB, queried with column types
// ══════════════════════════════════════════════════════════

listRoutes.get("/:id/items", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");
  const folderId = c.req.query("folderId");
  const search = c.req.query("q");
  const status = c.req.query("status");
  const orderBy = c.req.query("orderBy") || "createdAt";
  const orderDir = c.req.query("orderDir") || "desc";
  const filterValue = c.req.query("filter");

  const conds: any[] = [eq(listItems.listId, id), eq(listItems.tenantId, tenantId)];
  if (folderId) conds.push(eq(listItems.folderId, folderId));
  else if (c.req.query("rootOnly") === "true") conds.push(isNull(listItems.folderId));
  if (status) conds.push(eq(listItems.status, status as any));
  if (search) conds.push(sql`${listItems.title} ILIKE ${"%" + search + "%"}`);

  // Apply filter on JSONB values: ?filter=col:value
  if (filterValue) {
    const [col, val] = filterValue.split(":");
    if (col && val) conds.push(sql`${listItems.values}->>${col} = ${val}`);
  }

  const orderColumn = orderBy === "title" ? listItems.title :
                      orderBy === "updatedAt" ? listItems.updatedAt :
                      listItems.createdAt;
  const ordering = orderDir === "asc" ? asc(orderColumn) : desc(orderColumn);

  const items = await db.select().from(listItems).where(and(...conds))
    .orderBy(ordering).limit(limit).offset(offset);
  const totalRow = await db.select({ total: count() }).from(listItems).where(and(...conds));
  return c.json({ success: true, data: items, meta: { total: Number(totalRow[0]?.total || 0), limit, offset } });
});

listRoutes.post("/:id/items", zValidator("json", z.object({
  title: z.string().optional(),
  values: z.record(z.unknown()).default({}),
  contentTypeId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  // get next number for this list
  const nextRow = await db.select({
    next: sql<number>`COALESCE(MAX(${listItems.listItemNumber}), 0) + 1`,
  }).from(listItems).where(eq(listItems.listId, id));
  const next = nextRow[0]?.next ?? 1;

  const result = await db.transaction(async (tx) => {
    const [item] = await tx.insert(listItems).values({
      tenantId, listId: id, listItemNumber: Number(next),
      title: body.title || (body.values?.title as string) || `Element ${next}`,
      values: body.values, contentTypeId: body.contentTypeId,
      folderId: body.folderId, status: "published", createdBy: user.id,
    }).returning();

    await tx.insert(listItemVersions).values({
      listItemId: item!.id, versionLabel: "1.0",
      versionMajor: 1, versionMinor: 0, isCurrent: true,
      title: item!.title, values: item!.values, createdBy: user.id,
    });

    await tx.update(lists).set({ itemCount: sql`${lists.itemCount} + 1` }).where(eq(lists.id, id));

    return item!;
  });

  return c.json({ success: true, data: result }, 201);
});

listRoutes.get("/:id/items/:itemId", async (c) => {
  const tenantId = c.get("tenantId");
  const { id, itemId } = c.req.param();
  const [item] = await db.select().from(listItems).where(and(
    eq(listItems.id, itemId), eq(listItems.listId, id), eq(listItems.tenantId, tenantId),
  )).limit(1);
  if (!item) throw new AppError(404, "NOT_FOUND", "Element negăsit");
  const attachments = await db.select().from(listItemAttachments).where(eq(listItemAttachments.listItemId, itemId));
  return c.json({ success: true, data: { ...item, attachments } });
});

listRoutes.patch("/:id/items/:itemId", zValidator("json", z.object({
  title: z.string().optional(),
  values: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  comment: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const { id, itemId } = c.req.param();
  const body = c.req.valid("json");
  const [item] = await db.select().from(listItems).where(and(
    eq(listItems.id, itemId), eq(listItems.tenantId, tenantId),
  )).limit(1);
  if (!item) throw new AppError(404, "NOT_FOUND", "Element negăsit");

  const newValues = body.values ? { ...(item.values as object), ...body.values } : item.values;
  const [list] = await db.select({ versioningEnabled: lists.versioningEnabled, minorVersionsEnabled: lists.minorVersionsEnabled }).from(lists).where(eq(lists.id, id)).limit(1);

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx.update(listItems).set({
      title: body.title ?? item.title,
      values: newValues as any,
      status: (body.status as any) || item.status,
      modifiedBy: user.id, updatedAt: new Date(),
      versionMajor: list?.versioningEnabled && !list?.minorVersionsEnabled ? item.versionMajor + 1 : item.versionMajor,
      versionMinor: list?.minorVersionsEnabled ? item.versionMinor + 1 : item.versionMinor,
    }).where(eq(listItems.id, itemId)).returning();

    if (list?.versioningEnabled) {
      await tx.update(listItemVersions).set({ isCurrent: false }).where(eq(listItemVersions.listItemId, itemId));
      await tx.insert(listItemVersions).values({
        listItemId: itemId,
        versionLabel: `${updated!.versionMajor}.${updated!.versionMinor}`,
        versionMajor: updated!.versionMajor, versionMinor: updated!.versionMinor,
        isCurrent: true, isMinor: list.minorVersionsEnabled || false,
        title: updated!.title, values: updated!.values,
        comment: body.comment, createdBy: user.id,
      });
    }
    return updated!;
  });

  return c.json({ success: true, data: result });
});

listRoutes.delete("/:id/items/:itemId", async (c) => {
  const tenantId = c.get("tenantId");
  const { id, itemId } = c.req.param();
  await db.delete(listItems).where(and(
    eq(listItems.id, itemId), eq(listItems.listId, id), eq(listItems.tenantId, tenantId),
  ));
  await db.update(lists).set({ itemCount: sql`GREATEST(${lists.itemCount} - 1, 0)` }).where(eq(lists.id, id));
  return c.json({ success: true });
});

listRoutes.post("/:id/items/:itemId/checkout", async (c) => {
  const user = c.get("user");
  const itemId = c.req.param("itemId");
  await db.update(listItems).set({
    checkedOutById: user.id, checkedOutAt: new Date(), status: "checked_out",
  }).where(eq(listItems.id, itemId));
  return c.json({ success: true });
});

listRoutes.post("/:id/items/:itemId/checkin", zValidator("json", z.object({
  comment: z.string().optional(),
})), async (c) => {
  const itemId = c.req.param("itemId");
  const body = c.req.valid("json");
  await db.update(listItems).set({
    checkedOutById: null, checkedOutAt: null, status: "published",
    checkInComment: body.comment,
  }).where(eq(listItems.id, itemId));
  return c.json({ success: true });
});

listRoutes.post("/:id/items/:itemId/like", async (c) => {
  const user = c.get("user");
  const itemId = c.req.param("itemId");
  await db.insert(itemLikes).values({
    targetType: "list_item", targetId: itemId, userId: user.id,
  }).onConflictDoNothing();
  await db.update(listItems).set({ likeCount: sql`${listItems.likeCount} + 1` }).where(eq(listItems.id, itemId));
  return c.json({ success: true });
});

listRoutes.delete("/:id/items/:itemId/like", async (c) => {
  const user = c.get("user");
  const itemId = c.req.param("itemId");
  await db.delete(itemLikes).where(and(
    eq(itemLikes.targetType, "list_item"),
    eq(itemLikes.targetId, itemId),
    eq(itemLikes.userId, user.id),
  ));
  await db.update(listItems).set({ likeCount: sql`GREATEST(${listItems.likeCount} - 1, 0)` }).where(eq(listItems.id, itemId));
  return c.json({ success: true });
});

listRoutes.post("/:id/items/:itemId/rate", zValidator("json", z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const itemId = c.req.param("itemId");
  const body = c.req.valid("json");
  await db.insert(itemRatings).values({
    targetType: "list_item", targetId: itemId, userId: user.id,
    rating: body.rating, review: body.review,
  }).onConflictDoUpdate({
    target: [itemRatings.targetType, itemRatings.targetId, itemRatings.userId],
    set: { rating: body.rating, review: body.review },
  });
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// VIEWS
// ══════════════════════════════════════════════════════════

listRoutes.get("/:id/views", async (c) => {
  const id = c.req.param("id");
  const v = await db.select().from(listViews).where(eq(listViews.listId, id));
  return c.json({ success: true, data: v });
});

listRoutes.post("/:id/views", zValidator("json", z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(["standard", "datasheet", "calendar", "gantt", "board", "timeline", "gallery", "tiles", "map", "chart", "pivot", "tree"]).default("standard"),
  isDefault: z.boolean().default(false),
  isPersonal: z.boolean().default(false),
  columns: z.array(z.any()).default([]),
  filters: z.array(z.any()).default([]),
  sorts: z.array(z.any()).default([]),
  groupBy: z.record(z.unknown()).default({}),
  totals: z.record(z.unknown()).default({}),
  rowLimit: z.number().int().default(30),
  typeConfig: z.record(z.unknown()).default({}),
  rowFormatting: z.record(z.unknown()).optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [v] = await db.insert(listViews).values({
    listId: id, ...body, totals: body.totals as any, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: v }, 201);
});

listRoutes.patch("/views/:viewId", zValidator("json", z.object({
  title: z.string().optional(),
  isDefault: z.boolean().optional(),
  columns: z.array(z.any()).optional(),
  filters: z.array(z.any()).optional(),
  sorts: z.array(z.any()).optional(),
  groupBy: z.record(z.unknown()).optional(),
  totals: z.record(z.unknown()).optional(),
  rowLimit: z.number().int().optional(),
  typeConfig: z.record(z.unknown()).optional(),
  rowFormatting: z.record(z.unknown()).nullable().optional(),
})), async (c) => {
  const viewId = c.req.param("viewId");
  const body = c.req.valid("json");
  const [v] = await db.update(listViews).set({ ...body, updatedAt: new Date() } as any)
    .where(eq(listViews.id, viewId)).returning();
  if (!v) throw new AppError(404, "NOT_FOUND", "Vizualizare negăsită");
  return c.json({ success: true, data: v });
});

listRoutes.delete("/views/:viewId", async (c) => {
  await db.delete(listViews).where(eq(listViews.id, c.req.param("viewId")));
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════
// FOLDERS within lists
// ══════════════════════════════════════════════════════════

listRoutes.get("/:id/folders", async (c) => {
  const id = c.req.param("id");
  const f = await db.select().from(listFolders).where(eq(listFolders.listId, id));
  return c.json({ success: true, data: f });
});

listRoutes.post("/:id/folders", zValidator("json", z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  contentTypeId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  let path = "/";
  if (body.parentId) {
    const [parent] = await db.select({ path: listFolders.path }).from(listFolders).where(eq(listFolders.id, body.parentId)).limit(1);
    if (parent) path = `${parent.path}${body.parentId}/`;
  }
  const [f] = await db.insert(listFolders).values({
    listId: id, ...body, path, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: f }, 201);
});
