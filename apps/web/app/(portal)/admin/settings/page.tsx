"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [tenantName, setTenantName] = useState("Acme Corporation SRL");
  const [slug, setSlug] = useState("acme");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Setări</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Configurează organizația</p>
        </div>
        <button className="btn-primary" onClick={handleSave}>
          {saved ? (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
              Salvat
            </span>
          ) : "Salvează"}
        </button>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* General */}
        <section>
          <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>General</h2>
          <div className="panel p-5 space-y-5">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Numele organizației</label>
              <input className="input" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>URL organizație</label>
              <div className="flex">
                <span className="flex items-center rounded-l-md px-2.5 text-[11px]" style={{ background: "var(--border)", color: "var(--text-tertiary)", boxShadow: "0 0 0 1px var(--border-hover)" }}>
                  openportal.app/
                </span>
                <input className="input rounded-l-none" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Culoare principală</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-md border-0 cursor-pointer" style={{ boxShadow: "0 0 0 1px var(--border-hover)" }} />
                <input className="input w-32" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section>
          <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>Abonament</h2>
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Business</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>100 utilizatori · 500 GB stocare · 50 site-uri</p>
              </div>
              <span className="text-[10.5px] px-2.5 py-1 rounded-full font-medium" style={{ background: "#6366F115", color: "#6366F1" }}>Activ</span>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section>
          <h2 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>Module active</h2>
          <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {[
              { name: "Video Conferencing", desc: "Meeting-uri, webinarii, înregistrări", active: true },
              { name: "Chat & Mesagerie", desc: "Canale, mesaje directe, threaduri", active: true },
              { name: "Calendar", desc: "Evenimente, programări, room booking", active: true },
              { name: "Educație", desc: "Cursuri, evaluări, certificări", active: false },
              { name: "HR", desc: "Recrutare, evaluări, onboarding", active: false },
              { name: "CRM", desc: "Contacte, pipeline, propuneri", active: false },
            ].map((mod) => (
              <div key={mod.name} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{mod.name}</p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{mod.desc}</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input type="checkbox" defaultChecked={mod.active} className="sr-only peer" />
                  <div className="w-9 h-5 rounded-full transition-colors peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:transition-transform after:bg-white"
                    style={{ background: mod.active ? "#18181B" : "#E4E4E7" }} />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-[13px] font-medium mb-4" style={{ color: "#EF4444" }}>Zonă periculoasă</h2>
          <div className="panel p-5" style={{ borderColor: "#FEE2E2" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Șterge organizația</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Toate datele vor fi șterse permanent. Acțiune ireversibilă.</p>
              </div>
              <button className="text-xs font-medium px-3 py-1.5 rounded-md border-0 cursor-pointer transition-colors"
                style={{ background: "#FEF2F2", color: "#EF4444" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}>
                Șterge
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
