"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Site-uri", href: "/sites", icon: SitesIcon },
  { name: "Documente", href: "/documents", icon: DocumentsIcon },
  { name: "Pagini", href: "/pages", icon: PagesIcon },
  { name: "Tabele", href: "/tables", icon: TablesIcon },
  { name: "Formulare", href: "/forms", icon: FormsIcon },
  { name: "Workflow-uri", href: "/workflows", icon: WorkflowIcon },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* ─── Sidebar ─── */}
      <aside
        className="hidden lg:flex lg:flex-col shrink-0 overflow-hidden"
        style={{
          width: "var(--sidebar-width)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Workspace header */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "var(--color-text)" }}
            >
              <span className="text-white text-xs font-medium">O</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--color-text)" }}>
                OpenPortal
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--color-text-tertiary)" }}>
                Acme Corporation
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <button
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] transition-colors"
            style={{
              color: "var(--color-text-tertiary)",
              background: "var(--color-subtle)",
            }}
          >
            <SearchSmallIcon />
            <span>Caută...</span>
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--color-muted)", color: "var(--color-text-tertiary)" }}
            >
              ⌘K
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-none px-2.5">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] transition-all duration-100"
                  style={{
                    color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                    background: isActive ? "var(--color-subtle)" : "transparent",
                    fontWeight: isActive ? 500 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "var(--color-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <item.icon active={isActive} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Section label */}
          <div
            className="mt-6 mb-2 px-2.5 text-[10px] font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Site-uri recente
          </div>
          <div className="space-y-0.5">
            {["Intranet Acme", "Echipa IT", "Proiect Phoenix"].map((name) => (
              <a
                key={name}
                href="#"
                className="flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  className="w-[18px] h-[18px] rounded flex items-center justify-center text-[9px] font-medium shrink-0"
                  style={{ background: "var(--color-subtle)", color: "var(--color-text-tertiary)" }}
                >
                  {name.charAt(0)}
                </span>
                <span className="truncate">{name}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-2.5 py-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <SettingsSmallIcon />
            Setări
          </Link>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between h-12 px-6 shrink-0"
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div />

          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button
              className="relative p-1.5 rounded-md transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
              />
            </button>

            {/* Avatar */}
            <button
              className="ml-1 h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors"
              style={{ background: "var(--color-subtle)", color: "var(--color-text-secondary)" }}
            >
              AI
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-none">
          <div className="max-w-5xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Icons ─── */

function SearchSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function SettingsSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281a1.798 1.798 0 0 0 .865.997 7.5 7.5 0 0 1 .22.127c.33.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827a1.82 1.82 0 0 0-.43.992 6.854 6.854 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456a1.82 1.82 0 0 0-1.076.124c-.073.044-.146.086-.22.128a1.797 1.797 0 0 0-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281a1.797 1.797 0 0 0-.644-.87 6.48 6.48 0 0 1-.22-.127 1.82 1.82 0 0 0-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SitesIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3.5 9h17M3.5 15h17" />
    </svg>
  );
}

function DocumentsIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function PagesIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
    </svg>
  );
}

function TablesIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function FormsIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

function WorkflowIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: active ? 1 : 0.5 }}>
      <circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M5 8v2a4 4 0 0 0 4 4h2M19 8v2a4 4 0 0 1-4 4h-2" />
    </svg>
  );
}
