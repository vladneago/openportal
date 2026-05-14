"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Cycle { id: string; name: string; type: string; year: number; isActive: boolean; isCompleted: boolean; }

export default function PerformancePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "annual",
    year: new Date().getFullYear(),
    ratingMethod: "5_point",
    goalSettingStart: "", goalSettingEnd: "",
    selfReviewStart: "", selfReviewEnd: "",
    managerReviewStart: "", managerReviewEnd: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await api<Cycle[]>("/api/v1/hr/performance/cycles");
    if (res.success) setCycles(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    await api("/api/v1/hr/performance/cycles", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        goalSettingStart: form.goalSettingStart ? new Date(form.goalSettingStart).toISOString().slice(0, 10) : undefined,
        goalSettingEnd: form.goalSettingEnd ? new Date(form.goalSettingEnd).toISOString().slice(0, 10) : undefined,
        selfReviewStart: form.selfReviewStart ? new Date(form.selfReviewStart).toISOString().slice(0, 10) : undefined,
        selfReviewEnd: form.selfReviewEnd ? new Date(form.selfReviewEnd).toISOString().slice(0, 10) : undefined,
        managerReviewStart: form.managerReviewStart ? new Date(form.managerReviewStart).toISOString().slice(0, 10) : undefined,
        managerReviewEnd: form.managerReviewEnd ? new Date(form.managerReviewEnd).toISOString().slice(0, 10) : undefined,
      }),
    });
    setShowCreate(false);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Performanță</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Management Performanță</h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Cicluri, obiective (OKR), evaluări, calibrare și 9-box</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-[11px]">+ Ciclu nou</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-5 space-y-3">
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Ciclu nou de performanță</h3>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Nume ciclu *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="annual">Anual</option>
              <option value="biannual">Bi-anual</option>
              <option value="quarterly">Trimestrial</option>
              <option value="project">Proiect</option>
              <option value="probation">Perioadă probă</option>
            </select>
            <input className="input" type="number" placeholder="An" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            <select className="input" value={form.ratingMethod} onChange={(e) => setForm({ ...form, ratingMethod: e.target.value })}>
              <option value="5_point">Scală 1-5</option>
              <option value="3_point">Scală 1-3</option>
              <option value="9_box">9-Box</option>
              <option value="narrative">Narativ</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10.5px] mb-1" style={{ color: "var(--text-tertiary)" }}>Stabilire obiective</label>
              <div className="flex gap-1">
                <input className="input" type="date" value={form.goalSettingStart} onChange={(e) => setForm({ ...form, goalSettingStart: e.target.value })} />
                <input className="input" type="date" value={form.goalSettingEnd} onChange={(e) => setForm({ ...form, goalSettingEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] mb-1" style={{ color: "var(--text-tertiary)" }}>Auto-evaluare</label>
              <div className="flex gap-1">
                <input className="input" type="date" value={form.selfReviewStart} onChange={(e) => setForm({ ...form, selfReviewStart: e.target.value })} />
                <input className="input" type="date" value={form.selfReviewEnd} onChange={(e) => setForm({ ...form, selfReviewEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] mb-1" style={{ color: "var(--text-tertiary)" }}>Evaluare manager</label>
              <div className="flex gap-1">
                <input className="input" type="date" value={form.managerReviewStart} onChange={(e) => setForm({ ...form, managerReviewStart: e.target.value })} />
                <input className="input" type="date" value={form.managerReviewEnd} onChange={(e) => setForm({ ...form, managerReviewEnd: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Creează ciclu</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
        ) : cycles.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun ciclu de performanță încă.</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Creează primul ciclu pentru a începe.</p>
          </div>
        ) : cycles.map((c) => (
          <div key={c.id} className="panel p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{c.name}</p>
                <p className="text-[10.5px] capitalize mt-0.5" style={{ color: "var(--text-tertiary)" }}>{c.type} · {c.year}</p>
              </div>
              {c.isActive && <span className="text-[9.5px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#DCFCE7", color: "#15803D" }}>ACTIV</span>}
              {c.isCompleted && <span className="text-[9.5px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#F3F4F6", color: "#52525B" }}>COMPLET</span>}
            </div>
            <div className="space-y-1 mt-3">
              <Link href={`/hr/performance/${c.id}/goals`} className="flex items-center justify-between py-1 no-underline text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <span>🎯 Obiective</span><span>→</span>
              </Link>
              <Link href={`/hr/performance/${c.id}/reviews`} className="flex items-center justify-between py-1 no-underline text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <span>📋 Evaluări</span><span>→</span>
              </Link>
              <Link href={`/hr/performance/${c.id}/calibration`} className="flex items-center justify-between py-1 no-underline text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <span>⚖️ Calibrare</span><span>→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
