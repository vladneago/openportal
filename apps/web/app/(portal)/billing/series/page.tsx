"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface InvoiceSeries {
  id: string;
  code: string;
  name: string;
  type: string;
  prefix: string;
  suffix: string;
  padLength: number;
  resetPolicy: string;
  nextNumber: number;
  isDefault: boolean;
  isActive: boolean;
  lastIssuedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  invoice: "Factură",
  proforma: "Proformă",
  credit_note: "Storno",
  receipt: "Bon fiscal",
  advance: "Avans",
};

const TABS = [
  { href: "/billing", label: "Facturi" },
  { href: "/billing/series", label: "Serii" },
];

export default function SeriesPage() {
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<InvoiceSeries | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "invoice",
    prefix: "",
    suffix: "",
    padLength: 4,
    resetPolicy: "yearly",
    nextNumber: 1,
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/billing/series`);
    if (res.success) setSeries(res.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      code: "",
      name: "",
      type: "invoice",
      prefix: "",
      suffix: "",
      padLength: 4,
      resetPolicy: "yearly",
      nextNumber: 1,
      isDefault: false,
      isActive: true,
    });
    setEditing(null);
  }

  function openEdit(s: InvoiceSeries) {
    setEditing(s);
    setForm({
      code: s.code,
      name: s.name,
      type: s.type,
      prefix: s.prefix,
      suffix: s.suffix,
      padLength: s.padLength,
      resetPolicy: s.resetPolicy,
      nextNumber: s.nextNumber,
      isDefault: s.isDefault,
      isActive: s.isActive,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) return;

    const res = editing
      ? await api(`/api/v1/billing/series/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) })
      : await api(`/api/v1/billing/series`, { method: "POST", body: JSON.stringify(form) });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi seria? (facturile emise nu sunt afectate)")) return;
    await api(`/api/v1/billing/series/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Serii de facturare
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Numerotare automată pentru facturi, proforme, storno-uri.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="btn-primary"
        >
          + Serie nouă
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/billing/series" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/billing/series" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/billing/series" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : series.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio serie configurată. Adaugă prima serie pentru a putea emite facturi.
          </div>
        ) : (
          series.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm font-mono" style={{ color: "var(--text)" }}>
                    {s.code}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                  >
                    {TYPE_LABELS[s.type]}
                  </span>
                  {s.isDefault && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#10B98122", color: "#10B981" }}
                    >
                      implicit
                    </span>
                  )}
                  {!s.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#EF444422", color: "#EF4444" }}
                    >
                      inactiv
                    </span>
                  )}
                </div>
                <div className="text-sm" style={{ color: "var(--text)" }}>
                  {s.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Format: {s.prefix || s.code}-{new Date().getFullYear()}-
                  {String(s.nextNumber).padStart(s.padLength, "0")}
                  {s.suffix ? `-${s.suffix}` : ""} · reset {s.resetPolicy} · următorul nr {s.nextNumber}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="btn-secondary text-xs">
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs p-1.5 rounded"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Șterge"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editing ? "Editare serie" : "Serie nouă"}
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Cod">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input w-full text-sm"
                    placeholder="FCT"
                    autoFocus
                  />
                </Field>
                <Field label="Tip">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input w-full text-sm"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Nume">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="Facturi principale 2026"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Prefix afișat">
                  <input
                    type="text"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="input w-full text-sm"
                    placeholder="FCT"
                  />
                </Field>
                <Field label="Sufix">
                  <input
                    type="text"
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Lungime cifre">
                  <input
                    type="number"
                    value={form.padLength}
                    onChange={(e) => setForm({ ...form, padLength: parseInt(e.target.value || "4") })}
                    className="input w-full text-sm"
                    min={1}
                    max={10}
                  />
                </Field>
                <Field label="Următorul nr">
                  <input
                    type="number"
                    value={form.nextNumber}
                    onChange={(e) => setForm({ ...form, nextNumber: parseInt(e.target.value || "1") })}
                    className="input w-full text-sm"
                    min={1}
                  />
                </Field>
                <Field label="Reset">
                  <select
                    value={form.resetPolicy}
                    onChange={(e) => setForm({ ...form, resetPolicy: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="yearly">Anual</option>
                    <option value="monthly">Lunar</option>
                    <option value="never">Niciodată</option>
                  </select>
                </Field>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Serie implicită
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Activă
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={!form.code.trim() || !form.name.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.code.trim() || !form.name.trim() ? 0.5 : 1 }}
              >
                {editing ? "Salvează" : "Creează"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
