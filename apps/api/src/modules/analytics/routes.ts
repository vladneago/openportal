import { Hono } from "hono";
import { db, tenants, users, sites, documents, documentLibraries, tables, rows, pages, forms, formSubmissions, workflows, workflowInstances, auditLogs } from "@openportal/db";
import { eq, and, count, sum, desc, gte } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const analyticsRoutes = new Hono();
analyticsRoutes.use("*", requireAuth);

// GET /analytics/overview — Full dashboard stats
analyticsRoutes.get("/overview", async (c) => {
  const tenantId = c.get("tenantId");

  const [siteCount] = await db.select({ count: count() }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.status, "active")));
  const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId));
  const [docStats] = await db.select({ count: count(), totalSize: sum(documents.sizeBytes) }).from(documents).where(and(eq(documents.tenantId, tenantId), eq(documents.status, "active")));
  const [libCount] = await db.select({ count: count() }).from(documentLibraries).where(eq(documentLibraries.tenantId, tenantId));
  const [tableCount] = await db.select({ count: count() }).from(tables).where(eq(tables.tenantId, tenantId));
  const [rowCount] = await db.select({ count: count() }).from(rows);
  const [pageCount] = await db.select({ count: count() }).from(pages).where(eq(pages.tenantId, tenantId));
  const [publishedPages] = await db.select({ count: count() }).from(pages).where(and(eq(pages.tenantId, tenantId), eq(pages.status, "published")));
  const [formCount] = await db.select({ count: count() }).from(forms).where(eq(forms.tenantId, tenantId));
  const [submissionCount] = await db.select({ count: count() }).from(formSubmissions);
  const [wfCount] = await db.select({ count: count() }).from(workflows).where(eq(workflows.tenantId, tenantId));
  const [instanceCount] = await db.select({ count: count() }).from(workflowInstances).where(eq(workflowInstances.tenantId, tenantId));

  // Recent audit log
  const recentActivity = await db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).orderBy(desc(auditLogs.createdAt)).limit(10);

  return c.json({
    success: true,
    data: {
      sites: siteCount?.count || 0,
      users: userCount?.count || 0,
      documents: docStats?.count || 0,
      storageBytes: Number(docStats?.totalSize || 0),
      libraries: libCount?.count || 0,
      tables: tableCount?.count || 0,
      tableRows: rowCount?.count || 0,
      pages: pageCount?.count || 0,
      publishedPages: publishedPages?.count || 0,
      forms: formCount?.count || 0,
      formSubmissions: submissionCount?.count || 0,
      workflows: wfCount?.count || 0,
      workflowRuns: instanceCount?.count || 0,
      recentActivity,
    },
  });
});
