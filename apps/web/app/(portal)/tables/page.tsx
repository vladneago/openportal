"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface TableItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
  defaultView: string;
  createdAt: string;
}

export default function TablesPage() {
  const [tableList, setTableList] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { loadTables(); }, []);

  async function loadTables() {
    setLoading(true);
    const res = await api("/api/v1/tables");
    if (res.success) setTableList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const sitesRes = await api("/api/v1/sites");
    if (!sitesRes.success || !sitesRes.data?.length) return;

    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    const res = await api("/api/v1/tables", {
      method: "POST",
      body: JSON.stringify({ siteId: sitesRes.data[0].id, title: newTitle.trim(), slug }),
    });

    if (res.success) {
      setShowCreate(false);
      setNewTitle("");
      await loadTables();
    }
  }

  async function handleDelete(id: string) {
    await api(`/api/v1/tables/${id}`, { method: "DELETE" });
    await loadTables();
  }

  if (!loading && tableList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Tabele</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Baze de date structurate pentru echipa ta</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun tabel creat</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează un tabel pentru a organiza date structurate.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tabel nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Tabele</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{tableList.length} tabele active</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Tabel nou
        </button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Numele tabelului</label>
            <input className="input" autoFocus placeholder="ex: Task-uri, Inventar, Contacte..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowCreate(false); setNewTitle(""); } }} />
          </div>
          <button className="btn-primary shrink-0" onClick={handleCreate}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => { setShowCreate(false); setNewTitle(""); }}>Anulează</button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {tableList.map((t) => (
            <Link key={t.id} href={`/tables/${t.id}`} className="no-underline">
              <div className="panel p-4 transition-all cursor-pointer"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{t.icon}</span>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(t.id); }}
                    className="border-0 bg-transparent p-1 rounded cursor-pointer opacity-0 transition-opacity"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{t.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{t.description || "Fără descriere"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
