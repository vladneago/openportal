"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "draft" | "published" | "archived";
  viewCount: number;
  updatedAt: string;
  publishedAt: string | null;
}

const STATUS_MAP = {
  draft: { label: "Ciornă", color: "#71717A" },
  published: { label: "Publicat", color: "#10B981" },
  archived: { label: "Arhivat", color: "#F59E0B" },
};

export default function PagesListPage() {
  const [pageList, setPageList] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadPages(); }, []);

  async function loadPages() {
    setLoading(true);
    const res = await api("/api/v1/pages");
    if (res.success) setPageList(res.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const sitesRes = await api("/api/v1/sites");
    if (!sitesRes.success || !sitesRes.data?.length) return;
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
    const res = await api("/api/v1/pages", {
      method: "POST",
      body: JSON.stringify({ siteId: sitesRes.data[0].id, title: newTitle.trim(), slug }),
    });
    if (res.success && res.data) {
      setShowCreate(false);
      setNewTitle("");
      window.location.href = `/pages/${res.data.id}/edit`;
    }
  }

  async function handlePublish(id: string) {
    await api(`/api/v1/pages/${id}/publish`, { method: "POST" });
    await loadPages();
  }

  async function handleUnpublish(id: string) {
    await api(`/api/v1/pages/${id}/unpublish`, { method: "POST" });
    await loadPages();
  }

  async function handleDelete(id: string) {
    await api(`/api/v1/pages/${id}`, { method: "DELETE" });
    await loadPages();
  }

  const filtered = filter === "all" ? pageList.filter((p) => p.status !== "archived") : pageList.filter((p) => p.status === filter);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "acum";
    if (m < 60) return `acum ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `acum ${h}h`;
    return `acum ${Math.floor(h / 24)}z`;
  };

  if (!loading && pageList.length === 0 && !showCreate) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Pagini</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Creează și publică pagini de conținut</p>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Nicio pagină creată</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează prima pagină cu editorul vizual.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Pagină nouă
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Pagini</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{pageList.filter((p) => p.status !== "archived").length} pagini</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Pagină nouă
        </button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Titlul paginii</label>
            <input className="input" autoFocus placeholder="ex: Despre noi, Proceduri, Anunțuri..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowCreate(false); setNewTitle(""); } }} />
          </div>
          <button className="btn-primary shrink-0" onClick={handleCreate}>Creează și editează</button>
          <button className="btn-secondary shrink-0" onClick={() => { setShowCreate(false); setNewTitle(""); }}>Anulează</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 mb-5">
        {[{ id: "all", label: "Toate" }, { id: "draft", label: "Ciorne" }, { id: "published", label: "Publicate" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: filter === f.id ? "var(--text)" : "transparent", color: filter === f.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (filter !== f.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (filter !== f.id) e.currentTarget.style.background = "transparent"; }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Pages list */}
      <div className="panel">
        <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ gridTemplateColumns: "1fr 100px 80px 100px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <span>Titlu</span><span>Status</span><span>Vizualizări</span><span>Modificat</span><span></span>
        </div>

        {filtered.map((page) => {
          const st = STATUS_MAP[page.status];
          return (
            <div key={page.id} className="grid gap-4 items-center px-4 py-3 transition-colors"
              style={{ gridTemplateColumns: "1fr 100px 80px 100px 80px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div className="min-w-0">
                <Link href={`/pages/${page.id}/edit`} className="no-underline">
                  <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{page.title}</p>
                </Link>
                {page.excerpt && <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{page.excerpt}</p>}
              </div>
              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>
                {st.label}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{page.viewCount}</span>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{timeAgo(page.updatedAt)}</span>
              <div className="flex items-center gap-1">
                {page.status === "draft" ? (
                  <button onClick={() => handlePublish(page.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                    style={{ color: "#10B981" }} title="Publică"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#10B98115")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  </button>
                ) : page.status === "published" ? (
                  <button onClick={() => handleUnpublish(page.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                    style={{ color: "var(--text-tertiary)" }} title="Retrage"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </button>
                ) : null}
                <button onClick={() => handleDelete(page.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio pagină în această categorie.</div>
        )}
      </div>
    </div>
  );
}
