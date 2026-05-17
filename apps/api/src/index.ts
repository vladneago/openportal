import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";

import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenants/routes";
import { siteRoutes } from "./modules/sites/routes";
import { listRoutes } from "./modules/lists/routes";
import { userRoutes } from "./modules/users/routes";
import { documentRoutes } from "./modules/documents/routes";
import { tableRoutes } from "./modules/tables/routes";
import { pageRoutes } from "./modules/pages/routes";
import { commentRoutes } from "./modules/comments/routes";
import { notificationRoutes } from "./modules/notifications/routes";
import { formRoutes } from "./modules/forms/routes";
import { workflowRoutes } from "./modules/workflows/routes";
import { analyticsRoutes } from "./modules/analytics/routes";
import { chatRoutes } from "./modules/chat/routes";
import { calendarRoutes } from "./modules/calendar/routes";
import { portalRoutes } from "./modules/portal/routes";
import { educationRoutes } from "./modules/education/routes";
import { hrRoutes } from "./modules/hr/routes";
import { projectRoutes } from "./modules/projects/routes";
import { supportRoutes } from "./modules/support/routes";
import { crmRoutes } from "./modules/crm/routes";
import { financeRoutes } from "./modules/finance/routes";
import { governmentRoutes } from "./modules/government/routes";
import { legalRoutes } from "./modules/legal/routes";
import { healthcareRoutes } from "./modules/healthcare/routes";
import { realestateRoutes } from "./modules/realestate/routes";
import { eventsRoutes } from "./modules/events/routes";
import { itopsRoutes } from "./modules/itops/routes";
import { bookingRoutes } from "./modules/booking/routes";
import { billingRoutes } from "./modules/billing/routes";
import { posRoutes } from "./modules/pos/routes";
import { siteBuilderRoutes } from "./modules/site-builder/routes";
import { siteBuilderPublicRoutes } from "./modules/site-builder/public";
import { bookingPublicRoutes } from "./modules/booking/public";
import { bookingWorkerRoutes } from "./modules/workers/booking";
import { stripeWebhookRoutes } from "./modules/workers/stripe";
import { efacturaWorkerRoutes } from "./modules/workers/efactura";
import { billingReminderRoutes } from "./modules/workers/billing-reminders";
import { reviewWorkerRoutes } from "./modules/workers/reviews";
import { reviewsRoutes } from "./modules/reviews/routes";
import { reviewsPublicRoutes } from "./modules/reviews/public";
import { marketingRoutes } from "./modules/marketing/routes";
import { marketingWorkerRoutes } from "./modules/workers/marketing";
import { platformBillingRoutes } from "./modules/billing/platform";
import { anafRoutes } from "./modules/billing/anaf";
import { chatWidgetRoutes } from "./modules/chat-widget/routes";
import { apiDocsRoutes } from "./modules/api-docs/routes";
import { healthRoutes } from "./modules/health";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();
app.use("*", requestId());
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true, allowMethods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowHeaders: ["Content-Type","Authorization","X-Tenant-ID"], exposeHeaders: ["X-Request-Id"] }));
app.onError(errorHandler);

// Health & Docs (no auth)
app.route("/api/health", healthRoutes);
app.route("/api/docs", apiDocsRoutes);

// API v1 (authenticated)
const v1 = new Hono();
v1.route("/auth", authRoutes); v1.route("/tenants", tenantRoutes); v1.route("/sites", siteRoutes);
v1.route("/lists", listRoutes);
v1.route("/users", userRoutes); v1.route("/documents", documentRoutes); v1.route("/tables", tableRoutes);
v1.route("/pages", pageRoutes); v1.route("/comments", commentRoutes); v1.route("/notifications", notificationRoutes);
v1.route("/forms", formRoutes); v1.route("/workflows", workflowRoutes); v1.route("/analytics", analyticsRoutes);
v1.route("/chat", chatRoutes); v1.route("/calendar", calendarRoutes); v1.route("/portal", portalRoutes);
v1.route("/education", educationRoutes); v1.route("/hr", hrRoutes); v1.route("/projects", projectRoutes);
v1.route("/support", supportRoutes); v1.route("/crm", crmRoutes); v1.route("/finance", financeRoutes);
v1.route("/government", governmentRoutes); v1.route("/legal", legalRoutes); v1.route("/healthcare", healthcareRoutes);
v1.route("/realestate", realestateRoutes); v1.route("/events", eventsRoutes); v1.route("/itops", itopsRoutes);
v1.route("/booking", bookingRoutes);
v1.route("/booking/reviews", reviewsRoutes);
v1.route("/marketing", marketingRoutes);
v1.route("/billing", billingRoutes);
v1.route("/billing/platform", platformBillingRoutes);
v1.route("/billing/anaf", anafRoutes);
v1.route("/pos", posRoutes);
v1.route("/site-builder", siteBuilderRoutes);
v1.route("/chat-widget", chatWidgetRoutes);
app.route("/api/v1", v1);

// Public (no-auth) routes for serving websites + customer-facing booking
app.route("/api/v1/public/site-builder", siteBuilderPublicRoutes);
app.route("/api/v1/public/booking", bookingPublicRoutes);
app.route("/api/v1/public/reviews", reviewsPublicRoutes);

// Internal worker endpoints (cron-driven, secured by WORKER_TOKEN)
app.route("/api/v1/internal/booking", bookingWorkerRoutes);
app.route("/api/v1/internal/efactura", efacturaWorkerRoutes);
app.route("/api/v1/internal/billing", billingReminderRoutes);
app.route("/api/v1/internal/reviews", reviewWorkerRoutes);
app.route("/api/v1/internal/marketing", marketingWorkerRoutes);
// Stripe webhook (signature-verified, not WORKER_TOKEN)
app.route("/api/v1/internal/stripe", stripeWebhookRoutes);

app.notFound((c) => c.json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } }, 404));
const port = parseInt(process.env.API_PORT || "4000", 10);
console.log(`
╔══════════════════════════════════════════════════╗
║         OpenPortal API v1.2 — COMPLETE           ║
║                                                  ║
║   API:   http://localhost:${port}                    ║
║   Docs:  http://localhost:${port}/api/docs/ui        ║
║   Spec:  http://localhost:${port}/api/docs           ║
║                                                  ║
║   27 modules · 15 verticals · All industries     ║
╚══════════════════════════════════════════════════╝
`);
serve({ fetch: app.fetch, port });
export default app;
