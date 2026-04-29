"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Case { id: string; caseNumber: string; title: string; clientName: string; status: string; caseType: string | null; court: string | null; deadlineCount: number; totalMinutes: number; value: number; }
interface Contract { id: string; title: string; clientName: string; contractType: string | null; status: string; value: number; startDate: string | null; endDate: string | null; }

const CASE_STATUS: Record<string, { label: string; color: string }> = { new: { label: "Nou", color: "#3B82F6" }, active: { label: "Activ", color: "#10B981" }, suspended: { label: "Suspendat", color: "#F59E0B" }, won: { label: "Câștigat", color: "#6366F1" }, lost: { label: "Pierdut", color: "#EF4444" }, settled: { label: "Tranzacție", color: "#8B5CF6" }, closed: { label: "Închis", color: "#71717A" } };
const CONTRACT_STATUS: Record<string, { label: string; color: string }> = { draft: { label: "Ciornă", color: "#71717A" }, review: { label: "Review", color: "#F59E0B" }, pending_signature: { label: "De semnat", color: "#8B5CF6" }, active: { label: "Activ", color: "#10B981" }, expired: { label: "Expirat", color: "#EF4444" }, terminated: { label: "Reziliat", color: "#A1A1AA" } };

export default function LegalPage() {
  const [tab, setTab] = useState<"cases" | "contracts" | "time">("cases");
  const [cases, setCases] = useState<Case[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", clientName: "", caseType: "civil" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [casesRes, contractsRes] = await Promise.all([api("/api/v1/legal/cases"), api("/api/v1/legal/contracts")]);
    if (casesRes.success) setCases(casesRes.data || []);
    if (contractsRes.success) setContracts(contractsRes.data || []);
    setLoading(false);
  }

  async function handleCreateCase() {
    if (!form.title.trim() || !form.clientName.trim()) return;
    await api("/api/v1/legal/cases", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ title: "", clientName: "", caseType: "civil" }); await loadData();
  }

  async function handleCaseStatus(id: string, status: string) { await api(`/api/v1/legal/cases/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }
  async function handleDeleteCase(id: string) { await api(`/api/v1/legal/cases/${id}`, { method: "DELETE" }); await loadData(); }

  const formatMinutes = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const formatMoney = (v: number) => new Intl.NumberFormat("ro-RO").format(v / 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Juridic</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Dosare, contracte și pontaj</p>
        </div>
        {tab === "cases" && <button className="btn-primary" onClick={() => setShowCreate(true)}>Dosar nou</button>}
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "cases" as const, label: `Dosare (${cases.length})` }, { id: "contracts" as const, label: `Contracte (${contracts.length})` }, { id: "time" as const, label: "Pontaj" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {tab === "cases" && (
        <>
          {showCreate && (
            <div className="panel p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu dosar</label>
                  <input className="input" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreateCase(); }} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Client</label>
                  <input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
                  <select className="input" value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })}>
                    <option value="civil">Civil</option><option value="penal">Penal</option><option value="commercial">Comercial</option><option value="labor">Muncă</option><option value="administrative">Administrativ</option>
                  </select></div>
              </div>
              <div className="flex gap-2"><button className="btn-primary" onClick={handleCreateCase}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "90px 1fr 120px 80px 80px 100px 60px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Nr. dosar</span><span>Titlu</span><span>Client</span><span>Tip</span><span>Termene</span><span>Status</span><span></span>
            </div>
            {cases.map((cs) => {
              const st = CASE_STATUS[cs.status] || CASE_STATUS.new;
              return (
                <div key={cs.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "90px 1fr 120px 80px 80px 100px 60px", borderBottom: "1px solid var(--page-bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span className="text-[10.5px] font-mono" style={{ color: "var(--accent)" }}>{cs.caseNumber.slice(0, 12)}</span>
                  <div><p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{cs.title}</p>
                    {cs.totalMinutes > 0 && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatMinutes(cs.totalMinutes)} logat</p>}</div>
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{cs.clientName}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{cs.caseType || "—"}</span>
                  <span className="text-[11px] font-medium" style={{ color: cs.deadlineCount > 0 ? "var(--text)" : "var(--text-muted)" }}>{cs.deadlineCount}</span>
                  <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                    value={cs.status} onChange={(e) => handleCaseStatus(cs.id, e.target.value)}>
                    {Object.entries(CASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button onClick={() => handleDeleteCase(cs.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                </div>);
            })}
            {cases.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun dosar.</div>}
          </div>
        </>
      )}

      {tab === "contracts" && (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 120px 100px 100px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Titlu</span><span>Client</span><span>Tip</span><span>Valoare</span><span>Status</span>
          </div>
          {contracts.map((ct) => {
            const st = CONTRACT_STATUS[ct.status] || CONTRACT_STATUS.draft;
            return (
              <div key={ct.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 120px 100px 100px 100px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{ct.title}</span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{ct.clientName}</span>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{ct.contractType || "—"}</span>
                <span className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{ct.value > 0 ? `${formatMoney(ct.value)} RON` : "—"}</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
              </div>);
          })}
          {contracts.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun contract.</div>}
        </div>
      )}

      {tab === "time" && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>⏱</div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Time Tracking</p>
          <p className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>Pontajul pe dosare va fi disponibil în curând.</p>
        </div>
      )}
    </div>
  );
}
