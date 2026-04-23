import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, documentLibraries, folders, documents, documentVersions } from "@openportal/db";
import { eq, and, isNull, desc, count, sql, sum } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { uploadFile, generateStorageKey, getFileUrl, getFileExtension } from "../../lib/storage";

export const documentRoutes = new Hono();
documentRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// LIBRARIES
// ─────────────────────────────────────────────

// GET /documents/libraries?siteId=xxx — List libraries for a site
documentRoutes.get("/libraries", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");

  const query = siteId
    ? db.select().from(documentLibraries).where(and(eq(documentLibraries.tenantId, tenantId), eq(documentLibraries.siteId, siteId)))
    : db.select().from(documentLibraries).where(eq(documentLibraries.tenantId, tenantId));

  const results = await query.orderBy(documentLibraries.title);
  return c.json({ success: true, data: results });
});

// POST /documents/libraries — Create a library
const createLibrarySchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  versioningEnabled: z.boolean().default(true),
});

documentRoutes.post("/libraries", zValidator("json", createLibrarySchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [lib] = await db.insert(documentLibraries).values({
    tenantId,
    siteId: body.siteId,
    title: body.title,
    slug: body.slug,
    description: body.description || null,
    versioningEnabled: body.versioningEnabled,
    createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: lib }, 201);
});

// ─────────────────────────────────────────────
// FOLDERS
// ─────────────────────────────────────────────

// GET /documents/folders?libraryId=xxx&parentId=xxx — List folders
documentRoutes.get("/folders", async (c) => {
  const tenantId = c.get("tenantId");
  const libraryId = c.req.query("libraryId");
  const parentId = c.req.query("parentId");

  if (!libraryId) throw new AppError(400, "MISSING_PARAM", "libraryId is required");

  const conditions = [eq(folders.tenantId, tenantId), eq(folders.libraryId, libraryId)];
  if (parentId) {
    conditions.push(eq(folders.parentId, parentId));
  } else {
    conditions.push(isNull(folders.parentId));
  }

  const results = await db.select().from(folders).where(and(...conditions)).orderBy(folders.name);
  return c.json({ success: true, data: results });
});

// POST /documents/folders — Create a folder
const createFolderSchema = z.object({
  libraryId: z.string().uuid(),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
});

documentRoutes.post("/folders", zValidator("json", createFolderSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // Build path
  let path = "/";
  if (body.parentId) {
    const [parent] = await db.select().from(folders).where(eq(folders.id, body.parentId)).limit(1);
    if (parent) path = `${parent.path}${parent.id}/`;
  }

  const [folder] = await db.insert(folders).values({
    tenantId,
    libraryId: body.libraryId,
    name: body.name,
    parentId: body.parentId || null,
    path,
    createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: folder }, 201);
});

// ─────────────────────────────────────────────
// DOCUMENTS — List, Upload, Download, Delete
// ─────────────────────────────────────────────

// GET /documents/files?libraryId=xxx&folderId=xxx — List documents
documentRoutes.get("/files", async (c) => {
  const tenantId = c.get("tenantId");
  const libraryId = c.req.query("libraryId");
  const folderId = c.req.query("folderId");

  if (!libraryId) throw new AppError(400, "MISSING_PARAM", "libraryId is required");

  const conditions = [
    eq(documents.tenantId, tenantId),
    eq(documents.libraryId, libraryId),
    eq(documents.status, "active"),
  ];

  if (folderId) {
    conditions.push(eq(documents.folderId, folderId));
  } else {
    conditions.push(isNull(documents.folderId));
  }

  const results = await db.select().from(documents).where(and(...conditions)).orderBy(documents.name);
  return c.json({ success: true, data: results });
});

// POST /documents/files/upload — Upload a file (multipart)
documentRoutes.post("/files/upload", async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const libraryId = formData.get("libraryId") as string;
  const folderId = formData.get("folderId") as string | null;

  if (!file) throw new AppError(400, "MISSING_FILE", "No file provided");
  if (!libraryId) throw new AppError(400, "MISSING_PARAM", "libraryId is required");

  // Read file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate storage key and upload
  const storageKey = generateStorageKey(tenantId, libraryId, file.name);
  const extension = getFileExtension(file.name);

  await uploadFile(storageKey, buffer, file.type || "application/octet-stream");

  // Create document record
  const [doc] = await db.insert(documents).values({
    tenantId,
    libraryId,
    folderId: folderId || null,
    name: file.name,
    extension,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.length,
    storagePath: `documents/${storageKey}`,
    storageKey,
    createdBy: user.id,
    modifiedBy: user.id,
    currentVersion: 1,
  }).returning();

  // Create version 1
  await db.insert(documentVersions).values({
    documentId: doc!.id,
    version: 1,
    sizeBytes: buffer.length,
    storagePath: `documents/${storageKey}`,
    storageKey,
    comment: "Versiune inițială",
    createdBy: user.id,
  });

  return c.json({ success: true, data: doc }, 201);
});

// GET /documents/files/:id — Get document details
documentRoutes.get("/files/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const docId = c.req.param("id");

  const [doc] = await db.select().from(documents)
    .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
    .limit(1);

  if (!doc) throw new AppError(404, "NOT_FOUND", "Document not found");

  // Get versions
  const versions = await db.select().from(documentVersions)
    .where(eq(documentVersions.documentId, docId))
    .orderBy(desc(documentVersions.version));

  return c.json({ success: true, data: { ...doc, versions, downloadUrl: getFileUrl(doc.storageKey) } });
});

// GET /documents/files/:id/download — Download file
documentRoutes.get("/files/:id/download", async (c) => {
  const tenantId = c.get("tenantId");
  const docId = c.req.param("id");

  const [doc] = await db.select().from(documents)
    .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
    .limit(1);

  if (!doc) throw new AppError(404, "NOT_FOUND", "Document not found");

  return c.redirect(getFileUrl(doc.storageKey));
});

// DELETE /documents/files/:id — Soft delete document
documentRoutes.delete("/files/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const docId = c.req.param("id");

  const [updated] = await db.update(documents)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
    .returning();

  if (!updated) throw new AppError(404, "NOT_FOUND", "Document not found");

  return c.json({ success: true, data: { message: "Document deleted" } });
});

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

// GET /documents/stats — Storage and document counts for tenant
documentRoutes.get("/stats", async (c) => {
  const tenantId = c.get("tenantId");

  const [docStats] = await db.select({
    totalDocs: count(),
    totalSize: sum(documents.sizeBytes),
  }).from(documents).where(and(eq(documents.tenantId, tenantId), eq(documents.status, "active")));

  const [libCount] = await db.select({ count: count() })
    .from(documentLibraries).where(eq(documentLibraries.tenantId, tenantId));

  const [folderCount] = await db.select({ count: count() })
    .from(folders).where(eq(folders.tenantId, tenantId));

  return c.json({
    success: true,
    data: {
      totalDocuments: docStats?.totalDocs || 0,
      totalSizeBytes: Number(docStats?.totalSize || 0),
      totalLibraries: libCount?.count || 0,
      totalFolders: folderCount?.count || 0,
    },
  });
});
