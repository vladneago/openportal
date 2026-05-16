import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  bookingAppointments,
} from "@openportal/db";
import { and, eq, gt, gte, isNull, lt, lte, or, sql } from "drizzle-orm";
import { notifyBookingReminder } from "../../lib/booking-notifications";

// ─────────────────────────────────────────────
// Background workers — invoked by a cron caller
// (Vercel Cron, GitHub Actions, system cron, etc.)
//
// Auth: a shared secret in env `WORKER_TOKEN`, sent in `X-Worker-Token`
// header or `?token=` query. In dev (no token set) the endpoint is open.
// ─────────────────────────────────────────────

export const bookingWorkerRoutes = new Hono();

bookingWorkerRoutes.use("*", async (c, next) => {
  const expected = process.env.WORKER_TOKEN;
  if (!expected) {
    // Dev mode: allow all
    return next();
  }
  const got = c.req.header("x-worker-token") || c.req.query("token");
  if (got !== expected) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid worker token" } }, 401);
  }
  return next();
});

// ─────────────────────────────────────────────
// POST /reminders/tick
//
// Finds appointments due for a 24h reminder or 2h reminder and sends emails.
// Window logic (uses NOW from server clock):
//   24h: start_at between NOW+22h and NOW+26h, reminder24hSentAt IS NULL
//   2h:  start_at between NOW+90min and NOW+150min, reminder2hSentAt IS NULL
// Only includes statuses {pending, confirmed, checked_in}. Skips cancelled/no_show/completed.
// ─────────────────────────────────────────────

const tickSchema = z.object({
  // Override "now" for testing; defaults to actual server time
  now: z.string().datetime().optional(),
  // Max number of reminders to send per tick (safety against runaway)
  limit: z.number().int().positive().max(1000).optional(),
});

bookingWorkerRoutes.post("/reminders/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const now = parsed.success && parsed.data.now ? new Date(parsed.data.now) : new Date();
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 200;

  // 24h window: anything starting between +22h and +26h
  const win24Start = new Date(now.getTime() + 22 * 60 * 60_000);
  const win24End = new Date(now.getTime() + 26 * 60 * 60_000);

  // 2h window: anything starting between +90min and +150min
  const win2Start = new Date(now.getTime() + 90 * 60_000);
  const win2End = new Date(now.getTime() + 150 * 60_000);

  const liveStatuses = sql`${bookingAppointments.status} IN ('pending','confirmed','checked_in')`;

  // Pick 24h candidates
  const due24 = await db
    .select({ id: bookingAppointments.id })
    .from(bookingAppointments)
    .where(
      and(
        gte(bookingAppointments.startAt, win24Start),
        lt(bookingAppointments.startAt, win24End),
        isNull(bookingAppointments.reminder24hSentAt),
        liveStatuses,
      ),
    )
    .limit(limit);

  // Pick 2h candidates
  const remaining = Math.max(0, limit - due24.length);
  const due2 = remaining > 0
    ? await db
        .select({ id: bookingAppointments.id })
        .from(bookingAppointments)
        .where(
          and(
            gte(bookingAppointments.startAt, win2Start),
            lt(bookingAppointments.startAt, win2End),
            isNull(bookingAppointments.reminder2hSentAt),
            liveStatuses,
          ),
        )
        .limit(remaining)
    : [];

  let sent24 = 0;
  let skipped24 = 0;
  for (const row of due24) {
    const result = await notifyBookingReminder(row.id, "24h");
    if (result.sent) sent24++;
    else skipped24++;
  }

  let sent2 = 0;
  let skipped2 = 0;
  for (const row of due2) {
    const result = await notifyBookingReminder(row.id, "2h");
    if (result.sent) sent2++;
    else skipped2++;
  }

  return c.json({
    success: true,
    data: {
      now: now.toISOString(),
      reminder24h: { candidates: due24.length, sent: sent24, skipped: skipped24 },
      reminder2h: { candidates: due2.length, sent: sent2, skipped: skipped2 },
    },
  });
});

// ─────────────────────────────────────────────
// POST /no-show/tick
//
// Auto-marks appointments as no_show when:
//   end_at < NOW - <grace period> (default 30 min)
//   status IN ('pending', 'confirmed')  -- not yet checked in
//   noShowMarkedAt IS NULL
// ─────────────────────────────────────────────

const noShowSchema = z.object({
  now: z.string().datetime().optional(),
  graceMinutes: z.number().int().min(0).max(720).optional(), // default 30
  limit: z.number().int().positive().max(1000).optional(),
});

bookingWorkerRoutes.post("/no-show/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = noShowSchema.safeParse(body);
  const now = parsed.success && parsed.data.now ? new Date(parsed.data.now) : new Date();
  const grace = parsed.success && parsed.data.graceMinutes != null ? parsed.data.graceMinutes : 30;
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 500;

  const cutoff = new Date(now.getTime() - grace * 60_000);

  const stale = await db
    .select({ id: bookingAppointments.id })
    .from(bookingAppointments)
    .where(
      and(
        lt(bookingAppointments.endAt, cutoff),
        isNull(bookingAppointments.noShowMarkedAt),
        sql`${bookingAppointments.status} IN ('pending','confirmed')`,
      ),
    )
    .limit(limit);

  let marked = 0;
  for (const row of stale) {
    await db
      .update(bookingAppointments)
      .set({
        status: "no_show",
        noShowMarkedAt: now,
        updatedAt: now,
      })
      .where(eq(bookingAppointments.id, row.id));
    marked++;
  }

  return c.json({
    success: true,
    data: {
      now: now.toISOString(),
      graceMinutes: grace,
      cutoff: cutoff.toISOString(),
      candidates: stale.length,
      marked,
    },
  });
});

// ─────────────────────────────────────────────
// GET /status
// Diagnostic — returns counts of upcoming reminders due in the next 26h.
// ─────────────────────────────────────────────

bookingWorkerRoutes.get("/status", async (c) => {
  const now = new Date();
  const horizon = new Date(now.getTime() + 26 * 60 * 60_000);

  const upcoming = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending24h: sql<number>`count(*) filter (where ${bookingAppointments.reminder24hSentAt} is null)::int`,
      pending2h: sql<number>`count(*) filter (where ${bookingAppointments.reminder2hSentAt} is null)::int`,
    })
    .from(bookingAppointments)
    .where(
      and(
        gte(bookingAppointments.startAt, now),
        lt(bookingAppointments.startAt, horizon),
        sql`${bookingAppointments.status} IN ('pending','confirmed','checked_in')`,
      ),
    );

  return c.json({
    success: true,
    data: {
      now: now.toISOString(),
      horizon: horizon.toISOString(),
      ...upcoming[0],
    },
  });
});
