"use client";

import { useState } from "react";

const MOCK_RESULTS = [
  { type: "document", title: "Manual Angajat 2025.pdf", location: "Intranet Acme / Documente", icon: "file", color: "#EF4444" },
  { type: "document", title: "Buget Q2.xlsx", location: "Echipa IT / Financiar", icon: "file", color: "#10B981" },
  { type: "site", title: "Proiect Phoenix", location: "Site · Proiect", icon: "site", color: "#F59E0B" },
  { type: "page", title: "Politica de confidențialitate", location: "Intranet Acme / Pagini", icon: "page", color: "#3B82F6" },
  { type: "user", title: "Maria Popescu", location: "HR Manager · Resurse Umane", icon: "user", color: "#EC4899" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all", label: "Toate" },
    { id: "document", label: "Documente" },
    { id: "site", label: "Site-uri" },
    { id: "page", label: "Pagini" },
    { id: "user", label: "Persoane" },
  ];

  const filtered = filter === "all" ? MOCK_RESULTS : MOCK_RESULTS.filter((r) => r.type === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Căutare</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Caută în documente, site-uri, pagini și persoane</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="search"
          className="input pl-10 py-3"
          placeholder="Caută orice în OpenPortal..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{ fontSize: 14 }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{
              background: filter === f.id ? "var(--text)" : "transparent",
              color: filter === f.id ? "#fff" : "var(--text-secondary)",
            }}
            onMouseEnter={(e) => { if (filter !== f.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (filter !== f.id) e.currentTarget.style.background = "transparent"; }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.length > 0 ? (
        <div className="panel">
          <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            {filtered.length} rezultate pentru &quot;{query}&quot;
          </div>
          {filtered.map((r, i) => (
            <div key={i} className="panel-row">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.color + "12" }}>
                {r.icon === "file" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>}
                {r.icon === "site" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="1.5"><circle cx="12" cy="12" r="9"/></svg>}
                {r.icon === "page" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M8 13h8M8 17h8"/></svg>}
                {r.icon === "user" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{r.title}</p>
                <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{r.location}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Începe să scrii pentru a căuta</p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Caută prin documente, site-uri, pagini și persoane</p>
        </div>
      )}
    </div>
  );
}
