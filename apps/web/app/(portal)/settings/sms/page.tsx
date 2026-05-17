"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /settings/sms — provider config + test send + log
// ─────────────────────────────────────────────

interface SmsSettings {
  id?: string;
  provider: "twilio" | "vonage" | "stub";
  enabled: boolean;
  fromIdentifier: string;
  hasTwilioCreds: boolean;
  hasVonageCreds: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
}

interface SmsLog {
  id: string;
  toPhone: string;
  body: string;
  type: string;
  status: string;
  provider: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface SmsSummary {
  sent: number;
  stub: number;
  failed: number;
  skipped: number;
  sentThisMonth: number;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
}

const TYPE_LABELS: Record<string, string> = {
  test: "Test",
  booking_confirmation: "Confirmare",
  booking_reminder_24h: "Reminder 24h",
  booking_reminder_2h: "Reminder 2h",
  booking_cancelled: "Anulare",
  booking_rescheduled: "Reprogramare",
  marketing: "Marketing",
  other: "Alte",
};

const STATUS_COLORS: Record<string, string> = {
  sent: "#10B981",
  stub: "#8B5CF6",
  failed: "#EF4444",
  skipped: "#71717A",
  queued: "#F59E0B",
};

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [summary, setSummary] = useState<SmsSummary | null>(null);
  const [log, setLog] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    provider: "stub" as "twilio" | "vonage" | "stub",
    enabled: false,
    fromIdentifier: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    vonageApiKey: "",
    vonageApiSecret: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, sumRes, logRes] = await Promise.all([
      api<SmsSettings>("/api/v1/sms/settings"),
      api<SmsSummary>("/api/v1/sms/summary"),
      api<SmsLog[]>("/api/v1/sms/log?limit=20"),
    ]);
    if (sRes.success && sRes.data) {
      setSettings(sRes.data);
      setForm((prev) => ({
        ...prev,
        provider: sRes.data!.provider,
        enabled: sRes.data!.enabled,
        fromIdentifier: sRes.data!.fromIdentifier,
        // Don't preload secrets — UI shows ••••• if present
        twilioAccountSid: "",
        twilioAuthToken: "",
        vonageApiKey: "",
        vonageApiSecret: "",
      }));
    }
    if (sumRes.success) setSummary(sumRes.data || null);
    if (logRes.success) setLog((logRes.data as SmsLog[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setBanner(null);
    const res = await api("/api/v1/sms/settings", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.success) {
      setBanner({ kind: "success", text: "Setări salvate" });
      await load();
    } else {
      setBanner({ kind: "error", text: res.error?.message ?? "Eroare la salvare" });
    }
  }

  async function sendTest() {
    if (!testPhone) {
      setBanner({ kind: "error", text: "Introdu un număr de telefon pentru test" });
      return;
    }
    setTesting(true);
    setBanner(null);
    const res = await api<{ success: boolean; status: string; error?: string }>(
      "/api/v1/sms/test",
      { method: "POST", body: JSON.stringify({ toPhone: testPhone }) },
    );
    setTesting(false);
    if (res.success && res.data?.success) {
      setBanner({
        kind: res.data.status === "stub" ? "info" : "success",
        text:
          res.data.status === "stub"
            ? "Trimis în mod stub (provider neactivat) — vezi log-ul"
            : "SMS test trimis cu succes",
      });
    } else {
      setBanner({
        kind: "error",
        text: res.data?.error ?? res.error?.message ?? "SMS-ul nu a putut fi trimis",
      });
    }
    await load();
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Se încarcă…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/settings/abonament"
          className="text-xs no-underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          ← Setări
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
          SMS
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Configurează provider-ul SMS pentru confirmări și remindere către clienți. În planul tău
          curent ai {summary?.sentThisMonth ?? 0} SMS-uri folosite luna aceasta.
        </p>
      </div>

      {banner && (
        <div
          className="rounded-md p-3 mb-4 text-sm"
          style={{
            background:
              banner.kind === "success"
                ? "#ECFDF5"
                : banner.kind === "error"
                ? "#FEF2F2"
                : "#EFF6FF",
            color:
              banner.kind === "success"
                ? "#065F46"
                : banner.kind === "error"
                ? "#991B1B"
                : "#1E40AF",
            border: `1px solid ${
              banner.kind === "success"
                ? "#A7F3D0"
                : banner.kind === "error"
                ? "#FECACA"
                : "#BFDBFE"
            }`,
          }}
        >
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Trimise total" value={summary?.sent ?? 0} accent="#10B981" />
        <KpiCard label="Mod stub (dev)" value={summary?.stub ?? 0} accent="#8B5CF6" />
        <KpiCard
          label="Eșuate"
          value={summary?.failed ?? 0}
          accent={(summary?.failed ?? 0) > 0 ? "#EF4444" : undefined}
        />
      </div>

      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
          Provider
        </h2>
        <div className="space-y-3">
          <Field label="Provider">
            <div className="grid grid-cols-3 gap-2">
              {(["stub", "twilio", "vonage"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, provider: p })}
                  className="rounded-md p-3 text-left text-xs"
                  style={{
                    background: form.provider === p ? "var(--bg-subtle)" : "var(--bg)",
                    border: `1px solid ${
                      form.provider === p ? "var(--primary)" : "var(--border)"
                    }`,
                    cursor: "pointer",
                  }}
                >
                  <div className="font-semibold capitalize" style={{ color: "var(--text)" }}>
                    {p === "stub" ? "Dev / Stub" : p}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {p === "stub"
                      ? "Logare locală (nu se trimite nimic)"
                      : p === "twilio"
                      ? "twilio.com — ~$0.05/SMS RO"
                      : "vonage.com — ~$0.04/SMS RO"}
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="From (identificator expeditor)"
            hint='Twilio: număr E.164 ("+40712345678"). Vonage: text până la 11 caractere, ex. "SalonLuna".'
          >
            <input
              value={form.fromIdentifier}
              onChange={(e) => setForm({ ...form, fromIdentifier: e.target.value })}
              className="input w-full text-sm"
              placeholder={form.provider === "twilio" ? "+40712345678" : "SalonLuna"}
            />
          </Field>

          {form.provider === "twilio" && (
            <>
              <Field label="Twilio Account SID">
                <input
                  value={form.twilioAccountSid}
                  onChange={(e) => setForm({ ...form, twilioAccountSid: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder={settings?.hasTwilioCreds ? "•••••••• (salvat)" : "ACxxxxxxxx"}
                />
              </Field>
              <Field label="Twilio Auth Token">
                <input
                  type="password"
                  value={form.twilioAuthToken}
                  onChange={(e) => setForm({ ...form, twilioAuthToken: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder={settings?.hasTwilioCreds ? "•••••••• (salvat)" : ""}
                />
              </Field>
            </>
          )}

          {form.provider === "vonage" && (
            <>
              <Field label="Vonage API Key">
                <input
                  value={form.vonageApiKey}
                  onChange={(e) => setForm({ ...form, vonageApiKey: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder={settings?.hasVonageCreds ? "•••••••• (salvat)" : ""}
                />
              </Field>
              <Field label="Vonage API Secret">
                <input
                  type="password"
                  value={form.vonageApiSecret}
                  onChange={(e) => setForm({ ...form, vonageApiSecret: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder={settings?.hasVonageCreds ? "•••••••• (salvat)" : ""}
                />
              </Field>
            </>
          )}

          <label
            className="flex items-center gap-2 cursor-pointer text-sm"
            style={{ color: "var(--text)" }}
          >
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Activează trimiterea automată de SMS-uri (confirmări + remindere)
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
          Test SMS
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
          Trimite un SMS de test către un număr de telefon. În modul stub, vei vedea mesajul în log
          local fără să se trimită nimic real.
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="0712345678 sau +40712345678"
            className="input flex-1 text-sm"
          />
          <button
            onClick={sendTest}
            disabled={testing || !testPhone}
            className="btn-secondary text-sm whitespace-nowrap"
          >
            {testing ? "Se trimite…" : "Trimite test"}
          </button>
        </div>
        {settings?.lastTestAt && (
          <div className="text-[11px] mt-2" style={{ color: "var(--text-tertiary)" }}>
            Ultimul test: {fmtDate(settings.lastTestAt)} — status:{" "}
            <span
              style={{
                color: STATUS_COLORS[settings.lastTestStatus ?? ""] ?? "var(--text-tertiary)",
              }}
            >
              {settings.lastTestStatus}
            </span>
            {settings.lastTestError && (
              <span style={{ color: "#DC2626" }}> · {settings.lastTestError}</span>
            )}
          </div>
        )}
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Log SMS (ultimele 20)
          </h2>
        </div>
        {log.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Niciun SMS trimis încă.
          </div>
        ) : (
          log.map((r) => (
            <div
              key={r.id}
              className="px-4 py-3 flex items-start gap-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {r.toPhone}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: (STATUS_COLORS[r.status] || "#71717A") + "22",
                      color: STATUS_COLORS[r.status] || "#71717A",
                    }}
                  >
                    {r.status}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)" }}
                  >
                    {TYPE_LABELS[r.type] || r.type}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {r.body}
                </div>
                {r.errorMessage && (
                  <div className="text-[11px] mt-1" style={{ color: "#DC2626" }}>
                    Eroare: {r.errorMessage}
                  </div>
                )}
              </div>
              <div className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>
                {fmtDate(r.sentAt ?? r.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
        {label}
      </label>
      {hint && (
        <div className="text-[11px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color: accent ?? "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
