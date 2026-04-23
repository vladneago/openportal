"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "sites", label: "Site-uri", href: "/sites" },
  { id: "documents", label: "Documente", href: "/documents" },
  { id: "pages", label: "Pagini", href: "/pages" },
  { id: "tables", label: "Tabele", href: "/tables" },
  { id: "forms", label: "Formulare", href: "/forms" },
  { id: "workflows", label: "Automatizări", href: "/workflows" },
];

const RECENT_SITES = [
  { name: "Intranet Acme", letter: "I", color: "#6366F1" },
  { name: "Echipa IT", letter: "E", color: "#0EA5E9" },
  { name: "Proiect Phoenix", letter: "P", color: "#F59E0B" },
  { name: "Resurse Umane", letter: "R", color: "#10B981" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--sidebar-bg)" }}>
      {/* ─── SIDEBAR ─── */}
      <aside
        className="hidden lg:flex lg:flex-col shrink-0 scrollbar-none"
        style={{ width: 220, background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <span className="text-white text-[13px] font-semibold">O</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: "var(--sidebar-text-active)", letterSpacing: "-0.01em" }}>OpenPortal</p>
            <p className="text-[10px] truncate" style={{ color: "var(--sidebar-text)", marginTop: -1 }}>Acme Corporation</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <button
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-[6px] text-[11.5px] transition-colors border-0 cursor-pointer"
            style={{ color: "var(--sidebar-subtle)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sidebar-border)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Caută...
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "var(--sidebar-muted)" }}>⌘K</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-none px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[12.5px] transition-all duration-100 mb-px"
                style={{
                  color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                  background: isActive ? "var(--sidebar-active)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; }}}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}}
              >
                <NavIcon id={item.id} active={isActive} />
                {item.label}
              </Link>
            );
          })}

          {/* Recent sites */}
          <div className="mt-6 mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--sidebar-muted)" }}>
            Site-uri
          </div>
          {RECENT_SITES.map((site) => (
            <Link
              key={site.name}
              href={`/sites/${site.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center gap-2 rounded-md px-2.5 py-[6px] text-[12px] transition-colors mb-px"
              style={{ color: "var(--sidebar-text)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}
            >
              <span
                className="w-[18px] h-[18px] rounded flex items-center justify-center text-[9px] font-semibold shrink-0"
                style={{ background: site.color + "20", color: site.color }}
              >
                {site.letter}
              </span>
              <span className="truncate">{site.name}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 cursor-pointer transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>AI</div>
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium truncate" style={{ color: "var(--sidebar-text-active)" }}>Alexandru I.</p>
              <p className="text-[9.5px] truncate" style={{ color: "var(--sidebar-subtle)" }}>admin@acme.ro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0" style={{ background: "var(--page-bg)", borderTopLeftRadius: 12 }}>
        {/* Topbar */}
        <header className="flex items-center justify-between h-[52px] px-7 shrink-0" style={{ background: "var(--page-bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: "var(--text-tertiary)" }}>Acme Corporation</span>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="font-medium" style={{ color: "var(--text)" }}>{currentPage?.label || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nou
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-none">
          <div className="max-w-[1100px] mx-auto px-7 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Nav Icons ─── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#FAFAFA" : "#52525B";
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "dashboard": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "sites": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3.5 9h17M3.5 15h17"/></svg>;
    case "documents": return <svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>;
    case "pages": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>;
    case "tables": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>;
    case "forms": return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>;
    case "workflows": return <svg {...p}><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a4 4 0 0 0 4 4h2M19 8v2a4 4 0 0 1-4 4h-2"/></svg>;
    default: return null;
  }
}
