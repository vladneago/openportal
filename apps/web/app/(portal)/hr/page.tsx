"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Job { id: string; title: string; department: string | null; location: string | null; type: string; status: string; applicationCount: number; createdAt: string; }
interface Leave { id: string; type: string; startDate: string; endDate: string; reason: string | null; status: string; userName: string | null; userFirstName: string; userLastName: string; }

const JOB_STATUS = { draft: { label: "Ciornă", color: "#71717A" }, open: { label: "Deschis", color: "#10B981" }, closed: { label: "Închis", color: "#EF4444" } };
const LEAVE_TYPES: Record<string, string> = { vacation: "Concediu", sick: "Medical", personal: "Personal", maternity: "Maternitate", paternity: "Paternitate", unpaid: "Fără plată" };
const LEAVE_STATUS = { pending: { label: "În așteptare", color: "#F59E0B" }, approved: { label: "Aprobat", color: "#10B981" }, rejected: { label: "Respins", color: "#EF4444" } };

export default function HRPage() {
  const [tab, setTab] = useState<"jobs" | "leaves">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", department: "", location: "", type: "full-time" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [jobsRes, leavesRes] = await Promise.all([api("/api/v1/hr/jobs"), api("/api/v1/hr/leaves")]);
    if (jobsRes.success) setJobs(jobsRes.data || []);
    if (leavesRes.success) setLeaves(leavesRes.data || []);
    setLoading(false);
  }

  async function handleCreateJob() {
    if (!form.title.trim()) return;
    await api("/api/v1/hr/jobs", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ title: "", department: "", location: "", type: "full-time" }); await loadData();
  }

  async function handlePublishJob(id: string) { await api(`/api/v1/hr/jobs/${id}/publish`, { method: "POST" }); await loadData(); }
  async function handleDeleteJob(id: string) { await api(`/api/v1/hr/jobs/${id}`, { method: "DELETE" }); await loadData(); }
  async function handleApproveLeave(id: string) { await api(`/api/v1/hr/leaves/${id}/approve`, { method: "POST" }); await loadData(); }
  async function handleRejectLeave(id: string) { await api(`/api/v1/hr/leaves/${id}/reject`, { method: "POST" }); await loadData(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Resurse Umane</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Recrutare, concedii și management personal</p>
        </div>
        {tab === "jobs" && <button className="btn-primary" onClick={() => setShowCreate(true)}>Job nou</button>}
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "jobs" as const, label: `Joburi (${jobs.length})` }, { id: "leaves" as const, label: `Concedii (${leaves.length})` }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "jobs" ? (
        <>
          {showCreate && (
            <div className="panel p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
                  <input className="input" autoFocus placeholder="ex: Frontend Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreateJob(); }} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Departament</label>
                  <input className="input" placeholder="IT, HR, Marketing..." value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Locație</label>
                  <input className="input" placeholder="București / Remote" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="remote">Remote</option>
                  </select></div>
              </div>
              <div className="flex gap-2"><button className="btn-primary" onClick={handleCreateJob}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Poziție</span><span>Departament</span><span>Aplicanți</span><span>Status</span><span></span>
            </div>
            {jobs.map((job) => {
              const st = JOB_STATUS[job.status as keyof typeof JOB_STATUS] || JOB_STATUS.draft;
              return (
                <div key={job.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px", borderBottom: "1px solid var(--page-bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div><p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{job.title}</p>
                    <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{job.location || "—"} · {job.type}</p></div>
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{job.department || "—"}</span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{job.applicationCount}</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                  <div className="flex gap-1">
                    {job.status === "draft" && <button onClick={() => handlePublishJob(job.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#10B981" }}>Publică</button>}
                    <button onClick={() => handleDeleteJob(job.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                  </div>
                </div>);
            })}
            {jobs.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun job creat.</div>}
          </div>
        </>
      ) : (
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 120px 120px 100px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Angajat</span><span>Tip</span><span>Perioadă</span><span>Status</span><span></span>
          </div>
          {leaves.map((leave) => {
            const st = LEAVE_STATUS[leave.status as keyof typeof LEAVE_STATUS] || LEAVE_STATUS.pending;
            return (
              <div key={leave.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 120px 120px 100px 100px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{leave.userName || `${leave.userFirstName} ${leave.userLastName}`}</span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{LEAVE_TYPES[leave.type] || leave.type}</span>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{new Date(leave.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })} — {new Date(leave.endDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                {leave.status === "pending" && (
                  <div className="flex gap-1">
                    <button onClick={() => handleApproveLeave(leave.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#10B981" }}>Aprobă</button>
                    <button onClick={() => handleRejectLeave(leave.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#EF4444" }}>Respinge</button>
                  </div>
                )}
              </div>);
          })}
          {leaves.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio cerere de concediu.</div>}
        </div>
      )}
    </div>
  );
}
