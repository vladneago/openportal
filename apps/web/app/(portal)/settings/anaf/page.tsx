"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /settings/anaf — connect ANAF e-Factura
// ─────────────────────────────────────────────

interface AnafSettings {
  anafEnabled: boolean;
  connected: boolean;
  environment: "test" | "prod";
  cui: string | null;
  legalName: string | null;
  registrationNumber: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  countryCode: string | null;
  iban: string | null;
  bank: string | null;
  tokenExpiresAt: string | null;
  lastConnectedAt: string | null;
  lastErrorMessage: string | null;
}

function formatDateRO(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" });
}

export default function AnafSettingsPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<AnafSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    cui: "",
    registrationNumber: "",
    legalName: "",
    address: "",
    city: "",
    county: "",
    countryCode: "RO",
    postalCode: "",
    iban: "",
    bank: "",
    environment: "test" as "test" | "prod",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<AnafSettings>("/api/v1/billing/anaf/settings");
    if (res.success && res.data) {
      setSettings(res.data);
      setForm({
        cui: res.data.cui ?? "",
        registrationNumber: res.data.registrationNumber ?? "",
        legalName: res.data.legalName ?? "",
        address: res.data.address ?? "",
        city: res.data.city ?? "",
        county: res.data.county ?? "",
        countryCode: res.data.countryCode ?? "RO",
        postalCode: "",
        iban: res.data.iban ?? "",
        bank: res.data.bank ?? "",
        environment: res.data.environment,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setBanner({ kind: "success", text: "Cont ANAF conectat cu succes" });
    }
    const err = searchParams.get("error");
    if (err) setBanner({ kind: "error", text: `Eroare conectare ANAF: ${err}` });
  }, [searchParams]);

  async function saveIdentity() {
    if (!form.cui || !form.legalName) {
      setBanner({ kind: "error", text: "CUI și denumirea legală sunt obligatorii" });
      return;
    }
    setSaving(true);
    const res = await api("/api/v1/billing/anaf/settings", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.success) {
      setBanner({ kind: "success", text: "Date fiscale salvate" });
      await load();
    } else {
      setBanner({ kind: "error", text: res.error?.message ?? "Eroare la salvare" });
    }
  }

  async function startOauth() {
    setBusy("oauth");
    const res = await api<{ stub: boolean; authorizeUrl?: string; message?: string }>(
      "/api/v1/billing/anaf/oauth/start",
      { method: "POST" },
    );
    setBusy(null);
    if (!res.success) {
      setBanner({ kind: "error", text: res.error?.message ?? "Eroare" });
      return;
    }
    if (res.data?.stub) {
      setBanner({ kind: "success", text: res.data.message || "Conectat în mod stub" });
      await load();
    } else if (res.data?.authorizeUrl) {
      window.location.href = res.data.authorizeUrl;
    }
  }

  async function disconnect() {
    if (!confirm("Sigur deconectezi contul ANAF? Facturile noi nu vor mai putea fi trimise automat.")) return;
    setBusy("disconnect");
    const res = await api("/api/v1/billing/anaf/oauth/disconnect", { method: "POST" });
    setBusy(null);
    if (res.success) {
      setBanner({ kind: "info", text: "Cont deconectat" });
      await load();
    }
  }

  if (loading) {
    return <div style={{ padding: 32 }}>Se încarcă…</div>;
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>ANAF e-Factura</h1>
        <p style={{ color: "#64748B", fontSize: 14 }}>
          Conectează contul ANAF pentru a trimite automat facturile către SPV (Spațiul Privat Virtual).
        </p>
      </div>

      {banner && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            fontSize: 14,
            background: banner.kind === "success" ? "#ECFDF5" : banner.kind === "error" ? "#FEF2F2" : "#EFF6FF",
            color: banner.kind === "success" ? "#065F46" : banner.kind === "error" ? "#991B1B" : "#1E40AF",
            border: `1px solid ${banner.kind === "success" ? "#A7F3D0" : banner.kind === "error" ? "#FECACA" : "#BFDBFE"}`,
          }}
        >
          {banner.text}
        </div>
      )}

      {/* Connection card */}
      <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Status conexiune</h2>
            <p style={{ color: "#64748B", fontSize: 13 }}>
              {settings?.anafEnabled
                ? "ANAF este configurat pe acest mediu. Apasă Conectează pentru a autoriza."
                : "ANAF_CLIENT_ID nu este configurat în mediul curent — modul stub activ (facturi se vor accepta automat fără trimitere reală)."}
            </p>
          </div>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: settings?.connected ? "#D1FAE5" : "#FEE2E2",
              color: settings?.connected ? "#065F46" : "#991B1B",
            }}
          >
            {settings?.connected ? "Conectat" : "Neconectat"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, fontSize: 13 }}>
          <div>
            <div style={{ color: "#64748B", marginBottom: 2 }}>Mediu</div>
            <div style={{ fontWeight: 600 }}>{settings?.environment === "prod" ? "Producție" : "Test"}</div>
          </div>
          <div>
            <div style={{ color: "#64748B", marginBottom: 2 }}>Token expiră</div>
            <div style={{ fontWeight: 600 }}>{formatDateRO(settings?.tokenExpiresAt ?? null)}</div>
          </div>
          <div>
            <div style={{ color: "#64748B", marginBottom: 2 }}>Ultima conectare</div>
            <div style={{ fontWeight: 600 }}>{formatDateRO(settings?.lastConnectedAt ?? null)}</div>
          </div>
          {settings?.lastErrorMessage && (
            <div>
              <div style={{ color: "#DC2626", marginBottom: 2 }}>Ultima eroare</div>
              <div style={{ fontSize: 12, color: "#991B1B" }}>{settings.lastErrorMessage}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!settings?.connected ? (
            <button
              onClick={startOauth}
              disabled={busy === "oauth"}
              style={{
                padding: "10px 16px",
                background: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: busy === "oauth" ? "wait" : "pointer",
              }}
            >
              {busy === "oauth" ? "Se conectează…" : settings?.anafEnabled ? "Conectează cont ANAF" : "Activează (stub)"}
            </button>
          ) : (
            <button
              onClick={disconnect}
              disabled={busy === "disconnect"}
              style={{
                padding: "10px 16px",
                background: "white",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Deconectează
            </button>
          )}
        </div>
      </div>

      {/* Fiscal identity card */}
      <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Date fiscale emitent</h2>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>
          Aceste date apar pe facturi și sunt trimise împreună cu XML-ul UBL către ANAF.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="CUI (fără RO)" required>
            <input
              value={form.cui}
              onChange={(e) => setForm({ ...form, cui: e.target.value })}
              placeholder="12345678"
              style={inputStyle}
            />
          </Field>
          <Field label="Nr. Registrul Comerțului">
            <input
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              placeholder="J40/12345/2020"
              style={inputStyle}
            />
          </Field>
          <Field label="Denumire legală" required>
            <input
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              placeholder="OpenPortal SRL"
              style={inputStyle}
            />
          </Field>
          <Field label="Mediu ANAF">
            <select
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value as "test" | "prod" })}
              style={inputStyle}
            >
              <option value="test">Test (sandbox)</option>
              <option value="prod">Producție</option>
            </select>
          </Field>
          <Field label="Adresă" wide>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Str. Exemplu nr. 1"
              style={inputStyle}
            />
          </Field>
          <Field label="Localitate">
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="București"
              style={inputStyle}
            />
          </Field>
          <Field label="Județ (cod sau nume)">
            <input
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
              placeholder="B sau București"
              style={inputStyle}
            />
          </Field>
          <Field label="IBAN">
            <input
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              placeholder="RO49 AAAA …"
              style={inputStyle}
            />
          </Field>
          <Field label="Bancă">
            <input
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              placeholder="Banca Transilvania"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button
            onClick={saveIdentity}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#0F172A",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Se salvează…" : "Salvează date fiscale"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ gridColumn: wide ? "1 / span 2" : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #CBD5E1",
  borderRadius: 6,
  fontSize: 14,
  outline: "none",
};
