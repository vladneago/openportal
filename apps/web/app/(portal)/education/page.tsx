"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface CourseItem { id: string; title: string; slug: string; description: string | null; status: string; coverImage: string | null; moduleCount: number; lessonCount: number; enrollmentCount: number; settings: any; updatedAt: string; }

const STATUS = { draft: { label: "Ciornă", color: "#71717A" }, published: { label: "Publicat", color: "#10B981" }, archived: { label: "Arhivat", color: "#F59E0B" } };
const DIFFICULTY_LABELS: Record<string, string> = { beginner: "Începător", intermediate: "Intermediar", advanced: "Avansat" };

export default function EducationPage() {
  const [courseList, setCourseList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    setLoading(true);
    const res = await api("/api/v1/education/courses");
    if (res.success) setCourseList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    const slug = form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
    const res = await api("/api/v1/education/courses", { method: "POST", body: JSON.stringify({ title: form.title.trim(), slug, description: form.description || undefined }) });
    if (res.success) { setShowCreate(false); setForm({ title: "", description: "" }); await loadCourses(); }
  }

  async function handlePublish(id: string) { await api(`/api/v1/education/courses/${id}/publish`, { method: "POST" }); await loadCourses(); }
  async function handleDelete(id: string) { await api(`/api/v1/education/courses/${id}`, { method: "DELETE" }); await loadCourses(); }

  if (!loading && courseList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Educație</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Creează și gestionează cursuri online</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>🎓</div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun curs creat</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează un curs cu module, lecții și evaluări.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Curs nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Educație</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{courseList.length} cursuri</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Curs nou
        </button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 space-y-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Titlu curs</label>
            <input className="input" autoFocus placeholder="ex: Introducere în Management de Proiect" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Descriere (opțional)</label>
            <textarea className="input" rows={2} placeholder="Despre ce este acest curs..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "none" }} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleCreate}>Creează curs</button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {courseList.map((course) => {
          const st = STATUS[course.status as keyof typeof STATUS] || STATUS.draft;
          const difficulty = course.settings?.difficulty;
          return (
            <Link key={course.id} href={`/education/courses/${course.id}`} className="no-underline">
              <div className="panel overflow-hidden transition-all cursor-pointer"
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                {/* Cover */}
                <div className="h-24 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F108, #8B5CF608)" }}>
                  <span className="text-3xl">🎓</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                    {difficulty && <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{DIFFICULTY_LABELS[difficulty]}</span>}
                  </div>
                  <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text)" }}>{course.title}</p>
                  {course.description && <p className="text-[11px] mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{course.description}</p>}
                  <div className="flex items-center gap-3 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                    <span>{course.moduleCount} module</span>
                    <span>{course.lessonCount} lecții</span>
                    <span>{course.enrollmentCount} studenți</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
