import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, bookingReviews, tenants } from "@openportal/db";
import { and, eq, desc, isNotNull, sql } from "drizzle-orm";
import { AppError } from "../../middleware/error-handler";

// ─────────────────────────────────────────────
// Public review endpoints — token-authenticated, NO bearer needed.
//
// GET  /public/reviews/by-token/:token
//   Returns the review (if pending/submitted) so the customer can see
//   what they're reviewing.
//
// POST /public/reviews/by-token/:token
//   Customer submits rating + comment. Status flips to 'submitted'
//   (awaiting moderation by admin). Auto-publish if it's >= 4 stars
//   (config flag — for MVP we keep all submissions in moderation).
//
// GET  /public/reviews?tenantId=...&limit=...
//   Lists PUBLISHED reviews for a tenant. Used by site builder block
//   to show real reviews on the public salon page.
// ─────────────────────────────────────────────

export const reviewsPublicRoutes = new Hono();

// ─────────────────────────────────────────────
// GET /public/reviews/by-token/:token
// ─────────────────────────────────────────────

reviewsPublicRoutes.get("/by-token/:token", async (c) => {
  const token = c.req.param("token");
  if (token.length < 8) throw new AppError(404, "INVALID_TOKEN", "Token invalid");

  const [review] = await db
    .select()
    .from(bookingReviews)
    .where(eq(bookingReviews.token, token))
    .limit(1);

  if (!review) throw new AppError(404, "NOT_FOUND", "Review link expired or invalid");

  // Resolve tenant name for the page title
  const [tenant] = await db
    .select({ name: tenants.name, primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.id, review.tenantId))
    .limit(1);

  return c.json({
    success: true,
    data: {
      review: {
        id: review.id,
        status: review.status,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customerName,
        serviceName: review.serviceName,
        resourceName: review.resourceName,
        submittedAt: review.submittedAt,
      },
      tenant,
      alreadySubmitted: review.status !== "pending",
    },
  });
});

// ─────────────────────────────────────────────
// POST /public/reviews/by-token/:token
// ─────────────────────────────────────────────

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

reviewsPublicRoutes.post(
  "/by-token/:token",
  zValidator("json", submitSchema),
  async (c) => {
    const token = c.req.param("token");
    const body = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(bookingReviews)
      .where(eq(bookingReviews.token, token))
      .limit(1);

    if (!existing) throw new AppError(404, "NOT_FOUND", "Review link expired or invalid");

    if (existing.status !== "pending") {
      // Already submitted — return what we have idempotently
      return c.json({ success: true, data: { alreadySubmitted: true, review: existing } });
    }

    const now = new Date();
    const [updated] = await db
      .update(bookingReviews)
      .set({
        rating: body.rating,
        comment: body.comment ?? null,
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(bookingReviews.id, existing.id))
      .returning();

    return c.json({ success: true, data: { alreadySubmitted: false, review: updated } });
  },
);

// ─────────────────────────────────────────────
// GET /public/reviews?tenantId=... — for site builder block
// Returns published reviews ordered featured-first, newest-first
// ─────────────────────────────────────────────

reviewsPublicRoutes.get(
  "/",
  zValidator("query", z.object({
    tenantId: z.string().uuid(),
    limit: z.string().regex(/^\d+$/).optional(),
    minRating: z.string().regex(/^[1-5]$/).optional(),
  })),
  async (c) => {
    const { tenantId, limit, minRating } = c.req.valid("query");
    const cap = Math.min(parseInt(limit || "20"), 100);

    const conds = [
      eq(bookingReviews.tenantId, tenantId),
      eq(bookingReviews.status, "published"),
      eq(bookingReviews.showOnPublicSite, true),
      isNotNull(bookingReviews.rating),
    ];
    if (minRating) {
      const min = parseInt(minRating);
      conds.push(sql`${bookingReviews.rating} >= ${min}`);
    }

    const rows = await db
      .select({
        id: bookingReviews.id,
        rating: bookingReviews.rating,
        comment: bookingReviews.comment,
        customerName: bookingReviews.customerName,
        serviceName: bookingReviews.serviceName,
        ownerReply: bookingReviews.ownerReply,
        isFeatured: bookingReviews.isFeatured,
        publishedAt: bookingReviews.publishedAt,
      })
      .from(bookingReviews)
      .where(and(...conds))
      .orderBy(desc(bookingReviews.isFeatured), desc(bookingReviews.publishedAt))
      .limit(cap);

    return c.json({ success: true, data: rows });
  },
);
