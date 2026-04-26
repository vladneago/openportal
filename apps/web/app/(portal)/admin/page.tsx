"use client";

import Link from "next/link";

const ADMIN_SECTIONS = [
  { href: "/admin/users", title: "Utilizatori", desc: "Gestionează membrii organizației, roluri și invitații", icon: "👥", color: "#6366F1" },
  { href: "/admin/settings", title: "Setări", desc: "Configurează organizația, branding și module active", icon: "⚙", color: "#71717A" },
  { href: "/admin/analytics", title: "Analytics", desc: "Statistici și rapoarte de utilizare a platformei", icon: "📊", color: "#10B981" },
];

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Administrare</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Gestionează organizația și platforma</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ADMIN_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="no-underline">
            <div className="panel p-5 transition-all cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: section.color + "10" }}>{section.icon}</div>
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{section.title}</p>
              <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{section.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
