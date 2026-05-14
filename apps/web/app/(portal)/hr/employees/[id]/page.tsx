"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface EmployeeDetail {
  id: string; employeeNumber: string;
  firstName: string; middleName: string | null; lastName: string;
  preferredName: string | null; pronouns: string | null;
  workEmail: string | null; workPhone: string | null;
  personalEmail: string | null; personalPhone: string | null;
  photoUrl: string | null; bio: string | null;
  dateOfBirth: string | null; gender: string | null; nationality: string | null;
  workerType: string; status: string;
  hireDate: string | null; originalHireDate: string | null;
  contractEndDate: string | null; probationEndDate: string | null;
  currentJobTitle: string | null;
  currentDepartmentId: string | null; currentLocationId: string | null;
  currentManagerId: string | null;
  currentSalary: string | null; currentSalaryCurrency: string | null;
  skills: any[]; languages: any[]; socialLinks: any;
  addresses: any[]; emergencyContacts: any[]; dependents: any[]; paymentMethods: any[];
}

const TABS = ["profile", "job", "compensation", "leave", "performance", "learning", "documents", "history"] as const;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [comp, setComp] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [tab, setTab] = useState<typeof TABS[number]>("profile");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const [empRes, hist, c, lb, enr, dd] = await Promise.all([
      api<EmployeeDetail>(`/api/v1/hr/employees/${id}`),
      api<any[]>(`/api/v1/hr/employees/${id}/history`),
      api<any[]>(`/api/v1/hr/employees/${id}/compensation`),
      api<any[]>(`/api/v1/hr/employees/${id}/leave-balances`),
      api<any[]>(`/api/v1/hr/employees/${id}/enrollments`),
      api<any[]>(`/api/v1/hr/employees/${id}/documents`),
    ]);
    if (empRes.success) setEmp(empRes.data || null);
    if (hist.success) setHistory(hist.data || []);
    if (c.success) setComp(c.data || []);
    if (lb.success) setLeaveBalances(lb.data || []);
    if (enr.success) setEnrollments(enr.data || []);
    if (dd.success) setDocs(dd.data || []);
    setLoading(false);
  }

  async function save(patch: any) {
    await api(`/api/v1/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await load();
  }

  if (loading) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  if (!emp) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Angajat negăsit.</div>;

  const fullName = `${emp.preferredName || emp.firstName} ${emp.lastName}`;
  const tenureYears = emp.hireDate ? ((Date.now() - new Date(emp.hireDate).getTime()) / (365.25 * 86400000)).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <Link href="/hr/employees" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>Angajați</Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{fullName}</span>
      </div>

      {/* Header */}
      <div className="panel p-5 flex items-start gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[24px] font-semibold shrink-0"
          style={{ background: emp.photoUrl ? `url(${emp.photoUrl}) center/cover` : "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          {!emp.photoUrl && `${emp.firstName[0]}${emp.lastName[0]}`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-[20px] font-medium" style={{ color: "var(--text)" }}>{fullName}</h1>
            {emp.pronouns && <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>({emp.pronouns})</span>}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
              style={{ background: emp.status === "active" ? "#DCFCE7" : "#FEE2E2", color: emp.status === "active" ? "#15803D" : "#B91C1C" }}>
              {emp.status}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{emp.workerType}</span>
          </div>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{emp.currentJobTitle || "—"}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
            <span>#{emp.employeeNumber}</span>
            {emp.workEmail && <a href={`mailto:${emp.workEmail}`} className="no-underline" style={{ color: "var(--text-tertiary)" }}>📧 {emp.workEmail}</a>}
            {emp.workPhone && <span>📞 {emp.workPhone}</span>}
            {emp.hireDate && <span>📅 Angajat din {new Date(emp.hireDate).toLocaleDateString("ro-RO")} ({tenureYears} ani)</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-[11px]">{editing ? "Anulează" : "Editează"}</button>
          {emp.status === "active" && (
            <button onClick={() => setShowTerminate(true)} className="btn-secondary text-[11px]" style={{ color: "#EF4444" }}>Terminare</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="border-0 cursor-pointer px-3 py-2 text-[12px] font-medium transition-all capitalize"
            style={{
              background: "transparent",
              color: tab === t ? "var(--text)" : "var(--text-tertiary)",
              borderBottom: tab === t ? "2px solid #6366F1" : "2px solid transparent",
              marginBottom: -1,
            }}>
            {t === "profile" ? "Profil" : t === "job" ? "Job & Echipă" : t === "compensation" ? "Compensație" :
             t === "leave" ? "Concedii" : t === "performance" ? "Performanță" : t === "learning" ? "Învățare" :
             t === "documents" ? "Documente" : "Istoric"}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Section title="Date personale">
              <Field label="Nume legal complet" value={`${emp.firstName} ${emp.middleName || ""} ${emp.lastName}`.trim()} />
              <Field label="Nume preferat" value={emp.preferredName || "—"} />
              <Field label="Pronume" value={emp.pronouns || "—"} />
              <Field label="Data nașterii" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString("ro-RO") : "—"} />
              <Field label="Gen" value={emp.gender || "—"} />
              <Field label="Naționalitate" value={emp.nationality || "—"} />
            </Section>
            <Section title="Contact">
              <Field label="Email muncă" value={emp.workEmail || "—"} />
              <Field label="Telefon muncă" value={emp.workPhone || "—"} />
              <Field label="Email personal" value={emp.personalEmail || "—"} />
              <Field label="Telefon personal" value={emp.personalPhone || "—"} />
            </Section>
            <Section title="Adrese">
              {(emp.addresses || []).length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Nicio adresă înregistrată.</p>}
              {emp.addresses.map((a) => (
                <div key={a.id} className="text-[11.5px] py-1" style={{ borderTop: "1px solid var(--page-bg)" }}>
                  <p className="capitalize font-medium" style={{ color: "var(--text)" }}>{a.type}{a.isPrimary ? " · Principal" : ""}</p>
                  <p style={{ color: "var(--text-tertiary)" }}>{[a.street1, a.street2, a.city, a.postalCode, a.country].filter(Boolean).join(", ")}</p>
                </div>
              ))}
            </Section>
            <Section title="Contacte de urgență">
              {(emp.emergencyContacts || []).length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
              {emp.emergencyContacts.map((c) => (
                <div key={c.id} className="text-[11.5px] py-1" style={{ borderTop: "1px solid var(--page-bg)" }}>
                  <p className="font-medium" style={{ color: "var(--text)" }}>{c.name} <span style={{ color: "var(--text-tertiary)" }}>({c.relationship})</span></p>
                  <p style={{ color: "var(--text-tertiary)" }}>{c.phonePrimary} {c.email && `· ${c.email}`}</p>
                </div>
              ))}
            </Section>
          </div>
          <div className="space-y-4">
            <Section title="Competențe">
              {(emp.skills || []).length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
              <div className="flex flex-wrap gap-1.5">
                {(emp.skills || []).map((s, i) => (
                  <span key={i} className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>
                    {s.name} {s.level && `· L${s.level}`}
                  </span>
                ))}
              </div>
            </Section>
            <Section title="Limbi">
              {(emp.languages || []).length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
              <div className="space-y-1">
                {(emp.languages || []).map((l, i) => (
                  <div key={i} className="text-[11.5px] flex justify-between">
                    <span style={{ color: "var(--text)" }}>{l.language}</span>
                    <span className="capitalize" style={{ color: "var(--text-tertiary)" }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Persoane în întreținere">
              {(emp.dependents || []).length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
              {emp.dependents.map((d) => (
                <div key={d.id} className="text-[11.5px] py-1" style={{ borderTop: "1px solid var(--page-bg)" }}>
                  <p style={{ color: "var(--text)" }}>{d.firstName} {d.lastName} <span style={{ color: "var(--text-tertiary)" }}>({d.relationship})</span></p>
                </div>
              ))}
            </Section>
          </div>
        </div>
      )}

      {tab === "job" && (
        <div className="space-y-4">
          <Section title="Job actual">
            <Field label="Funcție" value={emp.currentJobTitle || "—"} />
            <Field label="Tip angajat" value={emp.workerType} />
            <Field label="Data angajării" value={emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("ro-RO") : "—"} />
            <Field label="Vechime totală" value={`${tenureYears} ani`} />
            {emp.probationEndDate && <Field label="Final perioadă probă" value={new Date(emp.probationEndDate).toLocaleDateString("ro-RO")} />}
            {emp.contractEndDate && <Field label="Final contract" value={new Date(emp.contractEndDate).toLocaleDateString("ro-RO")} />}
          </Section>
        </div>
      )}

      {tab === "compensation" && (
        <div className="space-y-3">
          <Section title="Salariu actual">
            <p className="text-[24px] font-semibold" style={{ color: "var(--text)" }}>
              {emp.currentSalary ? `${Number(emp.currentSalary).toLocaleString("ro-RO")} ${emp.currentSalaryCurrency}` : "—"}
            </p>
          </Section>
          <Section title="Istoric compensație">
            {comp.length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
            {comp.map((c) => (
              <div key={c.id} className="grid grid-cols-4 gap-3 py-2 text-[11.5px]" style={{ borderTop: "1px solid var(--page-bg)" }}>
                <span style={{ color: "var(--text-tertiary)" }}>{new Date(c.effectiveDate).toLocaleDateString("ro-RO")}</span>
                <span className="capitalize" style={{ color: "var(--text-secondary)" }}>{c.reason?.replace(/_/g, " ")}</span>
                <span className="font-medium" style={{ color: "var(--text)" }}>{Number(c.baseSalary).toLocaleString("ro-RO")} {c.baseCurrency}</span>
                <span style={{ color: "var(--text-tertiary)" }}>{c.payFrequency}</span>
              </div>
            ))}
          </Section>
        </div>
      )}

      {tab === "leave" && (
        <div>
          <Section title="Balanțe concediu">
            {leaveBalances.length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Nu există balanțe pentru anul curent.</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {leaveBalances.map((b) => (
                <div key={b.id} className="p-3 rounded" style={{ background: "var(--page-bg)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Politică</p>
                  <p className="text-[18px] font-semibold mt-1" style={{ color: "var(--text)" }}>{b.available} zile</p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>din {b.earned} câștigate · {b.used} folosite</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "performance" && (
        <div className="panel p-4">
          <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Mergi la <Link href="/hr/performance" className="no-underline" style={{ color: "#6366F1" }}>Performance</Link> pentru evaluări și obiective.</p>
        </div>
      )}

      {tab === "learning" && (
        <Section title="Înrolări curs">
          {enrollments.length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Niciun curs încă.</p>}
          {enrollments.map((e) => (
            <div key={e.id} className="grid grid-cols-3 gap-3 py-2 text-[11.5px]" style={{ borderTop: "1px solid var(--page-bg)" }}>
              <span style={{ color: "var(--text)" }}>{e.courseId?.slice(0, 8) || "—"}</span>
              <span className="capitalize" style={{ color: "var(--text-secondary)" }}>{e.status?.replace(/_/g, " ")}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{e.progressPercent}% progres</span>
            </div>
          ))}
        </Section>
      )}

      {tab === "documents" && (
        <Section title="Documente">
          {docs.length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Niciun document.</p>}
          {docs.map((d) => (
            <a key={d.id} href={d.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 py-2 no-underline"
              style={{ borderTop: "1px solid var(--page-bg)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <span className="text-[11.5px] flex-1" style={{ color: "var(--text)" }}>{d.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{d.category}</span>
            </a>
          ))}
        </Section>
      )}

      {tab === "history" && (
        <Section title="Istoric angajare">
          {history.length === 0 && <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3 py-2" style={{ borderTop: "1px solid var(--page-bg)" }}>
                <div className="w-1 rounded-full" style={{ background: "#6366F1" }} />
                <div className="flex-1">
                  <p className="text-[12px] font-medium capitalize" style={{ color: "var(--text)" }}>{h.reason?.replace(/_/g, " ")}</p>
                  <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(h.effectiveDate).toLocaleDateString("ro-RO")}
                    {h.jobTitle && ` · ${h.jobTitle}`}
                    {h.baseSalary && ` · ${Number(h.baseSalary).toLocaleString("ro-RO")} ${h.salaryCurrency}`}
                  </p>
                  {h.notes && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Terminate dialog */}
      {showTerminate && (
        <TerminateDialog id={id} onClose={() => setShowTerminate(false)} onDone={() => { setShowTerminate(false); load(); }} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <h3 className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--text-tertiary)" }}>{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-[11.5px]">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="col-span-2" style={{ color: "var(--text)" }}>{value || "—"}</span>
    </div>
  );
}

function TerminateDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    terminationDate: new Date().toISOString().slice(0, 10),
    terminationType: "voluntary" as "voluntary" | "involuntary" | "retirement" | "mutual",
    reason: "",
    isRehirable: true,
    notes: "",
  });

  async function submit() {
    if (!form.reason) return;
    await api(`/api/v1/hr/employees/${id}/terminate`, { method: "POST", body: JSON.stringify(form) });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[min(500px,92vw)] p-5">
        <h3 className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Terminare angajat</h3>
        <p className="text-[11.5px] mb-3" style={{ color: "var(--text-tertiary)" }}>Această acțiune va schimba statusul în „Terminat".</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Data terminării</label>
            <input className="input" type="date" value={form.terminationDate} onChange={(e) => setForm({ ...form, terminationDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
            <select className="input" value={form.terminationType} onChange={(e) => setForm({ ...form, terminationType: e.target.value as any })}>
              <option value="voluntary">Voluntară</option>
              <option value="involuntary">Involuntară</option>
              <option value="retirement">Pensionare</option>
              <option value="mutual">De comun acord</option>
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Motiv</label>
            <input className="input" placeholder="ex: Demisie, Restructurare..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-[11.5px]">
            <input type="checkbox" checked={form.isRehirable} onChange={(e) => setForm({ ...form, isRehirable: e.target.checked })} />
            <span style={{ color: "var(--text-secondary)" }}>Re-angajabil</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="btn-secondary">Anulează</button>
          <button onClick={submit} className="btn-primary" style={{ background: "#EF4444" }} disabled={!form.reason}>Confirmă terminarea</button>
        </div>
      </div>
    </div>
  );
}
