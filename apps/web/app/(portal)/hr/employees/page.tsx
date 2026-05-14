"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Employee {
  id: string; employeeNumber: string; firstName: string; lastName: string;
  preferredName: string | null; workEmail: string | null; workPhone: string | null;
  photoUrl: string | null; currentJobTitle: string | null;
  currentDepartmentId: string | null; currentLocationId: string | null;
  currentManagerId: string | null; status: string;
  workerType: string; hireDate: string | null;
}

interface Department { id: string; name: string; code: string; }
interface Location { id: string; name: string; city: string | null; }

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 30;

  const [form, setForm] = useState({
    employeeNumber: "",
    firstName: "", lastName: "", preferredName: "",
    workEmail: "", workPhone: "",
    workerType: "regular",
    hireDate: new Date().toISOString().slice(0, 10),
    jobTitle: "", departmentId: "", locationId: "",
    baseSalary: "",
  });

  useEffect(() => { loadFilters(); }, []);
  useEffect(() => { loadEmployees(); }, [search, filterDept, filterStatus, page]);

  async function loadFilters() {
    const [d, l] = await Promise.all([
      api<Department[]>("/api/v1/hr/departments"),
      api<Location[]>("/api/v1/hr/locations"),
    ]);
    if (d.success) setDepartments(d.data || []);
    if (l.success) setLocations(l.data || []);
  }

  async function loadEmployees() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filterDept) params.set("departmentId", filterDept);
    if (filterStatus) params.set("status", filterStatus);
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    const res = await api<Employee[]>(`/api/v1/hr/employees?${params}`);
    if (res.success) setEmployees(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.employeeNumber) return;
    const res = await api("/api/v1/hr/employees", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        departmentId: form.departmentId || undefined,
        locationId: form.locationId || undefined,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
      }),
    });
    if (res.success) {
      setShowCreate(false);
      setForm({ employeeNumber: "", firstName: "", lastName: "", preferredName: "", workEmail: "", workPhone: "", workerType: "regular", hireDate: new Date().toISOString().slice(0, 10), jobTitle: "", departmentId: "", locationId: "", baseSalary: "" });
      await loadEmployees();
    } else alert(res.error?.message || "Eroare");
  }

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const locMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Angajați</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Director angajați</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/org-chart" className="btn-secondary no-underline text-[11px]">Organigrama</Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-[11px]">+ Angajat nou</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input className="input flex-1 min-w-[200px] max-w-xs" placeholder="Caută după nume, email, număr…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="input max-w-[180px]" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(0); }}>
          <option value="">Toate departamentele</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input max-w-[140px]" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">Toate statusurile</option>
          <option value="active">Activ</option>
          <option value="leave_of_absence">Concediu</option>
          <option value="suspended">Suspendat</option>
          <option value="terminated">Terminat</option>
          <option value="pre_hire">Pre-hire</option>
        </select>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setView("grid")}
            className="border-0 cursor-pointer p-1.5 rounded"
            style={{ background: view === "grid" ? "var(--text)" : "transparent", color: view === "grid" ? "white" : "var(--text-secondary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setView("list")}
            className="border-0 cursor-pointer p-1.5 rounded"
            style={{ background: view === "list" ? "var(--text)" : "transparent", color: view === "list" ? "white" : "var(--text-secondary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Angajat nou</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input className="input" placeholder="Număr angajat *" value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} />
            <input className="input" placeholder="Prenume *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input className="input" placeholder="Nume *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input className="input" placeholder="Email muncă" type="email" value={form.workEmail} onChange={(e) => setForm({ ...form, workEmail: e.target.value })} />
            <input className="input" placeholder="Telefon" value={form.workPhone} onChange={(e) => setForm({ ...form, workPhone: e.target.value })} />
            <input className="input" placeholder="Funcție" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            <select className="input" value={form.workerType} onChange={(e) => setForm({ ...form, workerType: e.target.value })}>
              <option value="regular">Regular</option>
              <option value="fixed_term">Determinat</option>
              <option value="intern">Intern</option>
              <option value="apprentice">Ucenic</option>
              <option value="contractor">Contractor</option>
              <option value="consultant">Consultant</option>
            </select>
            <select className="input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">— Departament —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">— Locație —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input className="input" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            <input className="input" placeholder="Salariu (RON)" type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Creează</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {employees.map((e) => (
            <Link key={e.id} href={`/hr/employees/${e.id}`} className="panel p-3 no-underline transition-all"
              onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = "#6366F1")}
              onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = "var(--border)")}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
                  style={{ background: e.photoUrl ? `url(${e.photoUrl}) center/cover` : "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                  {!e.photoUrl && `${e.firstName[0]}${e.lastName[0]}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{e.preferredName || e.firstName} {e.lastName}</p>
                  <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{e.currentJobTitle || "—"}</p>
                </div>
              </div>
              <div className="space-y-0.5 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                {e.workEmail && <p className="truncate">📧 {e.workEmail}</p>}
                {e.currentDepartmentId && deptMap[e.currentDepartmentId] && <p className="truncate">🏢 {deptMap[e.currentDepartmentId]}</p>}
                {e.currentLocationId && locMap[e.currentLocationId] && <p className="truncate">📍 {locMap[e.currentLocationId]}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="grid gap-3 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "40px 1fr 100px 1fr 1fr 100px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span></span><span>Nume</span><span>Nr. ang.</span><span>Funcție</span><span>Email</span><span>Status</span><span></span>
          </div>
          {employees.map((e) => (
            <Link key={e.id} href={`/hr/employees/${e.id}`}
              className="grid gap-3 items-center px-4 py-2.5 no-underline transition-colors"
              style={{ gridTemplateColumns: "40px 1fr 100px 1fr 1fr 100px 80px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                style={{ background: e.photoUrl ? `url(${e.photoUrl}) center/cover` : "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                {!e.photoUrl && `${e.firstName[0]}${e.lastName[0]}`}
              </div>
              <span className="text-[12px] font-medium truncate" style={{ color: "var(--text)" }}>{e.preferredName || e.firstName} {e.lastName}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{e.employeeNumber}</span>
              <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{e.currentJobTitle || "—"}</span>
              <span className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{e.workEmail || "—"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit capitalize" style={{
                background: e.status === "active" ? "#DCFCE7" : "#FEE2E2",
                color: e.status === "active" ? "#15803D" : "#B91C1C",
              }}>{e.status}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>→</span>
            </Link>
          ))}
        </div>
      )}

      {employees.length >= limit && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-[11px]">← Anterior</button>
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Pagina {page + 1}</span>
          <button onClick={() => setPage(page + 1)} className="btn-secondary text-[11px]">Următor →</button>
        </div>
      )}
    </div>
  );
}
