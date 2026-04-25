"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface WfItem { id: string; title: string; description: string | null; status: string; trigger: any; steps: any[]; instanceCount: number; updatedAt: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Ciornă", color: "#71717A" }, active: { label: "Activ", color: "#10B981" },
  paused: { label: "Pauză", color: "#F59E0B" }, archived: { label: "Arhivat", color: "#A1A1AA" },
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual", on_create: "La creare", on_update: "La modificare", on_delete: "La ștergere",
  scheduled: "Programat", form_submit: "La submit formular", document_upload: "La upload document",
};

export default function WorkflowsPage() {
  const [wfList, setWfList] = useState<WfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrigger, setNewTrigger] = useState("manual");

  useEffect(() => { loadWfs(); }, []);

  async function loadWfs() {
    setLoading(true);
    const res = await api("/api/v1/workflows");
    if (res.success) setWfList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const res = await api("/api/v1/workflows", {
      method: "POST",
      body: JSON.stringify({ title: newTitle.trim(), trigger: { type: newTrigger } }),
    });
    if (res.success) { setShowCreate(false); setNewTitle(""); await loadWfs(); }
  }

  async function handleActivate(id: string) { await api(`/api/v1/workflows/${id}/activate`, { method: "POST" }); await loadWfs(); }
  async function handlePause(id: string) { await api(`/api/v1/workflows/${id}/pause`, { method: "POST" }); await loadWfs(); }
  async function handleRun(id: string) { await api(`/api/v1/workflows/${id}/run`, { method: "POST" }); await loadWfs(); }
  async function handleDelete(id: string) { await api(`/api/v1/workflows/${id}`, { method: "DELETE" }); await loadWfs(); }

  if (!loading && wfList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Automatizări</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Automatizează procese și acțiuni repetitive</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a4 4 0 0 0 4 4h2M19 8v2a4 4 0 0 1-4 4h-2"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Nicio automatizare creată</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează workflow-uri pentru a automatiza procesele echipei.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Workflow nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Automatizări</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{wfList.length} workflow-uri</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Workflow nou
        </button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nume workflow</label>
              <input className="input" autoFocus placeholder="ex: Aprobare documente, Notificare echipă..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowCreate(false); setNewTitle(""); } }} />
            </div>
            <div className="w-48">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Declanșator</label>
              <select className="input" value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}>
                <option value="manual">Manual</option>
                <option value="on_create">La creare element</option>
                <option value="on_update">La modificare</option>
                <option value="form_submit">La submit formular</option>
                <option value="document_upload">La upload document</option>
                <option value="scheduled">Programat (cron)</option>
              </select>
            </div>
            <button className="btn-primary shrink-0" onClick={handleCreate}>Creează</button>
            <button className="btn-secondary shrink-0" onClick={() => { setShowCreate(false); setNewTitle(""); }}>Anulează</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {wfList.map((wf) => {
          const st = STATUS_MAP[wf.status] || STATUS_MAP.draft;
          return (
            <div key={wf.id} className="panel px-5 py-4 flex items-center gap-4 transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: st.color + "12" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={st.color} strokeWidth="1.5">
                  <circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>
                  <path d="M5 8v2a4 4 0 0 0 4 4h2M19 8v2a4 4 0 0 1-4 4h-2"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/workflows/${wf.id}`} className="no-underline">
                  <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{wf.title}</p>
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                  <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>Declanșator: {TRIGGER_LABELS[wf.trigger?.type] || "Manual"}</span>
                  <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{wf.steps?.length || 0} pași</span>
                  <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{wf.instanceCount} execuții</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {wf.status === "draft" && (
                  <button onClick={() => handleActivate(wf.id)} className="border-0 bg-transparent cursor-pointer px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                    style={{ color: "#10B981" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#10B98110")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    Activează
                  </button>
                )}
                {wf.status === "active" && (
                  <>
                    <button onClick={() => handleRun(wf.id)} className="border-0 bg-transparent cursor-pointer px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                      style={{ color: "var(--accent)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)" + "10")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      ▶ Rulează
                    </button>
                    <button onClick={() => handlePause(wf.id)} className="border-0 bg-transparent cursor-pointer px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                      style={{ color: "#F59E0B" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F59E0B10")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      Pauză
                    </button>
                  </>
                )}
                {wf.status === "paused" && (
                  <button onClick={() => handleActivate(wf.id)} className="border-0 bg-transparent cursor-pointer px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                    style={{ color: "#10B981" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#10B98110")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    Reia
                  </button>
                )}
                <button onClick={() => handleDelete(wf.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
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
