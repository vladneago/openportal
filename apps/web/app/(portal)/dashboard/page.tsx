"use client";

import { useState, useEffect } from "react";
import { api, getUser } from "@/lib/api";
import Link from "next/link";

interface Stats {
  sites: number; users: number; documents: number; storageBytes: number;
  libraries: number; tables: number; tableRows: number; pages: number; publishedPages: number;
  forms: number; formSubmissions: number; workflows: number; workflowRuns: number;
}

interface SiteItem { id: string; title: string; slug: string; type: string; }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
const [user, setUser] = useState<any>(null);

useEffect(() => {
  setUser(getUser());
}, []);

  useEffect(() => {
    async function load() {
      const [statsRes, sitesRes] = await Promise.all([
        api("/api/v1/analytics/overview"),
        api("/api/v1/sites"),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (sitesRes.success) setSites(sitesRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const formatBytes = (b: number) => {
    if (!b) return "0 B";
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1073741824).toFixed(2)} GB`;
  };

  const siteColors: Record<string, string> = { communication: "#6366F1", team: "#0EA5E9", project: "#F59E0B", wiki: "#10B981" };
  const siteLabels: Record<string, string> = { communication: "Comunicare", team: "Echipă", project: "Proiect", wiki: "Wiki" };

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>
          Bine ai revenit{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Iată ce se întâmplă în organizația ta
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden mb-8" style={{ background: "var(--border-hover)" }}>
        <MetricCard label="Site-uri active" value={String(stats?.sites || 0)} sub={`${stats?.pages || 0} pagini`} trend={stats?.sites ? "up" : "neutral"} />
        <MetricCard label="Documente" value={String(stats?.documents || 0)} sub={formatBytes(stats?.storageBytes || 0)} trend={stats?.documents ? "up" : "neutral"} />
        <MetricCard label="Membri echipă" value={String(stats?.users || 0)} sub="activi" trend="up" />
        <MetricCard label="Automatizări" value={String(stats?.workflows || 0)} sub={`${stats?.workflowRuns || 0} execuții`} trend={stats?.workflowRuns ? "up" : "neutral"} />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* Left */}
        <div>
          {/* Quick overview cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <OverviewCard href="/documents" icon="📁" label="Documente" value={String(stats?.documents || 0)} sub={`${stats?.libraries || 0} biblioteci`} />
            <OverviewCard href="/tables" icon="📊" label="Tabele" value={String(stats?.tables || 0)} sub={`${stats?.tableRows || 0} rânduri`} />
            <OverviewCard href="/forms" icon="📝" label="Formulare" value={String(stats?.forms || 0)} sub={`${stats?.formSubmissions || 0} răspunsuri`} />
          </div>

          {/* Quick actions */}
          <SectionHeader title="Începe" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: "Creează site", desc: "Spațiu de lucru pentru echipă", href: "/sites" },
              { label: "Încarcă fișiere", desc: "Documente, imagini, PDF-uri", href: "/documents" },
              { label: "Creează pagină", desc: "Editor vizual drag & drop", href: "/pages" },
              { label: "Formular nou", desc: "Colectează date structurate", href: "/forms" },
              { label: "Tabel de date", desc: "Organizează informații", href: "/tables" },
              { label: "Automatizare", desc: "Workflow-uri inteligente", href: "/workflows" },
            ].map((qa) => (
              <Link key={qa.label} href={qa.href} className="no-underline">
                <div className="rounded-lg px-4 py-3.5 transition-all cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{qa.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{qa.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Sites */}
          <SectionHeader title="Site-uri" action={<Link href="/sites" className="no-underline text-[11px]" style={{ color: "var(--text-tertiary)" }}>Toate →</Link>} />
          <div className="panel mt-4">
            {sites.length === 0 ? (
              <div className="py-8 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                Niciun site creat.<br />
                <Link href="/sites" className="font-medium no-underline" style={{ color: "var(--accent)" }}>Creează primul site</Link>
              </div>
            ) : sites.slice(0, 5).map((site) => {
              const color = siteColors[site.type] || "#A1A1AA";
              return (
                <Link key={site.id} href={`/sites/${site.slug}`} className="no-underline">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--page-bg)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[11px] font-semibold shrink-0"
                      style={{ background: color + "12", color }}>{site.title.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{site.title}</p>
                      <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{siteLabels[site.type] || site.type}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Platform stats */}
          <div className="mt-6">
            <SectionHeader title="Platformă" action={<Link href="/admin/analytics" className="no-underline text-[11px]" style={{ color: "var(--text-tertiary)" }}>Detalii →</Link>} />
            <div className="panel p-4 mt-4">
              <div className="space-y-3">
                <StatRow label="Pagini" value={`${stats?.publishedPages || 0} publicate din ${stats?.pages || 0}`} pct={stats?.pages ? ((stats?.publishedPages || 0) / stats.pages) * 100 : 0} color="#6366F1" />
                <StatRow label="Formulare" value={`${stats?.formSubmissions || 0} răspunsuri`} pct={50} color="#F59E0B" />
                <StatRow label="Stocare" value={formatBytes(stats?.storageBytes || 0)} pct={stats?.storageBytes ? (stats.storageBytes / 536870912000) * 100 : 0} color="#10B981" />
              </div>
            </div>
          </div>

          {/* Setup progress */}
          <div className="mt-6">
            <SectionHeader title="Configurare" />
            <div className="panel p-4 mt-4">
              {(() => {
                const steps = [
                  { label: "Creează un site", done: (stats?.sites || 0) > 0 },
                  { label: "Încarcă documente", done: (stats?.documents || 0) > 0 },
                  { label: "Invită echipa", done: (stats?.users || 0) > 1 },
                  { label: "Creează un tabel", done: (stats?.tables || 0) > 0 },
                  { label: "Publică o pagină", done: (stats?.publishedPages || 0) > 0 },
                  { label: "Creează un formular", done: (stats?.forms || 0) > 0 },
                ];
                const completed = steps.filter((s) => s.done).length;
                const pct = Math.round((completed / steps.length) * 100);
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{completed} din {steps.length} completați</span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>{pct}%</span>
                    </div>
                    <div className="h-[3px] rounded-sm mb-4" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: s.done ? "var(--text)" : "transparent", border: s.done ? "none" : "1.5px solid var(--border-hover)" }}>
                            {s.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <span className="text-xs" style={{ color: s.done ? "var(--text-tertiary)" : "var(--text-secondary)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{title}</h2>
      {action}
    </div>
  );
}

function MetricCard({ label, value, sub, trend }: { label: string; value: string; sub: string; trend: "up" | "neutral" }) {
  return (
    <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-medium leading-none" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>{value}</span>
        <span className="text-[10.5px] font-medium" style={{ color: trend === "up" ? "var(--success)" : "var(--text-tertiary)" }}>{sub}</span>
      </div>
    </div>
  );
}

function OverviewCard({ href, icon, label, value, sub }: { href: string; icon: string; label: string; value: string; sub: string }) {
  return (
    <Link href={href} className="no-underline">
      <div className="panel p-4 transition-all cursor-pointer"
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
          <span className="text-base">{icon}</span>
        </div>
        <p className="text-xl font-medium" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>{value}</p>
        <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
      </div>
    </Link>
  );
}

function StatRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px]" style={{ color: "var(--text)" }}>{label}</span>
        <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color, minWidth: pct > 0 ? 4 : 0 }} />
      </div>
    </div>
  );
}
