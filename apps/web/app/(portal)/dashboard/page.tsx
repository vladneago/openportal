"use client";

const ACTIVITIES = [
  { initials: "AI", user: "Alexandru Ionescu", action: "a creat site-ul", target: "Intranet Acme", time: "2 min" },
  { initials: "AI", user: "Alexandru Ionescu", action: "a creat site-ul", target: "Echipa IT", time: "2 min" },
  { initials: "MP", user: "Maria Popescu", action: "a fost adăugată ca", target: "HR Manager", time: "5 min" },
  { initials: "AC", user: "Andrei Constantin", action: "a fost adăugat ca", target: "Developer", time: "5 min" },
  { initials: "AI", user: "Alexandru Ionescu", action: "a creat site-ul", target: "Proiect Phoenix", time: "5 min" },
];

const TEAM = [
  { name: "Alexandru Ionescu", role: "Owner · IT", initials: "AI", online: true, color: "#6366F1" },
  { name: "Maria Popescu", role: "Admin · HR", initials: "MP", online: false, color: "#EC4899" },
  { name: "Andrei Constantin", role: "Member · IT", initials: "AC", online: false, color: "#0EA5E9" },
];

const SITES = [
  { name: "Intranet Acme", letter: "I", color: "#6366F1", type: "Comunicare" },
  { name: "Echipa IT", letter: "E", color: "#0EA5E9", type: "Echipă" },
  { name: "Proiect Phoenix", letter: "P", color: "#F59E0B", type: "Proiect" },
  { name: "Resurse Umane", letter: "R", color: "#10B981", type: "Echipă" },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>
          Bine ai revenit, Alexandru
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Iată ce s-a întâmplat în Acme Corporation
        </p>
      </div>

      {/* ── METRICS ── */}
      <div className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden mb-8" style={{ background: "var(--border-hover)" }}>
        <MetricCard label="Site-uri active" value="4" sub="+2 noi" trend="up" />
        <MetricCard label="Documente" value="0" sub="gol" trend="neutral" />
        <MetricCard label="Membri echipă" value="3" sub="1 online" trend="up" />
        <MetricCard label="Stocare" value="0%" sub="din 500 GB" trend="neutral" />
      </div>

      {/* ── TWO COLUMNS ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* Left */}
        <div>
          {/* Activity */}
          <SectionHeader title="Activitate recentă" action="Vezi tot →" />
          <div className="panel mt-4">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="panel-row">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9.5px] font-semibold shrink-0"
                  style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{a.initials}</div>
                <div className="flex-1 min-w-0 text-[12.5px]">
                  <span className="font-medium" style={{ color: "var(--text)" }}>{a.user}</span>
                  <span style={{ color: "var(--text-tertiary)" }}> {a.action} </span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>{a.target}</span>
                </div>
                <span className="text-[10.5px] shrink-0" style={{ color: "var(--text-muted)" }}>{a.time}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-8">
            <SectionHeader title="Începe" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "Creează site", desc: "Spațiu de lucru pentru echipă" },
                { label: "Încarcă fișiere", desc: "Documente, imagini, PDF-uri" },
                { label: "Creează pagină", desc: "Editor vizual drag & drop" },
                { label: "Invită colegi", desc: "Trimite invitații pe email" },
              ].map((qa) => (
                <button
                  key={qa.label}
                  className="text-left rounded-lg px-4 py-3.5 transition-all duration-100 border-0 cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{qa.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{qa.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Team */}
          <SectionHeader title="Echipa" action="Gestionează →" />
          <div className="panel mt-4">
            {TEAM.map((t, i) => (
              <div key={i} className="panel-row gap-2.5 px-3.5 py-2.5">
                <div className="relative">
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: t.color + "15", color: t.color }}>{t.initials}</div>
                  {t.online && (
                    <span className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full"
                      style={{ background: "var(--success)", border: "2px solid var(--surface)" }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{t.name}</p>
                  <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sites */}
          <div className="mt-6">
            <SectionHeader title="Site-uri" action="Toate →" />
            <div className="panel mt-4">
              {SITES.map((s, i) => (
                <div key={i} className="panel-row gap-2.5 px-3.5 py-2.5">
                  <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{ background: s.color + "12", color: s.color }}>{s.letter}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{s.name}</p>
                    <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{s.type} · 1 membru</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          </div>

          {/* Setup */}
          <div className="mt-6">
            <SectionHeader title="Configurare" />
            <div className="panel mt-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>1 din 4 pași completați</span>
                <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>25%</span>
              </div>
              <div className="h-[3px] rounded-sm mb-4" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-sm" style={{ width: "25%", background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Creează un site", done: true },
                  { label: "Încarcă documente", done: false },
                  { label: "Invită echipa", done: false },
                  { label: "Personalizează", done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: s.done ? "var(--text)" : "transparent", border: s.done ? "none" : "1.5px solid var(--border-hover)" }}>
                      {s.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="text-xs" style={{ color: s.done ? "var(--text-tertiary)" : "var(--text-secondary)", textDecoration: s.done ? "line-through" : "none" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{title}</h2>
      {action && (
        <button className="text-[11px] border-0 bg-transparent cursor-pointer transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        >{action}</button>
      )}
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
