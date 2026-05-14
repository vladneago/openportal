"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Leave {
  id: string; employeeId: string; leavePolicyId: string;
  startDate: string; endDate: string; totalDays: string;
  reason: string | null; status: string;
  employeeFirstName: string | null; employeeLastName: string | null; employeePhoto: string | null;
  createdAt: string;
}
interface Policy { id: string; code: string; name: string; type: string; }
interface Employee { id: string; firstName: string; lastName: string; }

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "Ciornă", bg: "#F3F4F6", fg: "#52525B" },
  pending: { label: "În așteptare", bg: "#FEF3C7", fg: "#B45309" },
  in_review: { label: "În revizie", bg: "#DBEAFE", fg: "#1E40AF" },
  approved: { label: "Aprobat", bg: "#DCFCE7", fg: "#15803D" },
  rejected: { label: "Respins", bg: "#FEE2E2", fg: "#B91C1C" },
  cancelled: { label: "Anulat", bg: "#F3F4F6", fg: "#52525B" },
  completed: { label: "Complet", bg: "#E0E7FF", fg: "#4338CA" },
};

const TYPE_LABEL: Record<string, string> = {
  annual_vacation: "Vacanță anuală", sick: "Medical", personal: "Personal",
  bereavement: "Decese", maternity: "Maternitate", paternity: "Paternitate",
  parental: "Parental", unpaid: "Neplătit", marriage: "Căsătorie",
  study: "Studii", sabbatical: "Sabatic", military: "Militar",
  jury_duty: "Jurat", religious: "Religios", voting: "Vot",
  compensatory: "Compensator", training: "Formare", other: "Altul",
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    employeeId: "", leavePolicyId: "",
    startDate: "", endDate: "",
    isHalfDayStart: false, isHalfDayEnd: false,
    totalDays: 0, reason: "",
  });

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadLeaves(); }, [filter]);

  async function loadAll() {
    const [pol, emps] = await Promise.all([
      api<Policy[]>("/api/v1/hr/leave-policies"),
      api<Employee[]>("/api/v1/hr/employees?limit=500"),
    ]);
    if (pol.success) setPolicies(pol.data || []);
    if (emps.success) setEmployees(emps.data || []);
  }

  async function loadLeaves() {
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    const res = await api<Leave[]>(`/api/v1/hr/leaves${q}`);
    if (res.success) setLeaves(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.employeeId || !form.leavePolicyId || !form.startDate || !form.endDate) return;
    const res = await api("/api/v1/hr/leaves", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (res.success) {
      setShowCreate(false);
      setForm({ employeeId: "", leavePolicyId: "", startDate: "", endDate: "", isHalfDayStart: false, isHalfDayEnd: false, totalDays: 0, reason: "" });
      await loadLeaves();
    }
  }

  async function approve(id: string) {
    await api(`/api/v1/hr/leaves/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
    await loadLeaves();
  }

  async function reject(id: string) {
    const notes = prompt("Motiv respingere?") || "";
    await api(`/api/v1/hr/leaves/${id}/reject`, { method: "POST", body: JSON.stringify({ notes }) });
    await loadLeaves();
  }

  function calcDays() {
    if (!form.startDate || !form.endDate) return;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    let days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    if (form.isHalfDayStart) days -= 0.5;
    if (form.isHalfDayEnd) days -= 0.5;
    setForm({ ...form, totalDays: Math.max(0, days) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Concedii</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Concedii & Absențe</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/leaves/policies" className="btn-secondary no-underline text-[11px]">Politici</Link>
          <Link href="/hr/leaves/holidays" className="btn-secondary no-underline text-[11px]">Sărbători</Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-[11px]">+ Cerere concediu</button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[
          { id: "all", label: "Toate" },
          { id: "pending", label: "În așteptare" },
          { id: "approved", label: "Aprobate" },
          { id: "rejected", label: "Respinse" },
          { id: "cancelled", label: "Anulate" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11px] font-medium"
            style={{
              background: filter === f.id ? "var(--text)" : "transparent",
              color: filter === f.id ? "#fff" : "var(--text-secondary)",
            }}>{f.label}</button>
        ))}
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Cerere nouă de concediu</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">— Angajat —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <select className="input" value={form.leavePolicyId} onChange={(e) => setForm({ ...form, leavePolicyId: e.target.value })}>
              <option value="">— Politică concediu —</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.name} ({TYPE_LABEL[p.type] || p.type})</option>)}
            </select>
            <input className="input" type="date" value={form.startDate} onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setTimeout(calcDays, 0); }} />
            <input className="input" type="date" value={form.endDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setTimeout(calcDays, 0); }} />
            <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.isHalfDayStart} onChange={(e) => { setForm({ ...form, isHalfDayStart: e.target.checked }); setTimeout(calcDays, 0); }} /><span style={{ color: "var(--text-secondary)" }}>Jumătate de zi (start)</span></label>
            <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.isHalfDayEnd} onChange={(e) => { setForm({ ...form, isHalfDayEnd: e.target.checked }); setTimeout(calcDays, 0); }} /><span style={{ color: "var(--text-secondary)" }}>Jumătate de zi (final)</span></label>
            <input className="input" type="number" step="0.5" placeholder="Total zile" value={form.totalDays} onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })} />
            <input className="input" placeholder="Motiv (opțional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Trimite cerere</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="grid gap-3 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "30px 1fr 130px 160px 70px 100px 120px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span></span><span>Angajat</span><span>Tip</span><span>Perioadă</span><span>Zile</span><span>Status</span><span></span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Nicio cerere.</div>
        ) : leaves.map((l) => {
          const st = STATUS_BADGE[l.status] || STATUS_BADGE.pending;
          const policy = policies.find((p) => p.id === l.leavePolicyId);
          return (
            <div key={l.id} className="grid gap-3 items-center px-4 py-2.5" style={{ gridTemplateColumns: "30px 1fr 130px 160px 70px 100px 120px", borderBottom: "1px solid var(--page-bg)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                style={{ background: l.employeePhoto ? `url(${l.employeePhoto}) center/cover` : "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                {!l.employeePhoto && `${(l.employeeFirstName || "?")[0]}${(l.employeeLastName || "?")[0]}`}
              </div>
              <div>
                <Link href={`/hr/employees/${l.employeeId}`} className="text-[12px] font-medium no-underline" style={{ color: "var(--text)" }}>
                  {l.employeeFirstName} {l.employeeLastName}
                </Link>
                {l.reason && <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{l.reason}</p>}
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{policy ? TYPE_LABEL[policy.type] || policy.type : "—"}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                {new Date(l.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
                {" — "}
                {new Date(l.endDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
              </span>
              <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{l.totalDays}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
              {l.status === "pending" && (
                <div className="flex gap-1">
                  <button onClick={() => approve(l.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#10B981" }}>Aprobă</button>
                  <button onClick={() => reject(l.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#EF4444" }}>Respinge</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
