"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Request { id: string; registrationNumber: string; citizenName: string; category: string; subject: string; status: string; department: string | null; legalDeadline: string | null; createdAt: string; }

const STATUS: Record<string, { label: string; color: string }> = { submitted: { label: "Depusă", color: "#3B82F6" }, registered: { label: "Înregistrată", color: "#8B5CF6" }, in_review: { label: "În analiză", color: "#F59E0B" }, approved: { label: "Aprobată", color: "#10B981" }, rejected: { label: "Respinsă", color: "#EF4444" }, completed: { label: "Finalizată", color: "#71717A" } };
const CATEGORIES: Record<string, string> = { urbanism: "Urbanism", acte_stare_civila: "Acte stare civilă", taxe: "Taxe și impozite", sesizari: "Sesizări", general: "General" };

export default function GovernmentPage() {
  const [tab, setTab] = useState<"requests" | "decisions" | "services">("requests");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ citizenName: "", subject: "", category: "general", description: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() { setLoading(true); const res = await api("/api/v1/government/requests"); if (res.success) setRequests(res.data || []); setLoading(false); }

  async function handleCreate() {
    if (!form.citizenName.trim() || !form.subject.trim()) return;
    await api("/api/v1/government/requests", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ citizenName: "", subject: "", category: "general", description: "" }); await loadData();
  }

  async function handleStatus(id: string, status: string) { await api(`/api/v1/government/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Administrație Publică</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Registratură electronică, hotărâri și servicii publice</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Cerere nouă</button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "requests" as const, label: `Registratură (${requests.length})` }, { id: "decisions" as const, label: "Hotărâri" }, { id: "services" as const, label: "Servicii" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Numele cetățeanului</label>
              <input className="input" autoFocus value={form.citizenName} onChange={(e) => setForm({ ...form, citizenName: e.target.value })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Categorie</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subiect</label>
            <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} /></div>
          <div className="flex gap-2"><button className="btn-primary" onClick={handleCreate}>Înregistrează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
        </div>
      )}

      <div className="panel">
        <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "70px 1fr 120px 100px 120px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span>Nr.</span><span>Subiect</span><span>Cetățean</span><span>Categorie</span><span>Termen legal</span><span>Status</span>
        </div>
        {requests.map((r) => {
          const st = STATUS[r.status] || STATUS.submitted;
          return (
            <div key={r.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "70px 1fr 120px 100px 120px 100px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span className="text-[11px] font-mono font-medium" style={{ color: "var(--accent)" }}>#{r.registrationNumber}</span>
              <span className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{r.subject}</span>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.citizenName}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{CATEGORIES[r.category] || r.category}</span>
              <span className="text-[10.5px]" style={{ color: r.legalDeadline && new Date(r.legalDeadline) < new Date() ? "#EF4444" : "var(--text-tertiary)" }}>
                {r.legalDeadline ? new Date(r.legalDeadline).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" }) : "—"}
              </span>
              <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                value={r.status} onChange={(e) => handleStatus(r.id, e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>);
        })}
        {requests.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio cerere înregistrată.</div>}
      </div>
    </div>
  );
}
