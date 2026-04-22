"use client";

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="fade-in mb-8">
        <h1
          className="text-lg font-medium tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          Dashboard
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Activitatea organizației Acme Corporation
        </p>
      </div>

      {/* Metrics row — clean, borderless */}
      <div className="grid grid-cols-4 gap-6 mb-10 fade-in stagger-1">
        <Metric label="Site-uri" value="4" change="+2 luna aceasta" />
        <Metric label="Documente" value="0" change="Niciun document" />
        <Metric label="Utilizatori" value="3" change="Activi acum" />
        <Metric label="Stocare" value="0 MB" change="din 500 GB" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-5 gap-8">
        {/* Left — Activity */}
        <div className="col-span-3 fade-in stagger-2">
          <SectionHeader title="Activitate recentă" />

          <div className="mt-4 space-y-0">
            <ActivityItem
              initials="AI"
              name="Alexandru Ionescu"
              action="a creat site-ul"
              target="Intranet Acme"
              time="acum câteva secunde"
            />
            <ActivityItem
              initials="AI"
              name="Alexandru Ionescu"
              action="a creat site-ul"
              target="Echipa IT"
              time="acum câteva secunde"
            />
            <ActivityItem
              initials="AI"
              name="Alexandru Ionescu"
              action="a creat site-ul"
              target="Proiect Phoenix"
              time="acum câteva secunde"
            />
            <ActivityItem
              initials="AI"
              name="Alexandru Ionescu"
              action="a creat site-ul"
              target="Resurse Umane"
              time="acum câteva secunde"
            />
          </div>

          {/* Quick actions — inline, subtle */}
          <div className="mt-10">
            <SectionHeader title="Acțiuni rapide" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickAction
                label="Site nou"
                desc="Creează un spațiu de lucru"
                href="/sites/new"
              />
              <QuickAction
                label="Încarcă fișiere"
                desc="Adaugă în bibliotecă"
                href="/documents"
              />
              <QuickAction
                label="Pagină nouă"
                desc="Editor vizual"
                href="/pages/new"
              />
              <QuickAction
                label="Invită membru"
                desc="Adaugă colegi"
                href="/admin/users"
              />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-2 fade-in stagger-3">
          {/* Members */}
          <SectionHeader title="Echipa" action="Vezi toți" />
          <div className="mt-4 space-y-1">
            <MemberRow
              initials="AI"
              name="Alexandru Ionescu"
              role="Administrator"
              online
            />
            <MemberRow
              initials="MP"
              name="Maria Popescu"
              role="HR Manager"
              online={false}
            />
            <MemberRow
              initials="AC"
              name="Andrei Constantin"
              role="Developer Senior"
              online={false}
            />
          </div>

          {/* Sites */}
          <div className="mt-8">
            <SectionHeader title="Site-uri" action="Vezi toate" />
            <div className="mt-4 space-y-1">
              <SiteRow name="Intranet Acme" type="Comunicare" members={1} />
              <SiteRow name="Echipa IT" type="Echipă" members={1} />
              <SiteRow name="Proiect Phoenix" type="Proiect" members={1} />
              <SiteRow name="Resurse Umane" type="Echipă" members={1} />
            </div>
          </div>

          {/* Getting started */}
          <div className="mt-8">
            <SectionHeader title="Configurare" />
            <div className="mt-4 space-y-2">
              <SetupItem label="Creează primul site" done />
              <SetupItem label="Încarcă documente" done={false} />
              <SetupItem label="Invită echipa" done={false} />
              <SetupItem label="Personalizează portalul" done={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Components ─── */

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {title}
      </h2>
      {action && (
        <button
          className="text-[11px] transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div>
      <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-medium tracking-tight"
        style={{ color: "var(--color-text)", letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        {change}
      </p>
    </div>
  );
}

function ActivityItem({ initials, name, action, target, time }: {
  initials: string; name: string; action: string; target: string; time: string;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 transition-colors rounded-md px-2 -mx-2"
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0"
        style={{ background: "var(--color-subtle)", color: "var(--color-text-secondary)" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0 text-xs">
        <span style={{ color: "var(--color-text)" }}>{name}</span>
        <span style={{ color: "var(--color-text-tertiary)" }}> {action} </span>
        <span className="font-medium" style={{ color: "var(--color-text)" }}>{target}</span>
      </div>
      <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
        {time}
      </span>
    </div>
  );
}

function QuickAction({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-100"
      style={{ background: "var(--color-subtle)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-muted)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{label}</p>
        <p className="text-[10.5px]" style={{ color: "var(--color-text-tertiary)" }}>{desc}</p>
      </div>
    </a>
  );
}

function MemberRow({ initials, name, role, online }: {
  initials: string; name: string; role: string; online: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="relative">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium"
          style={{ background: "var(--color-subtle)", color: "var(--color-text-secondary)" }}
        >
          {initials}
        </div>
        {online && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: "#22C55E", borderColor: "var(--color-surface)" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: "var(--color-text)" }}>{name}</p>
        <p className="text-[10.5px] truncate" style={{ color: "var(--color-text-tertiary)" }}>{role}</p>
      </div>
    </div>
  );
}

function SiteRow({ name, type, members }: { name: string; type: string; members: number }) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium shrink-0"
        style={{ background: "var(--color-subtle)", color: "var(--color-text-tertiary)" }}
      >
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: "var(--color-text)" }}>{name}</p>
        <p className="text-[10.5px]" style={{ color: "var(--color-text-tertiary)" }}>
          {type} · {members} {members === 1 ? "membru" : "membri"}
        </p>
      </div>
    </div>
  );
}

function SetupItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: done ? "var(--color-text)" : "transparent",
          boxShadow: done ? "none" : "inset 0 0 0 1.5px var(--color-muted)",
        }}
      >
        {done && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span
        className="text-xs"
        style={{
          color: done ? "var(--color-text-tertiary)" : "var(--color-text)",
          textDecoration: done ? "line-through" : "none",
        }}
      >
        {label}
      </span>
    </div>
  );
}
