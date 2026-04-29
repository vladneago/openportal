"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Patient { id: string; firstName: string; lastName: string; dateOfBirth: string | null; gender: string | null; phone: string | null; email: string | null; allergies: string[]; chronicConditions: string[]; bloodType: string | null; }
interface Appointment { id: string; title: string | null; startAt: string; endAt: string; status: string; patientFirstName: string; patientLastName: string; doctorName: string | null; department: string | null; reason: string | null; }

const APPT_STATUS: Record<string, { label: string; color: string }> = { scheduled: { label: "Programat", color: "#3B82F6" }, confirmed: { label: "Confirmat", color: "#6366F1" }, in_progress: { label: "În curs", color: "#F59E0B" }, completed: { label: "Finalizat", color: "#10B981" }, cancelled: { label: "Anulat", color: "#71717A" }, no_show: { label: "Neprezentare", color: "#EF4444" } };

export default function HealthcarePage() {
  const [tab, setTab] = useState<"patients" | "appointments">("patients");
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [apptList, setApptList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", gender: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [pRes, aRes] = await Promise.all([api("/api/v1/healthcare/patients"), api("/api/v1/healthcare/appointments")]);
    if (pRes.success) setPatientList(pRes.data || []);
    if (aRes.success) setApptList(aRes.data || []);
    setLoading(false);
  }

  async function handleCreatePatient() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    await api("/api/v1/healthcare/patients", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ firstName: "", lastName: "", phone: "", email: "", gender: "" }); await loadData();
  }

  async function handleApptStatus(id: string, status: string) { await api(`/api/v1/healthcare/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }
  async function handleDeletePatient(id: string) { await api(`/api/v1/healthcare/patients/${id}`, { method: "DELETE" }); await loadData(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Sănătate</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Pacienți, programări și dosare medicale</p>
        </div>
        {tab === "patients" && <button className="btn-primary" onClick={() => setShowCreate(true)}>Pacient nou</button>}
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "patients" as const, label: `Pacienți (${patientList.length})` }, { id: "appointments" as const, label: `Programări (${apptList.length})` }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {tab === "patients" ? (
        <>
          {showCreate && (
            <div className="panel p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Prenume</label>
                  <input className="input" autoFocus value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nume</label>
                  <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreatePatient(); }} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Gen</label>
                  <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">—</option><option value="M">Masculin</option><option value="F">Feminin</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Telefon</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                  <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="flex gap-2"><button className="btn-primary" onClick={handleCreatePatient}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 100px 120px 120px 100px 60px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Pacient</span><span>Gen</span><span>Telefon</span><span>Email</span><span>Grupa sangvină</span><span></span>
            </div>
            {patientList.map((p) => (
              <div key={p.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 100px 120px 120px 100px 60px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{p.lastName} {p.firstName}</p>
                  <div className="flex gap-1 mt-0.5">
                    {p.allergies?.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#EF444415", color: "#EF4444" }}>Alergii: {p.allergies.length}</span>}
                    {p.chronicConditions?.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Condiții: {p.chronicConditions.length}</span>}
                  </div>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{p.gender || "—"}</span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{p.phone || "—"}</span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{p.email || "—"}</span>
                <span className="text-[11px] font-medium" style={{ color: p.bloodType ? "var(--text)" : "var(--text-muted)" }}>{p.bloodType || "—"}</span>
                <button onClick={() => handleDeletePatient(p.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            ))}
            {patientList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun pacient.</div>}
          </div>
        </>
      ) : (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 120px 120px 100px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Pacient</span><span>Data</span><span>Ora</span><span>Departament</span><span>Status</span>
          </div>
          {apptList.map((a) => {
            const st = APPT_STATUS[a.status] || APPT_STATUS.scheduled;
            return (
              <div key={a.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 120px 120px 100px 100px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div><p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{a.patientLastName} {a.patientFirstName}</p>
                  {a.reason && <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{a.reason}</p>}</div>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(a.startAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(a.startAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} — {new Date(a.endAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{a.department || "General"}</span>
                <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                  value={a.status} onChange={(e) => handleApptStatus(a.id, e.target.value)}>
                  {Object.entries(APPT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>);
          })}
          {apptList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio programare.</div>}
        </div>
      )}
    </div>
  );
}
