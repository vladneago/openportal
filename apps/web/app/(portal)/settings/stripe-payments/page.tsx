"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /settings/stripe-payments — owner brings their own Stripe key
// ─────────────────────────────────────────────

interface StripeSettings {
  id?: string;
  mode: "test" | "live";
  enabled: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  publishableKey: string | null;
  accountId: string | null;
  accountCountry: string | null;
  accountDefaultCurrency: string | null;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  webhookUrl: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
}

export default function StripePaymentsSettingsPage() {
  const [settings, setSettings] = useState<StripeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const [form, setForm] = useState({
    mode: "test" as "test" | "live",
    enabled: false,
    secretKey: "",
    publishableKey: "",
    webhookSecret: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<StripeSettings>("/api/v1/billing/stripe-payments/settings");
    if (res.success && res.data) {
      setSettings(res.data);
      setForm({
        mode: res.data.mode,
        enabled: res.data.enabled,
        secretKey: "",
        publishableKey: res.data.publishableKey ?? "",
        webhookSecret: "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setBanner(null);
    const res = await api("/api/v1/billing/stripe-payments/settings", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.success) {
      setBanner({ kind: "success", text: "Setări salvate" });
      // Clear sensitive fields after save (server has them now)
      setForm((f) => ({ ...f, secretKey: "", webhookSecret: "" }));
      await load();
    } else {
      setBanner({ kind: "error", text: res.error?.message ?? "Eroare la salvare" });
    }
  }

  async function test() {
    setTesting(true);
    setBanner(null);
    const res = await api<{
      ok: boolean;
      accountId?: string;
      country?: string;
      defaultCurrency?: string;
      error?: string;
    }>("/api/v1/billing/stripe-payments/test", { method: "POST" });
    setTesting(false);
    if (res.success && res.data?.ok) {
      setBanner({
        kind: "success",
        text: `Conexiune OK — cont ${res.data.accountId} (${res.data.country?.toUpperCase()}, ${res.data.defaultCurrency?.toUpperCase()})`,
      });
    } else {
      setBanner({
        kind: "error",
        text: res.data?.error ?? res.error?.message ?? "Cheia Stripe nu a fost acceptată",
      });
    }
    await load();
  }

  function copyWebhook() {
    if (settings?.webhookUrl) {
      void navigator.clipboard.writeText(settings.webhookUrl);
      setBanner({ kind: "info", text: "URL webhook copiat în clipboard" });
    }
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
          Plăți online (Stripe)
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Configurează contul tău Stripe pentru a genera link-uri de plată pe fiecare factură.
          Banii ajung direct în contul tău Stripe — platforma nu intermediază nimic.
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

      {/* Status card */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Status conexiune
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium"
            style={{
              background: settings?.enabled && settings?.hasSecretKey ? "#10B98122" : "#71717A22",
              color: settings?.enabled && settings?.hasSecretKey ? "#065F46" : "#71717A",
            }}
          >
            {settings?.enabled && settings?.hasSecretKey ? "● Conectat & activ" : "○ Neactivat"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Mod</div>
            <div style={{ color: "var(--text)" }}>{settings?.mode ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Account ID</div>
            <div className="font-mono text-xs" style={{ color: "var(--text)" }}>
              {settings?.accountId ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Țară</div>
            <div style={{ color: "var(--text)" }}>{settings?.accountCountry?.toUpperCase() ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Monedă default</div>
            <div style={{ color: "var(--text)" }}>{settings?.accountDefaultCurrency?.toUpperCase() ?? "—"}</div>
          </div>
        </div>
        {settings?.lastTestAt && (
          <div className="text-[11px] mt-3" style={{ color: "var(--text-tertiary)" }}>
            Ultim test: {fmtDate(settings.lastTestAt)} —{" "}
            <span
              style={{
                color: settings.lastTestStatus === "ok" ? "#10B981" : "#EF4444",
              }}
            >
              {settings.lastTestStatus}
            </span>
            {settings.lastTestError && <span> · {settings.lastTestError}</span>}
          </div>
        )}
      </div>

      {/* Setup instructions */}
      <div
        className="rounded-lg p-5 mb-6 text-sm"
        style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }}
      >
        <div className="font-semibold mb-2">⚙️ Cum conectezi Stripe</div>
        <ol className="list-decimal ml-5 space-y-1">
          <li>
            Mergi în <strong>dashboard.stripe.com → Developers → API Keys</strong> și creează un
            <strong> Restricted Key</strong> cu permisiuni de scriere pe Products, Prices,
            Payment Links, Checkout Sessions.
          </li>
          <li>Lipește cheia mai jos (sk_test_… sau sk_live_…) și apasă <strong>Salvează</strong>.</li>
          <li>
            Apasă <strong>Testează conexiunea</strong> ca să verificăm că am acces la contul tău.
          </li>
          <li>
            Mergi în <strong>Developers → Webhooks → Add endpoint</strong>, lipește URL-ul de mai
            jos și ascultă evenimentul <code>checkout.session.completed</code>. Copiază
            secret-ul webhook-ului și salvează-l aici jos.
          </li>
          <li>Bifează <strong>Activează plățile online</strong> și gata.</li>
        </ol>
        <div className="mt-3">
          <div className="text-[11px] mb-1">URL webhook (configurează în Stripe):</div>
          <div className="flex gap-2">
            <input
              readOnly
              value={settings?.webhookUrl ?? ""}
              className="input flex-1 text-xs font-mono"
              style={{ background: "#fff" }}
            />
            <button
              onClick={copyWebhook}
              type="button"
              className="btn-secondary text-xs whitespace-nowrap"
            >
              Copiază
            </button>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
          Credentiale Stripe
        </h2>
        <div className="space-y-3">
          <Field label="Mod">
            <div className="grid grid-cols-2 gap-2">
              {(["test", "live"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, mode: m })}
                  className="rounded-md p-2 text-left text-xs"
                  style={{
                    background: form.mode === m ? "var(--bg-subtle)" : "var(--bg)",
                    border: `1px solid ${form.mode === m ? "var(--primary)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div className="font-semibold capitalize" style={{ color: "var(--text)" }}>
                    {m === "test" ? "Test (sandbox)" : "Live (real)"}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {m === "test" ? "Folosește carduri de test 4242…" : "Plățile sunt reale!"}
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Secret API Key">
            <input
              type="password"
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
              className="input w-full text-sm font-mono"
              placeholder={settings?.hasSecretKey ? "•••••••• (salvat)" : "sk_test_…"}
            />
          </Field>

          <Field label="Publishable Key" hint="Opțional — folosit pentru integrări avansate.">
            <input
              value={form.publishableKey}
              onChange={(e) => setForm({ ...form, publishableKey: e.target.value })}
              className="input w-full text-sm font-mono"
              placeholder="pk_test_…"
            />
          </Field>

          <Field label="Webhook Signing Secret">
            <input
              type="password"
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
              className="input w-full text-sm font-mono"
              placeholder={settings?.hasWebhookSecret ? "•••••••• (salvat)" : "whsec_…"}
            />
          </Field>

          <label
            className="flex items-center gap-2 cursor-pointer text-sm"
            style={{ color: "var(--text)" }}
          >
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Activează plățile online (generare link-uri pe facturi)
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? "Se salvează…" : "Salvează"}
            </button>
            <button
              onClick={test}
              disabled={testing || !settings?.hasSecretKey}
              className="btn-secondary text-sm"
              title={!settings?.hasSecretKey ? "Salvează cheia mai întâi" : ""}
            >
              {testing ? "Se testează…" : "Testează conexiunea"}
            </button>
          </div>
        </div>
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
