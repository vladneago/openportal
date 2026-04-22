"use client";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bun venit în OpenPortal!</h1>
        <p className="mt-1 text-slate-500">Iată un sumar al activității organizației tale.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Site-uri active" value="0" icon="globe" color="blue" />
        <StatCard label="Documente" value="0" icon="file" color="emerald" />
        <StatCard label="Utilizatori" value="1" icon="users" color="violet" />
        <StatCard label="Stocare folosită" value="0 MB" icon="database" color="amber" />
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Acțiuni rapide</h2>
            <div className="space-y-2">
              <QuickAction
                label="Creează un site nou"
                description="Team site, comunicare sau proiect"
                icon="plus-circle"
                href="/sites/new"
              />
              <QuickAction
                label="Încarcă documente"
                description="Drag & drop sau selectare fișiere"
                icon="upload"
                href="/documents"
              />
              <QuickAction
                label="Creează o pagină"
                description="Editor vizual drag-and-drop"
                icon="file-plus"
                href="/pages/new"
              />
              <QuickAction
                label="Invită membri"
                description="Adaugă colegi în organizație"
                icon="user-plus"
                href="/admin/users"
              />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activitate recentă</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Încă nu există activitate.</p>
              <p className="text-slate-400 text-xs mt-1">Creează primul tău site pentru a începe!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting started */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Primii pași</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StepCard
            step={1}
            title="Creează un site"
            description="Alege un template și configurează site-ul echipei tale."
            done={false}
          />
          <StepCard
            step={2}
            title="Încarcă documente"
            description="Adaugă fișierele echipei în biblioteca de documente."
            done={false}
          />
          <StepCard
            step={3}
            title="Invită echipa"
            description="Trimite invitații colegilor pentru a colabora."
            done={false}
          />
          <StepCard
            step={4}
            title="Personalizează"
            description="Adaugă logo, culori și configurează navigarea."
            done={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {icon === "globe" && <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />}
            {icon === "file" && <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />}
            {icon === "users" && <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />}
            {icon === "database" && <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />}
          </svg>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, description, icon, href }: { label: string; description: string; icon: string; href: string }) {
  return (
    <a href={href} className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors group">
      <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
        <svg className="h-4.5 w-4.5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {icon === "plus-circle" && <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
          {icon === "upload" && <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />}
          {icon === "file-plus" && <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />}
          {icon === "user-plus" && <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
    </a>
  );
}

function StepCard({ step, title, description, done }: { step: number; title: string; description: string; done: boolean }) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 hover:border-brand-200 hover:bg-brand-50/30"}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
        {done ? "✓" : step}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
