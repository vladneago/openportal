"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface FormItem { id: string; title: string; slug: string; status: string; isPublic: boolean; submissionCount: number; updatedAt: string; }

const STATUS = { draft: { label: "Ciornă", color: "#71717A" }, active: { label: "Activ", color: "#10B981" }, closed: { label: "Închis", color: "#F59E0B" } };

export default function FormsPage() {
  const [formList, setFormList] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { loadForms(); }, []);

  async function loadForms() {
    setLoading(true);
    const res = await api("/api/v1/forms");
    if (res.success) setFormList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const sitesRes = await api("/api/v1/sites");
    if (!sitesRes.success || !sitesRes.data?.length) return;
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
    const res = await api("/api/v1/forms", { method: "POST", body: JSON.stringify({ siteId: sitesRes.data[0].id, title: newTitle.trim(), slug }) });
    if (res.success && res.data) {
      setShowCreate(false); setNewTitle("");
      window.location.href = `/forms/${res.data.id}/edit`;
    }
  }

  async function handleDelete(id: string) { await api(`/api/v1/forms/${id}`, { method: "DELETE" }); await loadForms(); }
  async function handlePublish(id: string) { await api(`/api/v1/forms/${id}/publish`, { method: "POST" }); await loadForms(); }

  if (!loading && formList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Formulare</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Creează formulare pentru colectarea datelor</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun formular creat</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează un formular pentru sondaje, cereri sau colectare date.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Formular nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Formulare</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{formList.length} formulare</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Formular nou
        </button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Titlul formularului</label>
            <input className="input" autoFocus placeholder="ex: Formular contact, Sondaj satisfacție..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowCreate(false); setNewTitle(""); } }} />
          </div>
          <button className="btn-primary shrink-0" onClick={handleCreate}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => { setShowCreate(false); setNewTitle(""); }}>Anulează</button>
        </div>
      )}

      <div className="panel">
        <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ gridTemplateColumns: "1fr 100px 100px 100px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span>Titlu</span><span>Status</span><span>Răspunsuri</span><span>Modificat</span><span></span>
        </div>
        {formList.map((form) => {
          const st = STATUS[form.status as keyof typeof STATUS] || STATUS.draft;
          return (
            <div key={form.id} className="grid gap-4 items-center px-4 py-3 transition-colors"
              style={{ gridTemplateColumns: "1fr 100px 100px 100px 80px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Link href={`/forms/${form.id}/edit`} className="no-underline min-w-0">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{form.title}</p>
              </Link>
              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
              <Link href={`/forms/${form.id}/responses`} className="no-underline">
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{form.submissionCount}</span>
              </Link>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{new Date(form.updatedAt).toLocaleDateString("ro-RO")}</span>
              <div className="flex items-center gap-1">
                {form.status === "draft" && (
                  <button onClick={() => handlePublish(form.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "#10B981" }} title="Publică">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  </button>
                )}
                <button onClick={() => handleDelete(form.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
