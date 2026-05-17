"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  bufferAfterMinutes: number;
  price: string;
  currency: string;
  vatRate: string;
  color: string;
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
  { href: "/booking/reviews", label: "Recenzii" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    durationMinutes: 60,
    bufferAfterMinutes: 0,
    price: "0",
    vatRate: "19.00",
    color: "#10B981",
    isActive: true,
    isBookableOnline: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/booking/services`);
    if (res.success) setServices(res.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      description: "",
      category: "",
      durationMinutes: 60,
      bufferAfterMinutes: 0,
      price: "0",
      vatRate: "19.00",
      color: "#10B981",
      isActive: true,
      isBookableOnline: true,
    });
    setEditing(null);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      description: s.description ?? "",
      category: s.category ?? "",
      durationMinutes: s.durationMinutes,
      bufferAfterMinutes: s.bufferAfterMinutes,
      price: s.price,
      vatRate: s.vatRate,
      color: s.color,
      isActive: s.isActive,
      isBookableOnline: s.isBookableOnline,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      description: form.description || undefined,
      category: form.category || undefined,
    };

    const res = editing
      ? await api(`/api/v1/booking/services/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await api(`/api/v1/booking/services`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare la salvare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi acest serviciu?")) return;
    await api(`/api/v1/booking/services/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleActive(s: Service) {
    await api(`/api/v1/booking/services/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Servicii
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Catalogul de servicii oferite (durată, preț, buffer).
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="btn-primary"
        >
          + Serviciu nou
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/booking/services" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/services" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/services" ? 500 : 400,
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
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Niciun serviciu definit încă. Adaugă primul serviciu pentru a începe.
          </div>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="w-1 h-10 rounded-full shrink-0" style={{ background: s.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    {s.name}
                  </span>
                  {!s.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                    >
                      inactiv
                    </span>
                  )}
                  {s.isBookableOnline && s.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#10B98122", color: "#10B981" }}
                    >
                      online
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {s.durationMinutes} min
                  {s.bufferAfterMinutes > 0 ? ` (+${s.bufferAfterMinutes} min pauză)` : ""}
                  {s.category ? ` · ${s.category}` : ""}
                  {s.description ? ` · ${s.description}` : ""}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {Number(s.price).toFixed(2)} {s.currency}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  TVA {s.vatRate}%
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(s)} className="btn-secondary text-xs">
                  {s.isActive ? "Dezactivează" : "Activează"}
                </button>
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
              {editing ? "Editare serviciu" : "Serviciu nou"}
            </h2>

            <div className="space-y-3">
              <Field label="Nume">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })
                  }
                  className="input w-full text-sm"
                  placeholder="Tuns clasic"
                  autoFocus
                />
              </Field>

              <Field label="Slug (URL)">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="tuns-clasic"
                />
              </Field>

              <Field label="Categorie">
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="Coafură, Manichiură, etc."
                />
              </Field>

              <Field label="Descriere">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Durată (min)">
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value || "0") })}
                    className="input w-full text-sm"
                    min={5}
                    step={5}
                  />
                </Field>
                <Field label="Pauză după (min)">
                  <input
                    type="number"
                    value={form.bufferAfterMinutes}
                    onChange={(e) =>
                      setForm({ ...form, bufferAfterMinutes: parseInt(e.target.value || "0") })
                    }
                    className="input w-full text-sm"
                    min={0}
                    step={5}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Preț (RON)">
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="TVA %">
                  <select
                    value={form.vatRate}
                    onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="0.00">0% (scutit)</option>
                    <option value="5.00">5%</option>
                    <option value="9.00">9%</option>
                    <option value="19.00">19% (standard)</option>
                  </select>
                </Field>
              </div>

              <Field label="Culoare">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input w-full"
                  style={{ height: 36 }}
                />
              </Field>

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
