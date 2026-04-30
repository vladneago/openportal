"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { async function load() { const res = await api("/api/v1/analytics/overview"); if (res.success) setStats(res.data); setLoading(false); } load(); }, []);

  const formatBytes = (b: number) => { if (!b) return "0 B"; if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`; if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`; return `${(b / 1073741824).toFixed(2)} GB`; };

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;
  if (!stats) return null;

  const sections = [
    { title: "Nucleu", items: [
      { label: "Site-uri", value: stats.sites, icon: "🌐" },
      { label: "Utilizatori", value: stats.users, icon: "👥" },
      { label: "Pagini", value: `${stats.publishedPages}/${stats.pages}`, icon: "📄" },
      { label: "Stocare", value: formatBytes(stats.storageBytes), icon: "💾" },
    ]},
    { title: "Conținut", items: [
      { label: "Documente", value: stats.documents, icon: "📁" },
      { label: "Biblioteci", value: stats.libraries, icon: "📚" },
      { label: "Tabele", value: stats.tables, icon: "📊" },
      { label: "Formulare", value: stats.forms, icon: "📝" },
    ]},
    { title: "Comunicare", items: [
      { label: "Canale chat", value: stats.chatChannels, icon: "💬" },
      { label: "Evenimente calendar", value: stats.calendarEvents, icon: "📅" },
      { label: "Automatizări", value: stats.workflows, icon: "⚡" },
    ]},
    { title: "Verticale", items: [
      { label: "Cursuri", value: stats.courses, icon: "🎓" },
      { label: "Joburi", value: stats.jobs, icon: "💼" },
      { label: "Proiecte", value: stats.projects, icon: "📋" },
      { label: "Tichete suport", value: stats.tickets, icon: "🎫" },
      { label: "Deal-uri CRM", value: stats.deals, icon: "🤝" },
      { label: "Contacte", value: stats.contacts, icon: "📇" },
      { label: "Facturi", value: stats.invoices, icon: "🧾" },
    ]},
  ];

  const totalContent = (stats.sites || 0) + (stats.pages || 0) + (stats.documents || 0) + (stats.tables || 0) + (stats.forms || 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Analytics</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Statistici platforma — 27 module</p>
      </div>

      <div className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden mb-8" style={{ background: "var(--border-hover)" }}>
        <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>Total conținut</p>
          <p className="text-[28px] font-medium leading-none" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>{totalContent}</p>
        </div>
        <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>Utilizatori</p>
          <p className="text-[28px] font-medium leading-none" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>{stats.users}</p>
        </div>
        <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>Stocare</p>
          <p className="text-[28px] font-medium leading-none" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>{formatBytes(stats.storageBytes)}</p>
        </div>
        <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>Module active</p>
          <p className="text-[28px] font-medium leading-none" style={{ color: "var(--accent)", letterSpacing: "-0.04em" }}>27</p>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>{section.title}</h2>
            <div className="grid grid-cols-4 gap-3">
              {section.items.map((m) => (
                <div key={m.label} className="panel p-4 transition-all"
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{m.label}</span>
                    <span className="text-base">{m.icon}</span>
                  </div>
                  <p className="text-2xl font-medium" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 panel p-5">
        <h2 className="text-[13px] font-medium mb-3" style={{ color: "var(--text)" }}>API Documentation</h2>
        <p className="text-[12px] mb-3" style={{ color: "var(--text-tertiary)" }}>OpenPortal API v1.2 — 27 modules, REST, JWT auth</p>
        <div className="flex gap-2">
          <a href="http://localhost:4000/api/docs/ui" target="_blank" rel="noopener noreferrer" className="btn-primary no-underline">
            Swagger UI →
          </a>
          <a href="http://localhost:4000/api/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary no-underline">
            OpenAPI JSON
          </a>
        </div>
      </div>
    </div>
  );
}
