import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";

import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenants/routes";
import { siteRoutes } from "./modules/sites/routes";
import { userRoutes } from "./modules/users/routes";
import { documentRoutes } from "./modules/documents/routes";
import { healthRoutes } from "./modules/health";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

// Global Middleware
app.use("*", requestId());
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  exposeHeaders: ["X-Request-Id"],
}));

app.onError(errorHandler);

// Health
app.route("/api/health", healthRoutes);

// API v1
const v1 = new Hono();
v1.route("/auth", authRoutes);
v1.route("/tenants", tenantRoutes);
v1.route("/sites", siteRoutes);
v1.route("/users", userRoutes);
v1.route("/documents", documentRoutes);

app.route("/api/v1", v1);

app.notFound((c) => {
  return c.json({
    success: false,
    error: { code: "NOT_FOUND", message: "The requested resource was not found" },
  }, 404);
});

const port = parseInt(process.env.API_PORT || "4000", 10);

console.log(`
╔══════════════════════════════════════════╗
║          OpenPortal API v0.2            ║
║                                          ║
║   http://localhost:${port}                  ║
║   Sprint 3: Document Libraries           ║
╚══════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });

export default app;
