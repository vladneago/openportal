"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface ProjectItem { id: string; title: string; slug: string; status: string; color: string; taskCount: number; doneTaskCount: number; startDate: string | null; endDate: string | null; }

const STATUS: Record<string, { label: string; color: string }> = {
  planning: { label: "Planificare", color: "#71717A" }, active: { label: "Activ", color: "#10B981" },
  on_hold: { label: "Pauză", color: "#F59E0B" }, completed: { label: "Finalizat", color: "#6366F1" }, cancelled: { label: "Anulat", color: "#EF4444" },
};

export default function ProjectsPage() {
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", color: "#6366F1" });

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    setLoading(true);
    const res = await api("/api/v1/projects");
    if (res.success) setProjectList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    const slug = form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
    await api("/api/v1/projects", { method: "POST", body: JSON.stringify({ ...form, slug }) });
    setShowCreate(false); setForm({ title: "", color: "#6366F1" }); await loadProjects();
  }

  async function handleDelete(id: string) { await api(`/api/v1/projects/${id}`, { method: "DELETE" }); await loadProjects(); }

  if (!loading && projectList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Proiecte</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Gestionează proiectele echipei</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>📋</div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun proiect creat</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează un proiect cu task-uri, milestones și timeline.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Proiect nou</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Proiecte</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{projectList.length} proiecte</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Proiect nou</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nume proiect</label>
            <input className="input" autoFocus placeholder="ex: Redesign Website, Migrare Server..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} />
          </div>
          <div className="w-20">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Culoare</label>
            <input type="color" className="w-full h-[34px] rounded-md border-0 cursor-pointer" style={{ boxShadow: "0 0 0 1px var(--border-hover)" }} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <button className="btn-primary shrink-0" onClick={handleCreate}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => setShowCreate(false)}>Anulează</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {projectList.map((p) => {
          const st = STATUS[p.status] || STATUS.planning;
          const progress = p.taskCount > 0 ? Math.round((p.doneTaskCount / p.taskCount) * 100) : 0;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="no-underline">
              <div className="panel p-4 transition-all cursor-pointer" onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)")} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                </div>
                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text)" }}>{p.title}</p>
                <div className="flex items-center gap-3 text-[10.5px] mb-3" style={{ color: "var(--text-tertiary)" }}>
                  <span>{p.taskCount} task-uri</span>
                  <span>{p.doneTaskCount} completate</span>
                </div>
                {p.taskCount > 0 && (
                  <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: p.color }} />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
