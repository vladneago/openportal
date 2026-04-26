"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface PortalItem { id: string; title: string; slug: string; status: string; template: string; pageCount: number; customDomain: string | null; primaryColor: string; updatedAt: string; }

const STATUS = { draft: { label: "Ciornă", color: "#71717A" }, published: { label: "Publicat", color: "#10B981" }, maintenance: { label: "Mentenanță", color: "#F59E0B" } };
const TEMPLATES = { default: "Standard", corporate: "Corporate", minimal: "Minimal", government: "Administrație" };

export default function PortalAdminPage() {
  const [portalList, setPortalList] = useState<PortalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", template: "default" });

  useEffect(() => { loadPortals(); }, []);

  async function loadPortals() {
    setLoading(true);
    const res = await api("/api/v1/portal");
    if (res.success) setPortalList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
    const res = await api("/api/v1/portal", { method: "POST", body: JSON.stringify({ ...form, slug }) });
    if (res.success) { setShowCreate(false); setForm({ title: "", slug: "", template: "default" }); await loadPortals(); }
  }

  async function handlePublish(id: string) { await api(`/api/v1/portal/${id}/publish`, { method: "POST" }); await loadPortals(); }
  async function handleDelete(id: string) { await api(`/api/v1/portal/${id}`, { method: "DELETE" }); await loadPortals(); }

  if (!loading && portalList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Portal Builder</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Creează portaluri publice pentru clienți, cetățeni sau studenți</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>🌍</div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun portal creat</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează un portal public pentru utilizatori externi.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Portal nou</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Portal Builder</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{portalList.length} portaluri</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Portal nou</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Titlu portal</label>
              <input className="input" autoFocus placeholder="ex: Portal Clienți" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") })}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Template</label>
              <select className="input" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>
                <option value="default">Standard</option>
                <option value="corporate">Corporate</option>
                <option value="minimal">Minimal</option>
                <option value="government">Administrație Publică</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleCreate}>Creează</button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {portalList.map((portal) => {
          const st = STATUS[portal.status as keyof typeof STATUS] || STATUS.draft;
          return (
            <div key={portal.id} className="panel p-5 transition-all"
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg" style={{ background: portal.primaryColor + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: portal.primaryColor, fontSize: 14 }}>🌍</span>
                  </div>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {portal.status === "draft" && (
                    <button onClick={() => handlePublish(portal.id)} className="border-0 bg-transparent cursor-pointer text-[11px] font-medium px-2 py-1 rounded"
                      style={{ color: "#10B981" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#10B98110")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Publică</button>
                  )}
                  <button onClick={() => handleDelete(portal.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded"
                    style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{portal.title}</p>
              <div className="flex items-center gap-3 mt-2 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                <span>{portal.pageCount} pagini</span>
                <span>Template: {TEMPLATES[portal.template as keyof typeof TEMPLATES]}</span>
              </div>
              {portal.customDomain && <p className="text-[10.5px] mt-1" style={{ color: "var(--accent)" }}>{portal.customDomain}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
