"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, getUser, clearAuth } from "@/lib/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "sites", label: "Site-uri", href: "/sites" },
  { id: "pages", label: "Pagini", href: "/pages" },
  { id: "documents", label: "Documente", href: "/documents" },
  { id: "tables", label: "Liste & Tabele", href: "/tables" },
  { id: "forms", label: "Formulare", href: "/forms" },
  { id: "workflows", label: "Automatizări", href: "/workflows" },
  { id: "chat", label: "Mesaje", href: "/chat" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "booking", label: "Programări", href: "/booking" },
  { id: "billing", label: "Facturi", href: "/billing" },
  { id: "pos", label: "POS / Magazin", href: "/pos" },
  { id: "site-builder", label: "Site Builder", href: "/site-builder" },
  { id: "chat-widget", label: "Chat Widget", href: "/chat-widget" },
  { id: "hr", label: "HR", href: "/hr" },
  { id: "search", label: "Căutare", href: "/search" },
];

const ADMIN_ITEMS = [
  { label: "Utilizatori", href: "/admin/users" },
  { label: "Setări", href: "/admin/settings" },
  { label: "Analytics", href: "/admin/analytics" },
];

interface SiteItem { id: string; title: string; slug: string; type: string; }

const SITE_COLORS: Record<string, string> = { communication: "#6366F1", team: "#0EA5E9", project: "#F59E0B", wiki: "#10B981" };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [tenantName, setTenantName] = useState("OpenPortal");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadSidebar() {
      setUser(getUser());
      const [sitesRes, tenantRes] = await Promise.all([
        api("/api/v1/sites"),
        api("/api/v1/tenants/current"),
      ]);
      if (sitesRes.success) setSites(sitesRes.data || []);
      if (tenantRes.success) setTenantName(tenantRes.data?.name || "OpenPortal");
    }
    loadSidebar();
  }, []);

  const currentPage = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const isAdmin = ADMIN_ITEMS.some((i) => pathname.startsWith(i.href));
  const breadcrumbLabel = isAdmin
    ? ADMIN_ITEMS.find((i) => pathname.startsWith(i.href))?.label || "Admin"
    : currentPage?.label || "Dashboard";

  const userInitials = user ? `${(user.firstName || "?")[0]}${(user.lastName || "?")[0]}` : "?";

  function handleLogout() {
    clearAuth();
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--sidebar-bg)" }}>
      {/* SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col shrink-0 scrollbar-none" style={{ width: 220, background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}>
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <span className="text-white text-[13px] font-semibold">O</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: "var(--sidebar-text-active)", letterSpacing: "-0.01em" }}>OpenPortal</p>
            <p className="text-[10px] truncate" style={{ color: "var(--sidebar-text)", marginTop: -1 }}>{tenantName}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <Link href="/search" className="no-underline">
            <div className="w-full flex items-center gap-2 rounded-md px-2.5 py-[6px] text-[11.5px] transition-colors"
              style={{ color: "var(--sidebar-subtle)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sidebar-border)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Caută...
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "var(--sidebar-muted)" }}>⌘K</span>
            </div>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-none px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.id} href={item.href}
                className="flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[12.5px] transition-all duration-100 mb-px no-underline"
                style={{ color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)", background: isActive ? "var(--sidebar-active)" : "transparent", fontWeight: isActive ? 500 : 400 }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; } }}>
                <NavIcon id={item.id} active={isActive} />
                {item.label}
              </Link>
            );
          })}

          {/* Sites section */}
          {sites.length > 0 && (
            <>
              <div className="mt-6 mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--sidebar-muted)" }}>Site-uri</div>
              {sites.slice(0, 6).map((site) => {
                const color = SITE_COLORS[site.type] || "#A1A1AA";
                return (
                  <Link key={site.id} href={`/sites/${site.slug}`}
                    className="flex items-center gap-2 rounded-md px-2.5 py-[6px] text-[12px] transition-colors mb-px no-underline"
                    style={{ color: "var(--sidebar-text)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}>
                    <span className="w-[18px] h-[18px] rounded flex items-center justify-center text-[9px] font-semibold shrink-0"
                      style={{ background: color + "20", color }}>{site.title.charAt(0)}</span>
                    <span className="truncate">{site.title}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Admin section */}
          <div className="mt-6 mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--sidebar-muted)" }}>Admin</div>
          {ADMIN_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2 rounded-md px-2.5 py-[6px] text-[12px] transition-colors mb-px no-underline"
                style={{ color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)", background: isActive ? "var(--sidebar-active)" : "transparent", fontWeight: isActive ? 500 : 400 }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; } }}>
                <AdminIcon type={item.label} active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>{userInitials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-medium truncate" style={{ color: "var(--sidebar-text-active)" }}>
                {user?.firstName || "Utilizator"} {(user?.lastName || "")[0]}.
              </p>
              <p className="text-[9.5px] truncate" style={{ color: "var(--sidebar-subtle)" }}>{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
              style={{ color: "var(--sidebar-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sidebar-muted)"; }}
              title="Deconectare">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0" style={{ background: "var(--page-bg)", borderTopLeftRadius: 12 }}>
        <header className="flex items-center justify-between h-[52px] px-7 shrink-0" style={{ background: "var(--page-bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: "var(--text-tertiary)" }}>{tenantName}</span>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="font-medium" style={{ color: "var(--text)" }}>{breadcrumbLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nou
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-none">
          <div className="max-w-[1100px] mx-auto px-7 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* Nav Icons */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#FAFAFA" : "#52525B";
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "dashboard": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "sites": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3.5 9h17M3.5 15h17"/></svg>;
    case "documents": return <svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>;
    case "pages": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>;
    case "tables": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>;
    case "forms": return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>;
    case "workflows": return <svg {...p}><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a4 4 0 0 0 4 4h2M19 8v2a4 4 0 0 1-4 4h-2"/></svg>;
    case "chat": return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case "booking": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>;
    case "billing": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5M8 9h2"/></svg>;
    case "pos": return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17l3 4h14l3-4M8 7h8M8 11h8"/></svg>;
    case "site-builder": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>;
    case "chat-widget": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>;
    case "hr": return <svg {...p}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    default: return null;
  }
}

function AdminIcon({ type, active }: { type: string; active: boolean }) {
  const c = active ? "#FAFAFA" : "#52525B";
  const p = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "Utilizatori": return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "Setări": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "Analytics": return <svg {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
    default: return null;
  }
}
