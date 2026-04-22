import type { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { db, users, sessions, tenants } from "@openportal/db";
import { eq, and } from "drizzle-orm";
import { AppError } from "./error-handler";
import type { AuthUser } from "@openportal/shared";

// Extend Hono context with auth user
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    tenantId: string;
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "openportal-dev-secret-change-in-production"
);

/**
 * Middleware that requires authentication.
 * Extracts the JWT from the Authorization header, verifies it,
 * and attaches the user and tenantId to the context.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const userId = payload.sub as string;
    const tenantId = payload.tid as string;

    if (!userId || !tenantId) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token payload");
    }

    // Verify user still exists and is active
    const [user] = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatar: users.avatar,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "User not found");
    }

    if (user.status !== "active") {
      throw new AppError(403, "FORBIDDEN", "Account is not active");
    }

    // Attach user to context
    c.set("user", user as AuthUser);
    c.set("tenantId", tenantId);

    await next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

/**
 * Middleware that requires admin role.
 */
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get("user");
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    throw new AppError(403, "FORBIDDEN", "Administrator access required");
  }
  await next();
}

/**
 * Middleware that requires owner role.
 */
export async function requireOwner(c: Context, next: Next) {
  const user = c.get("user");
  if (!user || user.role !== "owner") {
    throw new AppError(403, "FORBIDDEN", "Owner access required");
  }
  await next();
}
