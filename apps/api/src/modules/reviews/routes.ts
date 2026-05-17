import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  bookingReviews,
  bookingResources,
  bookingServices,
} from "@openportal/db";
import { and, eq, desc, count, sql, isNotNull } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

// ─────────────────────────────────────────────
// Reviews module
//
// Authenticated admin routes for listing, moderating, and replying to
// reviews. Public submit + lookup endpoints are mounted separately
// (see public.ts) since they're token-authenticated, not bearer-token.
// ─────────────────────────────────────────────

export const reviewsRoutes = new Hono();
reviewsRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /reviews — list with filter by status, ordered newest first
// ─────────────────────────────────────────────

reviewsRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const minRating = c.req.query("minRating");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(bookingReviews.tenantId, tenantId)];
  if (status) {
    conds.push(
      eq(
        bookingReviews.status,
        status as "pending" | "submitted" | "published" | "hidden" | "spam",
      ),
    );
  }
  if (minRating) {
    conds.push(sql`${bookingReviews.rating} >= ${parseInt(minRating)}`);
  }

  const rows = await db
    .select()
    .from(bookingReviews)
    .where(and(...conds))
    .orderBy(desc(bookingReviews.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(bookingReviews).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

// ─────────────────────────────────────────────
// GET /reviews/summary — aggregate stats for dashboard + customer profile
// ─────────────────────────────────────────────

reviewsRoutes.get("/summary", async (c) => {
  const tenantId = c.get("tenantId");

  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      submittedCount: sql<number>`count(*) filter (where status = 'submitted')::int`,
      publishedCount: sql<number>`count(*) filter (where status = 'published')::int`,
      pendingCount: sql<number>`count(*) filter (where status = 'pending')::int`,
      avgRating: sql<string>`coalesce(avg(rating)::numeric(3,2), 0)`,
      ratingCount: sql<number>`count(rating)::int`,
      fiveStars: sql<number>`count(*) filter (where rating = 5)::int`,
      fourStars: sql<number>`count(*) filter (where rating = 4)::int`,
      threeStars: sql<number>`count(*) filter (where rating = 3)::int`,
      twoStars: sql<number>`count(*) filter (where rating = 2)::int`,
      oneStar: sql<number>`count(*) filter (where rating = 1)::int`,
    })
    .from(bookingReviews)
    .where(eq(bookingReviews.tenantId, tenantId));

  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// PATCH /reviews/:id — moderation actions (publish, hide, spam, feature)
// + owner reply
// ─────────────────────────────────────────────

const moderationSchema = z.object({
  status: z.enum(["pending", "submitted", "published", "hidden", "spam"]).optional(),
  isFeatured: z.boolean().optional(),
  showOnPublicSite: z.boolean().optional(),
  ownerReply: z.string().max(2000).nullable().optional(),
});

reviewsRoutes.patch("/:id", zValidator("json", moderationSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.status === "published") {
    updates.publishedAt = new Date();
  }
  if (body.ownerReply !== undefined) {
    updates.ownerRepliedAt = body.ownerReply ? new Date() : null;
  }

  const [row] = await db
    .update(bookingReviews)
    .set(updates)
    .where(and(eq(bookingReviews.tenantId, tenantId), eq(bookingReviews.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Review not found");
  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// DELETE /reviews/:id — soft "delete" via status='spam' is preferred,
// but allow hard delete for admin cleanup.
// ─────────────────────────────────────────────

reviewsRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const result = await db
    .delete(bookingReviews)
    .where(and(eq(bookingReviews.tenantId, tenantId), eq(bookingReviews.id, id)))
    .returning({ id: bookingReviews.id });
  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Review not found");
  return c.json({ success: true });
});
