import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  billingInvoices,
  billingInvoiceLines,
  efacturaSubmissions,
  tenantAnafCredentials,
} from "@openportal/db";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { generateUblXml } from "../../lib/ubl-invoice";
import { uploadInvoice, pollStatus } from "../../lib/anaf";

// ─────────────────────────────────────────────
// e-Factura ANAF worker
//
// Invoked by cron (system cron, Vercel Cron, GitHub Actions). Two ticks:
//
//   POST /submit/tick — Picks queued submissions, generates UBL XML,
//                       uploads to ANAF SPV, stores uploadId.
//   POST /poll/tick   — Picks submitted (in-flight) submissions, asks
//                       ANAF for status, marks accepted/rejected.
//
// Auth via shared `X-Worker-Token` (env WORKER_TOKEN). In dev (no
// token configured) the endpoints are open.
//
// Dev fallback: when ANAF_CLIENT_ID is not configured, anaf.ts uses
// stub responses so the whole pipeline can be exercised locally.
// ─────────────────────────────────────────────

export const efacturaWorkerRoutes = new Hono();

efacturaWorkerRoutes.use("*", async (c, next) => {
  const expected = process.env.WORKER_TOKEN;
  if (!expected) return next();
  const got = c.req.header("x-worker-token") || c.req.query("token");
  if (got !== expected) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid worker token" } }, 401);
  }
  return next();
});

const tickSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
});

// ─────────────────────────────────────────────
// POST /submit/tick
// ─────────────────────────────────────────────

efacturaWorkerRoutes.post("/submit/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 50;

  const queued = await db
    .select()
    .from(efacturaSubmissions)
    .where(eq(efacturaSubmissions.status, "queued"))
    .limit(limit);

  let submitted = 0;
  let failed = 0;
  const errors: Array<{ submissionId: string; message: string }> = [];

  for (const sub of queued) {
    try {
      // Ensure tenant has ANAF creds (else we can still stub-mode submit)
      const [creds] = await db
        .select()
        .from(tenantAnafCredentials)
        .where(eq(tenantAnafCredentials.tenantId, sub.tenantId))
        .limit(1);

      // In prod (ANAF_CLIENT_ID set), refuse to submit if tenant hasn't connected
      if (process.env.ANAF_CLIENT_ID && (!creds?.accessToken || !creds.cui)) {
        await db
          .update(efacturaSubmissions)
          .set({
            status: "error",
            errorCode: "NO_ANAF_CREDS",
            errorMessage: "Tenant has not connected ANAF account",
            updatedAt: new Date(),
          })
          .where(eq(efacturaSubmissions.id, sub.id));
        await db
          .update(billingInvoices)
          .set({ efacturaStatus: "error", efacturaErrorMessage: "Tenant has not connected ANAF account", updatedAt: new Date() })
          .where(eq(billingInvoices.id, sub.invoiceId));
        failed++;
        continue;
      }

      // Load invoice + lines
      const [invoice] = await db
        .select()
        .from(billingInvoices)
        .where(eq(billingInvoices.id, sub.invoiceId))
        .limit(1);
      if (!invoice) throw new Error(`Invoice ${sub.invoiceId} not found`);

      const lines = await db
        .select()
        .from(billingInvoiceLines)
        .where(eq(billingInvoiceLines.invoiceId, invoice.id));

      if (!invoice.issuerTaxId) {
        throw new Error("Issuer CUI missing — cannot generate UBL");
      }

      // Generate UBL XML
      const xml = generateUblXml({ invoice, lines });

      // Submit to ANAF
      const result = await uploadInvoice(sub.tenantId, xml);

      const now = new Date();
      await db
        .update(efacturaSubmissions)
        .set({
          status: "submitted",
          uploadId: result.uploadId,
          xmlPayload: xml,
          xmlResponse: result.rawResponse,
          submittedAt: now,
          updatedAt: now,
        })
        .where(eq(efacturaSubmissions.id, sub.id));

      await db
        .update(billingInvoices)
        .set({
          efacturaStatus: "submitted",
          efacturaUploadId: result.uploadId,
          efacturaSubmittedAt: now,
          efacturaErrorMessage: null,
          updatedAt: now,
        })
        .where(eq(billingInvoices.id, invoice.id));

      submitted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ submissionId: sub.id, message });
      await db
        .update(efacturaSubmissions)
        .set({
          status: "error",
          errorCode: "SUBMIT_FAILED",
          errorMessage: message,
          attemptNumber: sub.attemptNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(efacturaSubmissions.id, sub.id));
      await db
        .update(billingInvoices)
        .set({ efacturaStatus: "error", efacturaErrorMessage: message, updatedAt: new Date() })
        .where(eq(billingInvoices.id, sub.invoiceId));
      failed++;
    }
  }

  return c.json({
    success: true,
    data: { candidates: queued.length, submitted, failed, errors: errors.slice(0, 10) },
  });
});

// ─────────────────────────────────────────────
// POST /poll/tick
// ─────────────────────────────────────────────

efacturaWorkerRoutes.post("/poll/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 100;

  const inflight = await db
    .select()
    .from(efacturaSubmissions)
    .where(
      and(
        inArray(efacturaSubmissions.status, ["submitted", "in_processing"]),
        sql`${efacturaSubmissions.uploadId} IS NOT NULL`,
      ),
    )
    .limit(limit);

  let accepted = 0;
  let rejected = 0;
  let stillProcessing = 0;
  let errored = 0;
  const errors: Array<{ submissionId: string; message: string }> = [];

  for (const sub of inflight) {
    try {
      if (!sub.uploadId) continue;
      const status = await pollStatus(sub.tenantId, sub.uploadId);
      const now = new Date();

      if (status.state === "accepted") {
        await db
          .update(efacturaSubmissions)
          .set({
            status: "accepted",
            indexId: status.indexId,
            acceptedAt: now,
            xmlResponse: status.rawResponse,
            updatedAt: now,
          })
          .where(eq(efacturaSubmissions.id, sub.id));
        await db
          .update(billingInvoices)
          .set({
            efacturaStatus: "accepted",
            efacturaIndexId: status.indexId,
            efacturaAcceptedAt: now,
            updatedAt: now,
          })
          .where(eq(billingInvoices.id, sub.invoiceId));
        accepted++;
      } else if (status.state === "rejected") {
        await db
          .update(efacturaSubmissions)
          .set({
            status: "rejected",
            rejectedAt: now,
            errorCode: "ANAF_REJECTED",
            errorMessage: status.message,
            xmlResponse: status.rawResponse,
            updatedAt: now,
          })
          .where(eq(efacturaSubmissions.id, sub.id));
        await db
          .update(billingInvoices)
          .set({
            efacturaStatus: "rejected",
            efacturaErrorMessage: status.message,
            updatedAt: now,
          })
          .where(eq(billingInvoices.id, sub.invoiceId));
        rejected++;
      } else if (status.state === "processing") {
        await db
          .update(efacturaSubmissions)
          .set({
            status: "in_processing",
            xmlResponse: status.rawResponse,
            updatedAt: now,
          })
          .where(eq(efacturaSubmissions.id, sub.id));
        await db
          .update(billingInvoices)
          .set({ efacturaStatus: "in_processing", updatedAt: now })
          .where(eq(billingInvoices.id, sub.invoiceId));
        stillProcessing++;
      } else {
        // unknown / error state — just record raw response
        await db
          .update(efacturaSubmissions)
          .set({ xmlResponse: status.rawResponse, errorMessage: status.message, updatedAt: now })
          .where(eq(efacturaSubmissions.id, sub.id));
        errored++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ submissionId: sub.id, message });
      errored++;
    }
  }

  return c.json({
    success: true,
    data: {
      candidates: inflight.length,
      accepted,
      rejected,
      stillProcessing,
      errored,
      errors: errors.slice(0, 10),
    },
  });
});

// ─────────────────────────────────────────────
// GET /status — diagnostic counts
// ─────────────────────────────────────────────

efacturaWorkerRoutes.get("/status", async (c) => {
  const rows = await db
    .select({
      status: efacturaSubmissions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(efacturaSubmissions)
    .groupBy(efacturaSubmissions.status);

  return c.json({
    success: true,
    data: {
      counts: Object.fromEntries(rows.map((r) => [r.status, r.count])),
    },
  });
});
