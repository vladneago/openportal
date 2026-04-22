import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tenants, users, sessions } from "@openportal/db";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../../lib/password";
import { generateTokenPair } from "../../lib/jwt";
import { AppError } from "../../middleware/error-handler";
import { requireAuth } from "../../middleware/auth";
import { nanoid } from "nanoid";

export const authRoutes = new Hono();

// ─────────────────────────────────────────────
// POST /auth/register — Register new tenant + owner
// ─────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  tenantName: z.string().min(2, "Organization name must be at least 2 characters").max(255),
  tenantSlug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

  // Validate password strength
  const pwCheck = validatePasswordStrength(body.password);
  if (!pwCheck.valid) {
    throw new AppError(400, "WEAK_PASSWORD", pwCheck.errors.join(". "));
  }

  // Check if tenant slug is taken
  const [existingTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, body.tenantSlug))
    .limit(1);

  if (existingTenant) {
    throw new AppError(409, "SLUG_TAKEN", "This organization URL is already taken");
  }

  // Check if email is already used (across all tenants for now)
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(body.password);

  // Create tenant and owner user in a transaction
  const result = await db.transaction(async (tx) => {
    // Create tenant
    const [newTenant] = await tx
      .insert(tenants)
      .values({
        name: body.tenantName,
        slug: body.tenantSlug,
        plan: "free",
        enabledModules: [],
      })
      .returning();

    // Create owner user
    const [newUser] = await tx
      .insert(users)
      .values({
        tenantId: newTenant!.id,
        email: body.email.toLowerCase(),
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: `${body.firstName} ${body.lastName}`,
        role: "owner",
        status: "active",
        emailVerified: false,
      })
      .returning();

    return { tenant: newTenant!, user: newUser! };
  });

  // Generate tokens
  const tokenPair = await generateTokenPair({
    sub: result.user.id,
    tid: result.tenant.id,
    email: result.user.email,
    role: result.user.role,
  });

  return c.json({
    success: true,
    data: {
      tokens: tokenPair,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    },
  }, 201);
});

// ─────────────────────────────────────────────
// POST /auth/login — Login with email & password
// ─────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().optional(), // Optional: if user belongs to multiple tenants
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const body = c.req.valid("json");

  // Find user by email
  const userQuery = db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      passwordHash: users.passwordHash,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatar: users.avatar,
      role: users.role,
      status: users.status,
      tenantSlug: tenants.slug,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.email, body.email.toLowerCase()));

  // If tenantSlug is provided, filter by it
  const results = body.tenantSlug
    ? await userQuery.where(and(eq(users.email, body.email.toLowerCase()), eq(tenants.slug, body.tenantSlug)))
    : await userQuery;

  if (results.length === 0) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Use first result (or the one matching tenantSlug)
  const user = results[0]!;

  if (!user.passwordHash) {
    throw new AppError(401, "SSO_ONLY", "This account uses SSO. Please login through your identity provider.");
  }

  // Verify password
  const isValid = await verifyPassword(body.password, user.passwordHash);
  if (!isValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Your account is not active. Contact your administrator.");
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), lastActiveAt: new Date() })
    .where(eq(users.id, user.id));

  // Generate tokens
  const tokenPair = await generateTokenPair({
    sub: user.id,
    tid: user.tenantId,
    email: user.email,
    role: user.role,
  });

  return c.json({
    success: true,
    data: {
      tokens: tokenPair,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
      tenant: {
        id: user.tenantId,
        name: user.tenantName,
        slug: user.tenantSlug,
      },
    },
  });
});

// ─────────────────────────────────────────────
// GET /auth/me — Get current user
// ─────────────────────────────────────────────

authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const tenantId = c.get("tenantId");

  // Get tenant info
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, plan: tenants.plan, logo: tenants.logo })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return c.json({
    success: true,
    data: { user, tenant },
  });
});

// ─────────────────────────────────────────────
// POST /auth/logout — Logout (client-side token removal)
// ─────────────────────────────────────────────

authRoutes.post("/logout", requireAuth, async (c) => {
  // For JWT-based auth, logout is primarily client-side
  // In the future we can add token blacklisting via Redis
  return c.json({ success: true, data: { message: "Logged out successfully" } });
});
