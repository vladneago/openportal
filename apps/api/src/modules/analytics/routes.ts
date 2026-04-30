import { Hono } from "hono";
import { db, tenants, users, sites, documents, documentLibraries, tables, rows, pages, forms, formSubmissions, workflows, workflowInstances, auditLogs, chatChannels, chatMessages, calendarEvents, courses, enrollments, jobPostings, leaveRequests, projects, tasks, tickets, deals, contacts, invoices, expenses } from "@openportal/db";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const analyticsRoutes = new Hono();
analyticsRoutes.use("*", requireAuth);

analyticsRoutes.get("/overview", async (c) => {
  const tenantId = c.get("tenantId");

  // Core
  const [siteCount] = await db.select({ count: count() }).from(sites).where(and(eq(sites.tenantId, tenantId), eq(sites.status, "active")));
  const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId));
  const [docStats] = await db.select({ count: count(), totalSize: sum(documents.sizeBytes) }).from(documents).where(and(eq(documents.tenantId, tenantId), eq(documents.status, "active")));
  const [libCount] = await db.select({ count: count() }).from(documentLibraries).where(eq(documentLibraries.tenantId, tenantId));
  const [tableCount] = await db.select({ count: count() }).from(tables).where(eq(tables.tenantId, tenantId));
  const [pageCount] = await db.select({ count: count() }).from(pages).where(eq(pages.tenantId, tenantId));
  const [publishedPages] = await db.select({ count: count() }).from(pages).where(and(eq(pages.tenantId, tenantId), eq(pages.status, "published")));
  const [formCount] = await db.select({ count: count() }).from(forms).where(eq(forms.tenantId, tenantId));
  const [wfCount] = await db.select({ count: count() }).from(workflows).where(eq(workflows.tenantId, tenantId));

  // Phase 2
  const [channelCount] = await db.select({ count: count() }).from(chatChannels).where(eq(chatChannels.tenantId, tenantId));
  const [eventCount] = await db.select({ count: count() }).from(calendarEvents).where(eq(calendarEvents.tenantId, tenantId));

  // Verticals
  const [courseCount] = await db.select({ count: count() }).from(courses).where(eq(courses.tenantId, tenantId));
  const [jobCount] = await db.select({ count: count() }).from(jobPostings).where(eq(jobPostings.tenantId, tenantId));
  const [projectCount] = await db.select({ count: count() }).from(projects).where(eq(projects.tenantId, tenantId));
  const [ticketCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.tenantId, tenantId));
  const [dealCount] = await db.select({ count: count() }).from(deals).where(eq(deals.tenantId, tenantId));
  const [contactCount] = await db.select({ count: count() }).from(contacts).where(eq(contacts.tenantId, tenantId));
  const [invoiceCount] = await db.select({ count: count() }).from(invoices).where(eq(invoices.tenantId, tenantId));

  // Recent activity
  const recentActivity = await db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).orderBy(desc(auditLogs.createdAt)).limit(10);

  return c.json({
    success: true,
    data: {
      // Core
      sites: siteCount?.count || 0,
      users: userCount?.count || 0,
      documents: docStats?.count || 0,
      storageBytes: Number(docStats?.totalSize || 0),
      libraries: libCount?.count || 0,
      tables: tableCount?.count || 0,
      pages: pageCount?.count || 0,
      publishedPages: publishedPages?.count || 0,
      forms: formCount?.count || 0,
      workflows: wfCount?.count || 0,
      // Phase 2
      chatChannels: channelCount?.count || 0,
      calendarEvents: eventCount?.count || 0,
      // Verticals
      courses: courseCount?.count || 0,
      jobs: jobCount?.count || 0,
      projects: projectCount?.count || 0,
      tickets: ticketCount?.count || 0,
      deals: dealCount?.count || 0,
      contacts: contactCount?.count || 0,
      invoices: invoiceCount?.count || 0,
      // Activity
      recentActivity,
    },
  });
});
