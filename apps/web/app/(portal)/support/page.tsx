"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Ticket { id: string; number: number; subject: string; status: string; priority: string; category: string; createdAt: string; resolvedAt: string | null; }

const STATUS: Record<string, { label: string; color: string }> = { open: { label: "Deschis", color: "#3B82F6" }, in_progress: { label: "În lucru", color: "#F59E0B" }, waiting: { label: "Așteaptă", color: "#8B5CF6" }, resolved: { label: "Rezolvat", color: "#10B981" }, closed: { label: "Închis", color: "#71717A" } };
const PRIORITY: Record<string, { label: string; color: string }> = { low: { label: "Mică", color: "#71717A" }, medium: { label: "Medie", color: "#3B82F6" }, high: { label: "Mare", color: "#F59E0B" }, urgent: { label: "Urgentă", color: "#EF4444" } };
const CATEGORIES: Record<string, string> = { general: "General", technical: "Tehnic", billing: "Facturare", feature_request: "Funcționalitate", bug: "Bug" };

export default function SupportPage() {
  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", category: "general" });

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    setLoading(true);
    const res = await api("/api/v1/support/tickets");
    if (res.success) setTicketList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.subject.trim()) return;
    await api("/api/v1/support/tickets", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ subject: "", description: "", priority: "medium", category: "general" }); await loadTickets();
  }

  async function handleStatusChange(id: string, status: string) {
    await api(`/api/v1/support/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadTickets();
  }

  const filtered = filter === "all" ? ticketList : ticketList.filter((t) => t.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Support</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Gestionează tichetele de suport</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Tichet nou</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subiect</label>
            <input className="input" autoFocus placeholder="Descrie problema..." value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} /></div>
          <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Descriere</label>
            <textarea className="input" rows={3} placeholder="Detalii..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "none" }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Prioritate</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Mică</option><option value="medium">Medie</option><option value="high">Mare</option><option value="urgent">Urgentă</option></select></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Categorie</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="general">General</option><option value="technical">Tehnic</option><option value="billing">Facturare</option><option value="feature_request">Funcționalitate</option><option value="bug">Bug</option></select></div>
          </div>
          <div className="flex gap-2"><button className="btn-primary" onClick={handleCreate}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
        </div>
      )}

      <div className="flex items-center gap-1 mb-5">
        {[{ id: "all", label: "Toate" }, { id: "open", label: "Deschise" }, { id: "in_progress", label: "În lucru" }, { id: "resolved", label: "Rezolvate" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: filter === f.id ? "var(--text)" : "transparent", color: filter === f.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (filter !== f.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (filter !== f.id) e.currentTarget.style.background = "transparent"; }}>{f.label}</button>
        ))}
      </div>

      <div className="panel">
        <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "60px 1fr 100px 80px 100px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span>#</span><span>Subiect</span><span>Categorie</span><span>Prioritate</span><span>Status</span><span></span>
        </div>
        {filtered.map((ticket) => {
          const st = STATUS[ticket.status] || STATUS.open;
          const pr = PRIORITY[ticket.priority] || PRIORITY.medium;
          return (
            <div key={ticket.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "60px 1fr 100px 80px 100px 100px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>#{ticket.number}</span>
              <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{ticket.subject}</p>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{CATEGORIES[ticket.category]}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: pr.color + "15", color: pr.color }}>{pr.label}</span>
              <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(ticket.createdAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}</span>
            </div>);
        })}
        {filtered.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun tichet {filter !== "all" ? "în această categorie" : "creat"}.</div>}
      </div>
    </div>
  );
}
