"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface IncidentItem { id: string; number: number; title: string; severity: string; status: string; service: string | null; createdAt: string; resolvedAt: string | null; }
interface ChangeItem { id: string; title: string; type: string | null; status: string; risk: string; scheduledAt: string | null; }
interface AssetItem { id: string; name: string; type: string; status: string; serialNumber: string | null; assignedTo: string | null; }

const SEV: Record<string, { label: string; color: string }> = { critical: { label: "Critic", color: "#EF4444" }, major: { label: "Major", color: "#F59E0B" }, minor: { label: "Minor", color: "#3B82F6" }, low: { label: "Scăzut", color: "#71717A" } };
const INC_STATUS: Record<string, { label: string; color: string }> = { open: { label: "Deschis", color: "#EF4444" }, investigating: { label: "Investigare", color: "#F59E0B" }, identified: { label: "Identificat", color: "#8B5CF6" }, monitoring: { label: "Monitorizare", color: "#3B82F6" }, resolved: { label: "Rezolvat", color: "#10B981" } };
const CHG_STATUS: Record<string, { label: string; color: string }> = { proposed: { label: "Propus", color: "#71717A" }, approved: { label: "Aprobat", color: "#10B981" }, in_progress: { label: "În lucru", color: "#F59E0B" }, completed: { label: "Complet", color: "#6366F1" }, rolled_back: { label: "Rollback", color: "#EF4444" }, rejected: { label: "Respins", color: "#A1A1AA" } };

export default function ITOpsPage() {
  const [tab, setTab] = useState<"incidents" | "changes" | "assets">("incidents");
  const [incidentList, setIncidentList] = useState<IncidentItem[]>([]);
  const [changeList, setChangeList] = useState<ChangeItem[]>([]);
  const [assetList, setAssetList] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [incForm, setIncForm] = useState({ title: "", severity: "minor", service: "" });
  const [assetForm, setAssetForm] = useState({ name: "", type: "laptop" });
  const [chgForm, setChgForm] = useState({ title: "", type: "normal", risk: "medium" });

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    const [iRes, cRes, aRes] = await Promise.all([api("/api/v1/itops/incidents"), api("/api/v1/itops/changes"), api("/api/v1/itops/assets")]);
    if (iRes.success) setIncidentList(iRes.data || []);
    if (cRes.success) setChangeList(cRes.data || []);
    if (aRes.success) setAssetList(aRes.data || []);
    setLoading(false);
  }

  async function createIncident() {
    if (!incForm.title.trim()) return;
    await api("/api/v1/itops/incidents", { method: "POST", body: JSON.stringify(incForm) });
    setShowCreate(false); setIncForm({ title: "", severity: "minor", service: "" }); await loadData();
  }

  async function createChange() {
    if (!chgForm.title.trim()) return;
    await api("/api/v1/itops/changes", { method: "POST", body: JSON.stringify(chgForm) });
    setShowCreate(false); setChgForm({ title: "", type: "normal", risk: "medium" }); await loadData();
  }

  async function createAsset() {
    if (!assetForm.name.trim()) return;
    await api("/api/v1/itops/assets", { method: "POST", body: JSON.stringify(assetForm) });
    setShowCreate(false); setAssetForm({ name: "", type: "laptop" }); await loadData();
  }

  async function updateIncident(id: string, status: string) { await api(`/api/v1/itops/incidents/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }
  async function updateChange(id: string, status: string) { await api(`/api/v1/itops/changes/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }
  async function deleteIncident(id: string) { await api(`/api/v1/itops/incidents/${id}`, { method: "DELETE" }); await loadData(); }
  async function deleteAsset(id: string) { await api(`/api/v1/itops/assets/${id}`, { method: "DELETE" }); await loadData(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>IT & DevOps</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Incidente, change management și inventar IT</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          {tab === "incidents" ? "Incident" : tab === "changes" ? "Change Request" : "Asset"} nou
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "incidents" as const, label: `Incidente (${incidentList.length})` }, { id: "changes" as const, label: `Changes (${changeList.length})` }, { id: "assets" as const, label: `Inventar (${assetList.length})` }].map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowCreate(false); }} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {/* Create forms */}
      {showCreate && tab === "incidents" && (
        <div className="panel p-4 mb-4 flex items-end gap-3">
          <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu incident</label>
            <input className="input" autoFocus value={incForm.title} onChange={(e) => setIncForm({ ...incForm, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createIncident(); }} /></div>
          <div className="w-32"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Severitate</label>
            <select className="input" value={incForm.severity} onChange={(e) => setIncForm({ ...incForm, severity: e.target.value })}>
              {Object.entries(SEV).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div className="w-40"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Serviciu afectat</label>
            <input className="input" placeholder="API, Web, DB..." value={incForm.service} onChange={(e) => setIncForm({ ...incForm, service: e.target.value })} /></div>
          <button className="btn-primary shrink-0" onClick={createIncident}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => setShowCreate(false)}>Anulează</button>
        </div>
      )}
      {showCreate && tab === "changes" && (
        <div className="panel p-4 mb-4 flex items-end gap-3">
          <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
            <input className="input" autoFocus value={chgForm.title} onChange={(e) => setChgForm({ ...chgForm, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createChange(); }} /></div>
          <div className="w-32"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
            <select className="input" value={chgForm.type} onChange={(e) => setChgForm({ ...chgForm, type: e.target.value })}>
              <option value="normal">Normal</option><option value="standard">Standard</option><option value="emergency">Urgență</option></select></div>
          <div className="w-28"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Risc</label>
            <select className="input" value={chgForm.risk} onChange={(e) => setChgForm({ ...chgForm, risk: e.target.value })}>
              <option value="low">Scăzut</option><option value="medium">Mediu</option><option value="high">Ridicat</option></select></div>
          <button className="btn-primary shrink-0" onClick={createChange}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => setShowCreate(false)}>Anulează</button>
        </div>
      )}
      {showCreate && tab === "assets" && (
        <div className="panel p-4 mb-4 flex items-end gap-3">
          <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nume echipament</label>
            <input className="input" autoFocus value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createAsset(); }} /></div>
          <div className="w-40"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
            <select className="input" value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}>
              <option value="laptop">Laptop</option><option value="server">Server</option><option value="monitor">Monitor</option><option value="phone">Telefon</option><option value="license">Licență</option><option value="network">Network</option></select></div>
          <button className="btn-primary shrink-0" onClick={createAsset}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => setShowCreate(false)}>Anulează</button>
        </div>
      )}

      {/* Incidents */}
      {tab === "incidents" && (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "60px 1fr 100px 80px 100px 60px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>#</span><span>Incident</span><span>Serviciu</span><span>Severitate</span><span>Status</span><span></span>
          </div>
          {incidentList.map((inc) => {
            const sv = SEV[inc.severity] || SEV.minor;
            const st = INC_STATUS[inc.status] || INC_STATUS.open;
            return (
              <div key={inc.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "60px 1fr 100px 80px 100px 60px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>INC-{inc.number}</span>
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{inc.title}</p>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{inc.service || "—"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: sv.color + "15", color: sv.color }}>{sv.label}</span>
                <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                  value={inc.status} onChange={(e) => updateIncident(inc.id, e.target.value)}>
                  {Object.entries(INC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={() => deleteIncident(inc.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>);
          })}
          {incidentList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun incident. 🎉</div>}
        </div>
      )}

      {/* Changes */}
      {tab === "changes" && (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 80px 80px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Change Request</span><span>Tip</span><span>Risc</span><span>Status</span>
          </div>
          {changeList.map((chg) => {
            const st = CHG_STATUS[chg.status] || CHG_STATUS.proposed;
            return (
              <div key={chg.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 80px 80px 100px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{chg.title}</p>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{chg.type || "Normal"}</span>
                <span className="text-[10.5px] font-medium" style={{ color: chg.risk === "high" ? "#EF4444" : chg.risk === "medium" ? "#F59E0B" : "#71717A" }}>{chg.risk === "high" ? "Ridicat" : chg.risk === "medium" ? "Mediu" : "Scăzut"}</span>
                <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                  value={chg.status} onChange={(e) => updateChange(chg.id, e.target.value)}>
                  {Object.entries(CHG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>);
          })}
          {changeList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun change request.</div>}
        </div>
      )}

      {/* Assets */}
      {tab === "assets" && (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 100px 120px 80px 60px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Echipament</span><span>Tip</span><span>Serial</span><span>Status</span><span></span>
          </div>
          {assetList.map((a) => (
            <div key={a.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 100px 120px 80px 60px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{a.name}</p>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{a.type}</span>
              <span className="text-[10.5px] font-mono" style={{ color: "var(--text-tertiary)" }}>{a.serialNumber || "—"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: a.status === "active" ? "#10B98115" : "#71717A15", color: a.status === "active" ? "#10B981" : "#71717A" }}>
                {a.status === "active" ? "Activ" : a.status === "maintenance" ? "Mentenanță" : a.status === "retired" ? "Retras" : "Pierdut"}
              </span>
              <button onClick={() => deleteAsset(a.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
          ))}
          {assetList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun echipament.</div>}
        </div>
      )}
    </div>
  );
}
