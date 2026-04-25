"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Stats {
  sites: number; users: number; documents: number; storageBytes: number; libraries: number;
  tables: number; tableRows: number; pages: number; publishedPages: number;
  forms: number; formSubmissions: number; workflows: number; workflowRuns: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await api("/api/v1/analytics/overview");
      if (res.success) setStats(res.data);
      setLoading(false);
    }
    load();
  }, []);

  const formatBytes = (b: number) => {
    if (b === 0) return "0 B";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1073741824).toFixed(2)} GB`;
  };

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă statisticile...</div>;
  if (!stats) return null;

  const sections = [
    {
      title: "Conținut",
      metrics: [
        { label: "Site-uri", value: stats.sites, icon: "🌐" },
        { label: "Pagini publicate", value: `${stats.publishedPages} / ${stats.pages}`, icon: "📄" },
        { label: "Documente", value: stats.documents, icon: "📁" },
        { label: "Biblioteci", value: stats.libraries, icon: "📚" },
      ],
    },
    {
      title: "Date",
      metrics: [
        { label: "Tabele", value: stats.tables, icon: "📊" },
        { label: "Rânduri totale", value: stats.tableRows, icon: "📋" },
        { label: "Formulare", value: stats.forms, icon: "📝" },
        { label: "Răspunsuri primite", value: stats.formSubmissions, icon: "✉" },
      ],
    },
    {
      title: "Platformă",
      metrics: [
        { label: "Utilizatori", value: stats.users, icon: "👥" },
        { label: "Stocare folosită", value: formatBytes(stats.storageBytes), icon: "💾" },
        { label: "Workflow-uri", value: stats.workflows, icon: "⚡" },
        { label: "Execuții workflow", value: stats.workflowRuns, icon: "▶" },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Analytics</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Statistici generale ale platformei</p>
      </div>

      {/* Overview metrics bar */}
      <div className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden mb-8" style={{ background: "var(--border-hover)" }}>
        <OverviewMetric label="Total conținut" value={String(stats.sites + stats.pages + stats.documents)} sub="site-uri, pagini, documente" />
        <OverviewMetric label="Utilizatori" value={String(stats.users)} sub="activi în platformă" />
        <OverviewMetric label="Stocare" value={formatBytes(stats.storageBytes)} sub="din 500 GB" />
        <OverviewMetric label="Automatizări" value={`${stats.workflowRuns} execuții`} sub={`${stats.workflows} workflow-uri`} />
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>{section.title}</h2>
            <div className="grid grid-cols-4 gap-3">
              {section.metrics.map((m) => (
                <div key={m.label} className="panel p-4 transition-all"
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{m.label}</span>
                    <span className="text-base">{m.icon}</span>
                  </div>
                  <p className="text-2xl font-medium" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Usage bar chart (visual representation) */}
      <div className="mt-8">
        <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>Distribuție conținut</h2>
        <div className="panel p-5">
          <div className="space-y-4">
            <UsageBar label="Pagini" current={stats.pages} max={Math.max(stats.pages, stats.documents, stats.tableRows, 1)} color="#6366F1" />
            <UsageBar label="Documente" current={stats.documents} max={Math.max(stats.pages, stats.documents, stats.tableRows, 1)} color="#0EA5E9" />
            <UsageBar label="Rânduri tabele" current={stats.tableRows} max={Math.max(stats.pages, stats.documents, stats.tableRows, 1)} color="#10B981" />
            <UsageBar label="Răspunsuri formulare" current={stats.formSubmissions} max={Math.max(stats.pages, stats.documents, stats.tableRows, stats.formSubmissions, 1)} color="#F59E0B" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-[28px] font-medium leading-none mb-1" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>{value}</p>
      <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
    </div>
  );
}

function UsageBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px]" style={{ color: "var(--text)" }}>{label}</span>
        <span className="text-[12px] font-medium" style={{ color }}>{current}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, minWidth: current > 0 ? 4 : 0 }} />
      </div>
    </div>
  );
}
