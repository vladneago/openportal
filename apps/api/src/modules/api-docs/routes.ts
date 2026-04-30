import { Hono } from "hono";

export const apiDocsRoutes = new Hono();

const API_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "OpenPortal API",
    version: "1.2.0",
    description: "Enterprise collaboration platform — 27 modules, all industries. Open-source alternative to SharePoint.",
    contact: { name: "OpenPortal", url: "https://openportal.app" },
    license: { name: "AGPL-3.0", url: "https://www.gnu.org/licenses/agpl-3.0.html" },
  },
  servers: [
    { url: "http://localhost:4000", description: "Development" },
    { url: "https://api.openportal.app", description: "Production" },
  ],
  tags: [
    { name: "Auth", description: "Authentication & registration" },
    { name: "Tenants", description: "Organization management" },
    { name: "Sites", description: "Collaboration sites" },
    { name: "Users", description: "User management" },
    { name: "Documents", description: "Document libraries, folders, files, versioning" },
    { name: "Tables", description: "Structured data tables with typed columns" },
    { name: "Pages", description: "Content pages with block editor" },
    { name: "Comments", description: "Universal comments on any resource" },
    { name: "Notifications", description: "In-app notifications" },
    { name: "Forms", description: "Form builder with 13 field types" },
    { name: "Workflows", description: "Visual automation builder" },
    { name: "Analytics", description: "Platform-wide statistics" },
    { name: "Chat", description: "Channels, messages, reactions" },
    { name: "Calendar", description: "Events, attendees, recurring" },
    { name: "Portal", description: "External portal builder" },
    { name: "Education", description: "LMS — courses, modules, lessons, enrollments" },
    { name: "HR", description: "Jobs, applications, leave requests" },
    { name: "Projects", description: "Project management with Kanban" },
    { name: "Support", description: "Ticketing system with KB" },
    { name: "CRM", description: "Companies, contacts, deal pipeline" },
    { name: "Finance", description: "Invoices, expenses, budgets" },
    { name: "Government", description: "Citizen requests, decisions, services" },
    { name: "Legal", description: "Cases, contracts, time tracking" },
    { name: "Healthcare", description: "Patients, appointments, records" },
    { name: "Real Estate", description: "Properties, viewings" },
    { name: "Events", description: "Event management, sessions, registrations" },
    { name: "IT/DevOps", description: "Incidents, changes, assets, status page" },
  ],
  paths: {
    // Auth
    "/api/v1/auth/register": {
      post: { tags: ["Auth"], summary: "Register new organization", requestBody: { content: { "application/json": { schema: { type: "object", required: ["firstName", "lastName", "email", "password", "tenantName", "tenantSlug"], properties: { firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 }, tenantName: { type: "string" }, tenantSlug: { type: "string" } } } } } }, responses: { "201": { description: "Organization created" } } },
    },
    "/api/v1/auth/login": {
      post: { tags: ["Auth"], summary: "Login", requestBody: { content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } } }, responses: { "200": { description: "JWT tokens returned" } } },
    },
    "/api/v1/auth/me": {
      get: { tags: ["Auth"], summary: "Get current user", security: [{ bearerAuth: [] }], responses: { "200": { description: "Current user data" } } },
    },
    // Sites
    "/api/v1/sites": {
      get: { tags: ["Sites"], summary: "List sites", security: [{ bearerAuth: [] }], responses: { "200": { description: "Array of sites" } } },
      post: { tags: ["Sites"], summary: "Create site", security: [{ bearerAuth: [] }], responses: { "201": { description: "Site created" } } },
    },
    // Documents
    "/api/v1/documents/libraries": { get: { tags: ["Documents"], summary: "List document libraries", security: [{ bearerAuth: [] }] }, post: { tags: ["Documents"], summary: "Create library", security: [{ bearerAuth: [] }] } },
    "/api/v1/documents/folders": { get: { tags: ["Documents"], summary: "List folders", security: [{ bearerAuth: [] }] }, post: { tags: ["Documents"], summary: "Create folder", security: [{ bearerAuth: [] }] } },
    "/api/v1/documents/files": { get: { tags: ["Documents"], summary: "List files", security: [{ bearerAuth: [] }] } },
    "/api/v1/documents/files/upload": { post: { tags: ["Documents"], summary: "Upload file (multipart)", security: [{ bearerAuth: [] }] } },
    // Tables
    "/api/v1/tables": { get: { tags: ["Tables"], summary: "List tables", security: [{ bearerAuth: [] }] }, post: { tags: ["Tables"], summary: "Create table with default columns", security: [{ bearerAuth: [] }] } },
    "/api/v1/tables/{id}/rows": { get: { tags: ["Tables"], summary: "List rows", security: [{ bearerAuth: [] }] }, post: { tags: ["Tables"], summary: "Create row", security: [{ bearerAuth: [] }] } },
    // Pages
    "/api/v1/pages": { get: { tags: ["Pages"], summary: "List pages", security: [{ bearerAuth: [] }] }, post: { tags: ["Pages"], summary: "Create page", security: [{ bearerAuth: [] }] } },
    "/api/v1/pages/{id}/publish": { post: { tags: ["Pages"], summary: "Publish page", security: [{ bearerAuth: [] }] } },
    // Forms
    "/api/v1/forms": { get: { tags: ["Forms"], summary: "List forms", security: [{ bearerAuth: [] }] }, post: { tags: ["Forms"], summary: "Create form", security: [{ bearerAuth: [] }] } },
    "/api/v1/forms/{id}/fields": { post: { tags: ["Forms"], summary: "Add field to form", security: [{ bearerAuth: [] }] } },
    "/api/v1/forms/{id}/submissions": { get: { tags: ["Forms"], summary: "List submissions", security: [{ bearerAuth: [] }] }, post: { tags: ["Forms"], summary: "Submit form", security: [{ bearerAuth: [] }] } },
    // Workflows
    "/api/v1/workflows": { get: { tags: ["Workflows"], summary: "List workflows", security: [{ bearerAuth: [] }] }, post: { tags: ["Workflows"], summary: "Create workflow", security: [{ bearerAuth: [] }] } },
    "/api/v1/workflows/{id}/run": { post: { tags: ["Workflows"], summary: "Execute workflow", security: [{ bearerAuth: [] }] } },
    // Chat
    "/api/v1/chat/channels": { get: { tags: ["Chat"], summary: "List channels", security: [{ bearerAuth: [] }] }, post: { tags: ["Chat"], summary: "Create channel", security: [{ bearerAuth: [] }] } },
    "/api/v1/chat/channels/{channelId}/messages": { get: { tags: ["Chat"], summary: "List messages", security: [{ bearerAuth: [] }] }, post: { tags: ["Chat"], summary: "Send message", security: [{ bearerAuth: [] }] } },
    // Calendar
    "/api/v1/calendar/events": { get: { tags: ["Calendar"], summary: "List events (date range)", security: [{ bearerAuth: [] }] }, post: { tags: ["Calendar"], summary: "Create event", security: [{ bearerAuth: [] }] } },
    // Education
    "/api/v1/education/courses": { get: { tags: ["Education"], summary: "List courses", security: [{ bearerAuth: [] }] }, post: { tags: ["Education"], summary: "Create course", security: [{ bearerAuth: [] }] } },
    "/api/v1/education/courses/{courseId}/enroll": { post: { tags: ["Education"], summary: "Enroll in course", security: [{ bearerAuth: [] }] } },
    // HR
    "/api/v1/hr/jobs": { get: { tags: ["HR"], summary: "List job postings", security: [{ bearerAuth: [] }] }, post: { tags: ["HR"], summary: "Create job posting", security: [{ bearerAuth: [] }] } },
    "/api/v1/hr/leaves": { get: { tags: ["HR"], summary: "List leave requests", security: [{ bearerAuth: [] }] }, post: { tags: ["HR"], summary: "Request leave", security: [{ bearerAuth: [] }] } },
    // Projects
    "/api/v1/projects": { get: { tags: ["Projects"], summary: "List projects", security: [{ bearerAuth: [] }] }, post: { tags: ["Projects"], summary: "Create project", security: [{ bearerAuth: [] }] } },
    "/api/v1/projects/{projectId}/tasks": { post: { tags: ["Projects"], summary: "Create task", security: [{ bearerAuth: [] }] } },
    // Support
    "/api/v1/support/tickets": { get: { tags: ["Support"], summary: "List tickets", security: [{ bearerAuth: [] }] }, post: { tags: ["Support"], summary: "Create ticket", security: [{ bearerAuth: [] }] } },
    // CRM
    "/api/v1/crm/deals": { get: { tags: ["CRM"], summary: "List deals", security: [{ bearerAuth: [] }] }, post: { tags: ["CRM"], summary: "Create deal", security: [{ bearerAuth: [] }] } },
    "/api/v1/crm/contacts": { get: { tags: ["CRM"], summary: "List contacts", security: [{ bearerAuth: [] }] }, post: { tags: ["CRM"], summary: "Create contact", security: [{ bearerAuth: [] }] } },
    "/api/v1/crm/pipeline": { get: { tags: ["CRM"], summary: "Pipeline summary", security: [{ bearerAuth: [] }] } },
    // Finance
    "/api/v1/finance/invoices": { get: { tags: ["Finance"], summary: "List invoices", security: [{ bearerAuth: [] }] }, post: { tags: ["Finance"], summary: "Create invoice", security: [{ bearerAuth: [] }] } },
    "/api/v1/finance/expenses": { get: { tags: ["Finance"], summary: "List expenses", security: [{ bearerAuth: [] }] }, post: { tags: ["Finance"], summary: "Create expense", security: [{ bearerAuth: [] }] } },
    // Government
    "/api/v1/government/requests": { get: { tags: ["Government"], summary: "List citizen requests", security: [{ bearerAuth: [] }] }, post: { tags: ["Government"], summary: "Register citizen request", security: [{ bearerAuth: [] }] } },
    "/api/v1/government/decisions": { get: { tags: ["Government"], summary: "List decisions", security: [{ bearerAuth: [] }] }, post: { tags: ["Government"], summary: "Create decision", security: [{ bearerAuth: [] }] } },
    // Legal
    "/api/v1/legal/cases": { get: { tags: ["Legal"], summary: "List cases", security: [{ bearerAuth: [] }] }, post: { tags: ["Legal"], summary: "Create case", security: [{ bearerAuth: [] }] } },
    "/api/v1/legal/contracts": { get: { tags: ["Legal"], summary: "List contracts", security: [{ bearerAuth: [] }] } },
    "/api/v1/legal/time-entries": { get: { tags: ["Legal"], summary: "List time entries", security: [{ bearerAuth: [] }] }, post: { tags: ["Legal"], summary: "Log time", security: [{ bearerAuth: [] }] } },
    // Healthcare
    "/api/v1/healthcare/patients": { get: { tags: ["Healthcare"], summary: "List patients", security: [{ bearerAuth: [] }] }, post: { tags: ["Healthcare"], summary: "Register patient", security: [{ bearerAuth: [] }] } },
    "/api/v1/healthcare/appointments": { get: { tags: ["Healthcare"], summary: "List appointments", security: [{ bearerAuth: [] }] }, post: { tags: ["Healthcare"], summary: "Create appointment", security: [{ bearerAuth: [] }] } },
    // Real Estate
    "/api/v1/realestate/properties": { get: { tags: ["Real Estate"], summary: "List properties", security: [{ bearerAuth: [] }] }, post: { tags: ["Real Estate"], summary: "Create property", security: [{ bearerAuth: [] }] } },
    // Events
    "/api/v1/events": { get: { tags: ["Events"], summary: "List managed events", security: [{ bearerAuth: [] }] }, post: { tags: ["Events"], summary: "Create event", security: [{ bearerAuth: [] }] } },
    "/api/v1/events/{id}/register": { post: { tags: ["Events"], summary: "Register for event", security: [{ bearerAuth: [] }] } },
    // IT/DevOps
    "/api/v1/itops/incidents": { get: { tags: ["IT/DevOps"], summary: "List incidents", security: [{ bearerAuth: [] }] }, post: { tags: ["IT/DevOps"], summary: "Create incident", security: [{ bearerAuth: [] }] } },
    "/api/v1/itops/changes": { get: { tags: ["IT/DevOps"], summary: "List change requests", security: [{ bearerAuth: [] }] }, post: { tags: ["IT/DevOps"], summary: "Create change request", security: [{ bearerAuth: [] }] } },
    "/api/v1/itops/assets": { get: { tags: ["IT/DevOps"], summary: "List IT assets", security: [{ bearerAuth: [] }] }, post: { tags: ["IT/DevOps"], summary: "Register asset", security: [{ bearerAuth: [] }] } },
    "/api/v1/itops/status": { get: { tags: ["IT/DevOps"], summary: "Status page services", security: [{ bearerAuth: [] }] } },
    // Analytics & Health
    "/api/v1/analytics/overview": { get: { tags: ["Analytics"], summary: "Platform overview statistics", security: [{ bearerAuth: [] }] } },
    "/api/health": { get: { tags: ["Health"], summary: "Health check", responses: { "200": { description: "Service healthy" } } } },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};

// GET /api/docs — Return OpenAPI spec
apiDocsRoutes.get("/", (c) => {
  return c.json(API_SPEC);
});

// GET /api/docs/ui — Swagger UI HTML
apiDocsRoutes.get("/ui", (c) => {
  const html = `<!DOCTYPE html>
<html><head><title>OpenPortal API Documentation</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css"/>
</head><body>
<div id="swagger-ui"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/docs', dom_id: '#swagger-ui', deepLinking: true, presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset] })</script>
</body></html>`;
  return c.html(html);
});
