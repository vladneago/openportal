"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Job {
  id: string; title: string; slug: string; department: string | null;
  location: string | null; type: string; workArrangement: string;
  status: string; salaryMin: string | null; salaryMax: string | null;
  salaryCurrency: string | null; applicationCount: number;
  publishedAt: string | null; createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "Ciornă", bg: "#F3F4F6", fg: "#52525B" },
  open: { label: "Deschis", bg: "#DCFCE7", fg: "#15803D" },
  paused: { label: "Pauzat", bg: "#FEF3C7", fg: "#B45309" },
  closed: { label: "Închis", bg: "#FEE2E2", fg: "#B91C1C" },
  filled: { label: "Ocupat", bg: "#DBEAFE", fg: "#1E40AF" },
};

export default function RecruitingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", slug: "", department: "", location: "",
    workArrangement: "on_site", type: "full_time",
    description: "", requirements: "", whatWeOffer: "",
    salaryMin: "", salaryMax: "", salaryCurrency: "RON", showSalary: false,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await api<Job[]>("/api/v1/hr/recruiting/jobs");
    if (res.success) setJobs(res.data || []);
    setLoading(false);
  }

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
  }

  async function handleCreate() {
    if (!form.title || !form.slug) return;
    const res = await api("/api/v1/hr/recruiting/jobs", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      }),
    });
    if (res.success) {
      setShowCreate(false);
      setForm({ title: "", slug: "", department: "", location: "", workArrangement: "on_site", type: "full_time", description: "", requirements: "", whatWeOffer: "", salaryMin: "", salaryMax: "", salaryCurrency: "RON", showSalary: false });
      await load();
    }
  }

  async function publish(id: string) {
    await api(`/api/v1/hr/recruiting/jobs/${id}/publish`, { method: "POST" });
    await load();
  }

  const filtered = jobs.filter((j) => filter === "all" || j.status === filter);
  const total = jobs.length;
  const open = jobs.filter((j) => j.status === "open").length;
  const totalApps = jobs.reduce((s, j) => s + (j.applicationCount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Recrutare</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Recrutare (ATS)</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-[11px]">+ Job nou</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="panel p-3">
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Total job-uri</p>
          <p className="text-[22px] font-semibold mt-1" style={{ color: "var(--text)" }}>{total}</p>
        </div>
        <div className="panel p-3">
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Deschise</p>
          <p className="text-[22px] font-semibold mt-1" style={{ color: "#10B981" }}>{open}</p>
        </div>
        <div className="panel p-3">
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Aplicanți totali</p>
          <p className="text-[22px] font-semibold mt-1" style={{ color: "var(--text)" }}>{totalApps}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[
          { id: "all", label: "Toate" },
          { id: "open", label: "Deschise" },
          { id: "draft", label: "Ciorne" },
          { id: "paused", label: "Pauzate" },
          { id: "closed", label: "Închise" },
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
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Job nou</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Titlu *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} />
            <input className="input" placeholder="slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            <input className="input" placeholder="Departament" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <input className="input" placeholder="Locație" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <select className="input" value={form.workArrangement} onChange={(e) => setForm({ ...form, workArrangement: e.target.value })}>
              <option value="on_site">La birou</option>
              <option value="hybrid">Hibrid</option>
              <option value="remote">Remote</option>
            </select>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="temporary">Temporar</option>
            </select>
            <input className="input" placeholder="Salariu min" type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
            <input className="input" placeholder="Salariu max" type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
          </div>
          <textarea className="input" rows={3} placeholder="Descriere" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="input" rows={3} placeholder="Cerințe" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <textarea className="input" rows={2} placeholder="Ce oferim" value={form.whatWeOffer} onChange={(e) => setForm({ ...form, whatWeOffer: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Creează</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="grid gap-3 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px 90px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span>Poziție</span><span>Departament</span><span>Salariu</span><span>Aplicanți</span><span>Status</span><span></span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Niciun job.</div>
        ) : filtered.map((j) => {
          const st = STATUS_BADGE[j.status] || STATUS_BADGE.draft;
          return (
            <div key={j.id} className="grid gap-3 items-center px-4 py-3" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px 90px", borderBottom: "1px solid var(--page-bg)" }}>
              <div>
                <Link href={`/hr/recruiting/${j.id}`} className="text-[12.5px] font-medium no-underline" style={{ color: "var(--text)" }}>{j.title}</Link>
                <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{j.location || "—"} · {j.workArrangement} · {j.type}</p>
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{j.department || "—"}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                {j.salaryMin && j.salaryMax ? `${Number(j.salaryMin).toLocaleString()}–${Number(j.salaryMax).toLocaleString()} ${j.salaryCurrency}` : "—"}
              </span>
              <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{j.applicationCount || 0}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
              <div className="flex gap-1">
                {j.status === "draft" && (
                  <button onClick={() => publish(j.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#10B981" }}>Publică</button>
                )}
                <Link href={`/hr/recruiting/${j.id}`} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded no-underline" style={{ color: "#6366F1" }}>Detalii</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
