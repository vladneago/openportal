"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  language: string;
  notes: string | null;
  totalAppointments: number;
  totalSpent: string;
  lastVisitAt: string | null;
  marketingConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  createdAt: string;
}

const TABS = [
  { href: "/booking", label: "Programări" },
  { href: "/booking/calendar", label: "Calendar" },
  { href: "/booking/services", label: "Servicii" },
  { href: "/booking/resources", label: "Personal & Spații" },
  { href: "/booking/availability", label: "Program" },
  { href: "/booking/customers", label: "Clienți" },
  { href: "/booking/reviews", label: "Recenzii" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    language: "ro",
    notes: "",
    marketingConsent: false,
    smsConsent: true,
    emailConsent: true,
  });

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.append("search", search);
    const res = await api(`/api/v1/booking/customers?${params}`);
    if (res.success) setCustomers(res.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      language: "ro",
      notes: "",
      marketingConsent: false,
      smsConsent: true,
      emailConsent: true,
    });
    setEditing(null);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      language: c.language,
      notes: c.notes ?? "",
      marketingConsent: c.marketingConsent,
      smsConsent: c.smsConsent,
      emailConsent: c.emailConsent,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.firstName.trim()) return;
    const payload = {
      ...form,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
    };

    const res = editing
      ? await api(`/api/v1/booking/customers/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await api(`/api/v1/booking/customers`, { method: "POST", body: JSON.stringify(payload) });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi acest client?")) return;
    await api(`/api/v1/booking/customers/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Clienți
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Baza de clienți cu istoricul programărilor și încasărilor.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="btn-primary"
        >
          + Client nou
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/booking/customers" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/customers" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/customers" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume, telefon, email…"
          className="input w-full text-sm"
        />
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Niciun client găsit." : "Niciun client încă. Adaugă primul tău client."}
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 group"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Link
                href={`/booking/customers/${c.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 no-underline"
                style={{ color: "inherit" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                >
                  {c.firstName[0]?.toUpperCase()}
                  {c.lastName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                      {c.firstName}
                      {c.lastName ? ` ${c.lastName}` : ""}
                    </span>
                    {c.totalAppointments > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "#10B98122", color: "#10B981" }}
                      >
                        {c.totalAppointments} programări
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {c.phone || "—"}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {Number(c.totalSpent).toFixed(2)} RON
                  </div>
                  {c.lastVisitAt && (
                    <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      ultima: {new Date(c.lastVisitAt).toLocaleDateString("ro-RO")}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(c)} className="btn-secondary text-xs">
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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
              {editing ? "Editare client" : "Client nou"}
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Prenume">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="input w-full text-sm"
                    autoFocus
                  />
                </Field>
                <Field label="Nume">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <Field label="Telefon">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="07XX XXX XXX"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>

              <Field label="Notițe">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input w-full text-sm"
                  rows={3}
                  placeholder="Preferințe, alergii, observații…"
                />
              </Field>

              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.smsConsent}
                    onChange={(e) => setForm({ ...form, smsConsent: e.target.checked })}
                  />
                  Acord pentru SMS (confirmări, remindere)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.emailConsent}
                    onChange={(e) => setForm({ ...form, emailConsent: e.target.checked })}
                  />
                  Acord pentru email
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.marketingConsent}
                    onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                  />
                  Acord pentru marketing
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={!form.firstName.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.firstName.trim() ? 0.5 : 1 }}
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
