"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Course {
  id: string; code: string; title: string; description: string | null;
  category: string | null; level: string | null; format: string;
  durationMinutes: number | null; isMandatory: boolean;
  enrollmentCount: number; averageRating: string | null;
  status: string; thumbnailUrl: string | null;
}

export default function LearningPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "", title: "", description: "",
    category: "", level: "beginner",
    language: "ro", format: "self_paced",
    durationMinutes: "", isMandatory: false,
  });

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await api<Course[]>(`/api/v1/hr/learning/courses${q}`);
    if (res.success) setCourses(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.code || !form.title) return;
    await api("/api/v1/hr/learning/courses", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      }),
    });
    setShowCreate(false);
    setForm({ code: "", title: "", description: "", category: "", level: "beginner", language: "ro", format: "self_paced", durationMinutes: "", isMandatory: false });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Învățare</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Învățare & Dezvoltare</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>LMS — cursuri, învățare structurată, certificări, competențe</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-[11px]">+ Curs nou</button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input className="input flex-1 max-w-xs" placeholder="Caută cursuri…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {showCreate && (
        <div className="panel p-4 mb-5 space-y-3">
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Curs nou</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input className="input" placeholder="Cod curs *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input col-span-2" placeholder="Titlu *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input" placeholder="Categorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="beginner">Începător</option>
              <option value="intermediate">Intermediar</option>
              <option value="advanced">Avansat</option>
            </select>
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              <option value="self_paced">Self-paced</option>
              <option value="instructor_led">Instructor-led</option>
              <option value="virtual_classroom">Virtual classroom</option>
              <option value="blended">Blended</option>
              <option value="certification">Certificare</option>
            </select>
            <input className="input" type="number" placeholder="Durată (minute)" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
            <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="ro">Română</option>
              <option value="en">English</option>
            </select>
            <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} /><span style={{ color: "var(--text-secondary)" }}>Obligatoriu</span></label>
          </div>
          <textarea className="input" rows={3} placeholder="Descriere" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Creează curs</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun curs încă.</div>
        ) : courses.map((c) => (
          <div key={c.id} className="panel overflow-hidden">
            <div className="h-24" style={{
              background: c.thumbnailUrl ? `url(${c.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #8B5CF6, #6366F1)",
            }}>
              {c.isMandatory && <span className="absolute m-2 text-[9.5px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(255,255,255,0.95)", color: "#B91C1C" }}>OBLIGATORIU</span>}
            </div>
            <div className="p-3">
              <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{c.title}</p>
              <p className="text-[10.5px] mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{c.description || "—"}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {c.category && <span className="capitalize">{c.category}</span>}
                {c.durationMinutes && <span>· {Math.round(c.durationMinutes / 60)}h</span>}
                {c.level && <span className="capitalize">· {c.level}</span>}
              </div>
              <div className="flex items-center justify-between mt-3 text-[10.5px]">
                <span style={{ color: "var(--text-secondary)" }}>{c.enrollmentCount} înrolări</span>
                {c.averageRating && <span style={{ color: "#F59E0B" }}>★ {Number(c.averageRating).toFixed(1)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
