"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface KnowledgeSource {
  id: string;
  title: string;
  sourceType: string;
  content: string | null;
  sourceUrl: string | null;
  fileUrl: string | null;
  status: string;
  chunkCount: number;
  widgetId: string | null;
  tags: string[];
  isActive: boolean;
  lastSyncedAt: string | null;
  updatedAt: string;
}

interface Widget {
  id: string;
  name: string;
}

const TABS = [
  { href: "/chat-widget", label: "Widgets" },
  { href: "/chat-widget/conversations", label: "Conversații" },
  { href: "/chat-widget/knowledge", label: "Knowledge base" },
];

const TYPE_LABELS: Record<string, string> = {
  manual: "Text manual",
  url: "URL extern",
  pdf: "PDF",
  docx: "DOCX",
  markdown: "Markdown",
  csv: "CSV",
  faq: "FAQ",
  service_catalog: "Catalog servicii",
  product_catalog: "Catalog produse",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  indexing: "#06B6D4",
  ready: "#10B981",
  failed: "#EF4444",
  stale: "#71717A",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  indexing: "Indexare",
  ready: "Gata",
  failed: "Eroare",
  stale: "Învechită",
};

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<KnowledgeSource | null>(null);

  const [form, setForm] = useState({
    title: "",
    sourceType: "manual" as keyof typeof TYPE_LABELS,
    content: "",
    sourceUrl: "",
    widgetId: "",
    tags: "",
    isActive: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [kRes, wRes] = await Promise.all([
      api(`/api/v1/chat-widget/knowledge`),
      api(`/api/v1/chat-widget/widgets`),
    ]);
    if (kRes.success) setSources(kRes.data || []);
    if (wRes.success) setWidgets(wRes.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", sourceType: "manual", content: "", sourceUrl: "", widgetId: "", tags: "", isActive: true });
    setEditing(null);
  }

  function openEdit(s: KnowledgeSource) {
    setEditing(s);
    setForm({
      title: s.title,
      sourceType: s.sourceType as keyof typeof TYPE_LABELS,
      content: s.content ?? "",
      sourceUrl: s.sourceUrl ?? "",
      widgetId: s.widgetId ?? "",
      tags: s.tags.join(", "),
      isActive: s.isActive,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      sourceType: form.sourceType,
      content: form.content || undefined,
      sourceUrl: form.sourceUrl || undefined,
      widgetId: form.widgetId || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };

    const res = editing
      ? await api(`/api/v1/chat-widget/knowledge/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await api(`/api/v1/chat-widget/knowledge`, { method: "POST", body: JSON.stringify(payload) });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi această sursă din knowledge base?")) return;
    await api(`/api/v1/chat-widget/knowledge/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Knowledge base
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Surse de context pentru AI: FAQ, descrieri servicii, politici, documente.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="btn-primary"
        >
          + Sursă
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/chat-widget/knowledge" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/chat-widget/knowledge" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/chat-widget/knowledge" ? 500 : 400,
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
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio sursă încă. Adaugă FAQ, descrieri servicii sau politicile firmei pentru ca AI-ul să răspundă corect.
          </div>
        ) : (
          sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    {s.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                  >
                    {TYPE_LABELS[s.sourceType] || s.sourceType}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: (STATUS_COLORS[s.status] || "#71717A") + "22",
                      color: STATUS_COLORS[s.status] || "#71717A",
                    }}
                  >
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                  {!s.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#EF444422", color: "#EF4444" }}
                    >
                      inactiv
                    </span>
                  )}
                </div>
                <div className="text-xs line-clamp-1" style={{ color: "var(--text-tertiary)" }}>
                  {s.sourceUrl || s.content?.slice(0, 150) || "—"}
                </div>
                {s.tags.length > 0 && (
                  <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {s.tags.map((t) => `#${t}`).join(" ")}
                  </div>
                )}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-lg my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editing ? "Editare sursă" : "Sursă nouă"}
            </h2>

            <div className="space-y-3">
              <Field label="Titlu">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="FAQ programări"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Tip">
                  <select
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value as keyof typeof TYPE_LABELS })}
                    className="input w-full text-sm"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Widget (opțional)">
                  <select
                    value={form.widgetId}
                    onChange={(e) => setForm({ ...form, widgetId: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="">Toate widget-urile</option>
                    {widgets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {(form.sourceType === "url" || form.sourceType === "pdf" || form.sourceType === "docx" || form.sourceType === "csv") && (
                <Field label="URL sursă">
                  <input
                    type="url"
                    value={form.sourceUrl}
                    onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              )}

              <Field label="Conținut (text manual / FAQ / Markdown)">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input w-full text-sm font-mono"
                  rows={8}
                  placeholder="Q: Care e programul?&#10;A: Lun-Vin 09-19, Sâmbătă 09-14..."
                />
              </Field>

              <Field label="Tag-uri (separate prin virgulă)">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="program, preturi, locatie"
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Activă (folosită ca context AI)
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.title.trim() ? 0.5 : 1 }}
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
