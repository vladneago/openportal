import { db, tenantSmsSettings, smsSends } from "@openportal/db";
import { and, eq } from "drizzle-orm";
import { assertSmsQuota } from "./plan-limits";

// ─────────────────────────────────────────────
// SMS sender — Twilio + Vonage with a stub fallback for dev / demos.
//
// Provider config lives in tenant_sms_settings. Quota is enforced via
// plan-limits.assertSmsQuota. Every send (success, failure, stub, skip)
// gets a row in sms_sends so the audit log is complete and the monthly
// counter is just a `count(*) where status in ('sent','stub')`.
//
// E.164 phone normalization: we expect Romanian numbers without country
// code (e.g. "0712345678"). Twilio and Vonage both require E.164, so we
// coerce a leading "0" to "+40…" if the number doesn't already start
// with "+".
// ─────────────────────────────────────────────

export type SmsType =
  | "test"
  | "booking_confirmation"
  | "booking_reminder_24h"
  | "booking_reminder_2h"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "marketing"
  | "other";

export interface SendSmsInput {
  tenantId: string;
  to: string;
  body: string;
  type: SmsType;
  customerId?: string;
  appointmentId?: string;
}

export interface SendSmsResult {
  success: boolean;
  status: "sent" | "stub" | "failed" | "skipped";
  provider: "twilio" | "vonage" | "stub";
  providerMessageId?: string;
  error?: string;
}

const E164_RE = /^\+\d{8,15}$/;

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/[\s\-()]/g, "");
  if (E164_RE.test(trimmed)) return trimmed;
  // Romanian fallback: "07..." → "+407..."
  if (/^0\d{9}$/.test(trimmed)) return `+4${trimmed}`;
  // Plain digits w/ leading "40" → "+40..."
  if (/^40\d{9}$/.test(trimmed)) return `+${trimmed}`;
  return null;
}

async function getSettings(tenantId: string) {
  const [row] = await db
    .select()
    .from(tenantSmsSettings)
    .where(eq(tenantSmsSettings.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

// ─────────────────────────────────────────────
// Provider drivers — minimal raw HTTP, no SDK
// ─────────────────────────────────────────────

async function sendViaTwilio(
  cfg: { accountSid: string; authToken: string; from: string },
  to: string,
  body: string,
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: cfg.from, Body: body });
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as { sid?: string; message?: string; code?: number };
    if (res.ok) return { ok: true, sid: data.sid };
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function sendViaVonage(
  cfg: { apiKey: string; apiSecret: string; from: string },
  to: string,
  body: string,
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const url = "https://rest.nexmo.com/sms/json";
  const params = new URLSearchParams({
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    to: to.replace(/^\+/, ""), // Vonage wants raw digits
    from: cfg.from,
    text: body,
  });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await res.json()) as {
      messages?: Array<{ status: string; "message-id"?: string; "error-text"?: string }>;
    };
    const m = data.messages?.[0];
    if (m?.status === "0") return { ok: true, sid: m["message-id"] };
    return { ok: false, error: m?.["error-text"] ?? `Vonage status ${m?.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─────────────────────────────────────────────
// Main entrypoint
// ─────────────────────────────────────────────

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const phone = normalizePhone(input.to);
  if (!phone) {
    await db.insert(smsSends).values({
      tenantId: input.tenantId,
      customerId: input.customerId ?? null,
      appointmentId: input.appointmentId ?? null,
      toPhone: input.to,
      body: input.body,
      type: input.type,
      status: "skipped",
      provider: "stub",
      errorMessage: "invalid_phone",
    });
    return { success: false, status: "skipped", provider: "stub", error: "invalid_phone" };
  }

  // Quota check (no-op for type='test' so the owner can verify creds)
  if (input.type !== "test") {
    try {
      await assertSmsQuota(input.tenantId, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "quota_exceeded";
      await db.insert(smsSends).values({
        tenantId: input.tenantId,
        customerId: input.customerId ?? null,
        appointmentId: input.appointmentId ?? null,
        toPhone: phone,
        body: input.body,
        type: input.type,
        status: "skipped",
        provider: "stub",
        errorMessage: "quota_exceeded",
      });
      return { success: false, status: "skipped", provider: "stub", error: msg };
    }
  }

  const settings = await getSettings(input.tenantId);
  const provider = settings?.provider ?? "stub";
  const enabled = settings?.enabled === true;

  // Stub mode: no provider configured OR explicitly disabled
  if (!settings || !enabled || provider === "stub") {
    console.log(
      `[sms:stub] tenant=${input.tenantId} to=${phone} type=${input.type} body="${input.body}"`,
    );
    await db.insert(smsSends).values({
      tenantId: input.tenantId,
      customerId: input.customerId ?? null,
      appointmentId: input.appointmentId ?? null,
      toPhone: phone,
      body: input.body,
      type: input.type,
      status: "stub",
      provider: "stub",
      sentAt: new Date(),
    });
    return { success: true, status: "stub", provider: "stub" };
  }

  const from = settings.fromIdentifier ?? "";

  let result: { ok: boolean; sid?: string; error?: string };

  if (provider === "twilio") {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      result = { ok: false, error: "twilio_credentials_missing" };
    } else {
      result = await sendViaTwilio(
        {
          accountSid: settings.twilioAccountSid,
          authToken: settings.twilioAuthToken,
          from,
        },
        phone,
        input.body,
      );
    }
  } else if (provider === "vonage") {
    if (!settings.vonageApiKey || !settings.vonageApiSecret) {
      result = { ok: false, error: "vonage_credentials_missing" };
    } else {
      result = await sendViaVonage(
        { apiKey: settings.vonageApiKey, apiSecret: settings.vonageApiSecret, from },
        phone,
        input.body,
      );
    }
  } else {
    result = { ok: false, error: `unsupported_provider:${provider}` };
  }

  await db.insert(smsSends).values({
    tenantId: input.tenantId,
    customerId: input.customerId ?? null,
    appointmentId: input.appointmentId ?? null,
    toPhone: phone,
    body: input.body,
    type: input.type,
    status: result.ok ? "sent" : "failed",
    provider,
    providerMessageId: result.sid ?? null,
    errorMessage: result.error ?? null,
    sentAt: result.ok ? new Date() : null,
  });

  return {
    success: result.ok,
    status: result.ok ? "sent" : "failed",
    provider,
    providerMessageId: result.sid,
    error: result.error,
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export { normalizePhone };

export async function smsEnabledForTenant(tenantId: string): Promise<boolean> {
  const settings = await getSettings(tenantId);
  if (!settings || !settings.enabled) return false;
  if (settings.provider === "stub") return true; // stub still "works" in dev
  if (settings.provider === "twilio") {
    return Boolean(settings.twilioAccountSid && settings.twilioAuthToken && settings.fromIdentifier);
  }
  if (settings.provider === "vonage") {
    return Boolean(settings.vonageApiKey && settings.vonageApiSecret && settings.fromIdentifier);
  }
  return false;
}
