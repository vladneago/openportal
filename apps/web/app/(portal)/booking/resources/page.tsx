"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  color: string;
  capacity: number;
  isActive: boolean;
  isBookableOnline: boolean;
  sortOrder: number;
}

const TABS = [
  { href: "/booking", label: "Programări" },
  { href: "/booking/calendar", label: "Calendar" },
  { href: "/booking/services", label: "Servicii" },
  { href: "/booking/resources", label: "Personal & Spații" },
  { href: "/booking/availability", label: "Program" },
  { href: "/booking/customers", label: "Clienți" },
];

const TYPE_LABELS: Record<string, string> = {
  staff: "Personal",
  room: "Spațiu",
  equipment: "Echipament",
  vehicle: "Vehicul",
  other: "Altul",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "staff",
    description: "",
    color: "#6366F1",
    capacity: 1,
    isActive: true,
    isBookableOnline: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/booking/resources`);
    if (res.success) setResources(res.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: "", type: "staff", description: "", color: "#6366F1", capacity: 1, isActive: true, isBookableOnline: true });
    setEditing(null);
  }

  function openEdit(r: Resource) {
    setEditing(r);
    setForm({
      name: r.name,
      type: r.type,
      description: r.description ?? "",
      color: r.color,
      capacity: r.capacity,
      isActive: r.isActive,
      isBookableOnline: r.isBookableOnline,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = { ...form, description: form.description || undefined };

    const res = editing
      ? await api(`/api/v1/booking/resources/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await api(`/api/v1/booking/resources`, { method: "POST", body: JSON.stringify(payload) });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi această resursă?")) return;
    await api(`/api/v1/booking/resources/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Personal & Spații
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Resursele rezervabile (angajați, scaune, camere, echipamente).
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="btn-primary"
        >
          + Resursă nouă
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/booking/resources" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/resources" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/resources" ? 500 : 400,
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
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio resursă definită. Adaugă personalul sau spațiile pentru a putea primi programări.
          </div>
        ) : (
          resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ background: r.color }}
              >
                {r.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    {r.name}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                  >
                    {TYPE_LABELS[r.type] || r.type}
                  </span>
                  {!r.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#EF444422", color: "#EF4444" }}
                    >
                      inactiv
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Capacitate: {r.capacity}
                  {r.isBookableOnline ? " · rezervabil online" : ""}
                  {r.description ? ` · ${r.description}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(r)} className="btn-secondary text-xs">
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
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
              {editing ? "Editare resursă" : "Resursă nouă"}
            </h2>

            <div className="space-y-3">
              <Field label="Nume">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="Ana Popescu / Scaun 1"
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

              <Field label="Descriere">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                  placeholder="Hairstylist senior / Sala VIP / Mașină de tuns model X"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Capacitate">
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value || "1") })}
                    className="input w-full text-sm"
                    min={1}
                  />
                </Field>
                <Field label="Culoare">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="input w-full"
                    style={{ height: 36 }}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Activ
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isBookableOnline}
                    onChange={(e) => setForm({ ...form, isBookableOnline: e.target.checked })}
                  />
                  Rezervabil online
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.name.trim() ? 0.5 : 1 }}
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
