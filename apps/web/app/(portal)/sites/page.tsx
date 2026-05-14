"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Site {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  template: string;
  status: string;
  visibility: string;
  logo: string | null;
  coverImage: string | null;
  isHub: boolean;
  hubSiteId: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

const SITE_TEMPLATES = [
  { id: "team", title: "Team Site", description: "Colaborare cu echipa, fișiere comune, sarcini și calendar.", icon: "users", color: "#0EA5E9", category: "Collaboration" },
  { id: "communication", title: "Communication Site", description: "Publicare conținut, anunțuri și știri pentru întreaga organizație.", icon: "megaphone", color: "#6366F1", category: "Publishing" },
  { id: "project", title: "Project Site", description: "Management proiect, kanban, gantt, riscuri și livrabile.", icon: "kanban", color: "#F59E0B", category: "Project" },
  { id: "wiki", title: "Knowledge Wiki", description: "Bază de cunoștințe, articole, glossary, link-uri.", icon: "book", color: "#10B981", category: "Knowledge" },
  { id: "department", title: "Departament", description: "Hub departamental cu subsecțiuni, politici și echipe.", icon: "building", color: "#8B5CF6", category: "Department" },
  { id: "intranet_portal", title: "Intranet Portal", description: "Portal central de companie cu hub sites și branding consistent.", icon: "globe", color: "#EC4899", category: "Enterprise" },
  { id: "publishing_portal", title: "Publishing Portal", description: "Pentru editori — workflow aprobare, multi-language, audience targeting.", icon: "document", color: "#14B8A6", category: "Publishing" },
  { id: "knowledge_base", title: "Knowledge Base", description: "Help-center cu articole, categorii, căutare și ratings.", icon: "lightbulb", color: "#22C55E", category: "Knowledge" },
  { id: "community", title: "Community", description: "Forum, discuții, întrebări/răspunsuri, badges și reputation.", icon: "comments", color: "#F97316", category: "Social" },
  { id: "extranet", title: "Extranet (External)", description: "Colaborare cu parteneri externi cu access controlat.", icon: "external", color: "#06B6D4", category: "External" },
  { id: "hr_portal", title: "HR Portal", description: "Politici, beneficii, formulare, învățare, recunoaștere.", icon: "users", color: "#10B981", category: "Department" },
  { id: "finance_portal", title: "Finance Portal", description: "Rapoarte financiare, bugete, facturi, expense reports.", icon: "chart", color: "#0EA5E9", category: "Department" },
  { id: "legal_portal", title: "Legal Portal", description: "Contracte, politici legale, conformitate, dosare juridice.", icon: "scale", color: "#EAB308", category: "Department" },
  { id: "it_portal", title: "IT Portal", description: "Self-service IT, runbooks, incidente, knowledge base tehnic.", icon: "code", color: "#3B82F6", category: "Department" },
  { id: "education_portal", title: "Education Portal", description: "Cursuri, programe, profesori, studenți, materiale.", icon: "school", color: "#A855F7", category: "Education" },
  { id: "healthcare_portal", title: "Healthcare Portal", description: "Pacienți, programări, dosare medicale, telemedicină.", icon: "heart", color: "#EF4444", category: "Healthcare" },
  { id: "government_portal", title: "Government Portal", description: "Servicii publice, sesizări, formulare, transparență.", icon: "landmark", color: "#0891B2", category: "Government" },
  { id: "blank", title: "Site gol (blank)", description: "Pornire de la zero — alegeți chiar voi structura.", icon: "plus", color: "#71717A", category: "Custom" },
];

const TYPE_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  team: { label: "Echipă", bg: "#E0F2FE", fg: "#0369A1" },
  communication: { label: "Comunicare", bg: "#EDE9FE", fg: "#6D28D9" },
  project: { label: "Proiect", bg: "#FEF3C7", fg: "#B45309" },
  wiki: { label: "Wiki", bg: "#DCFCE7", fg: "#15803D" },
  hub: { label: "Hub", bg: "#FCE7F3", fg: "#BE185D" },
  private_channel: { label: "Privat", bg: "#F1F5F9", fg: "#475569" },
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof SITE_TEMPLATES[0] | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    visibility: "internal" as "private" | "internal" | "public" | "extranet",
    isHub: false,
    language: "ro",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await api<Site[]>("/api/v1/sites?includeArchived=true");
    if (res.success) setSites(res.data || []);
    setLoading(false);
  }

  function startCreate() {
    setShowCreate(true);
    setStep("template");
    setSelectedTemplate(null);
    setForm({ title: "", slug: "", description: "", visibility: "internal", isHub: false, language: "ro" });
  }

  function selectTemplate(tpl: typeof SITE_TEMPLATES[0]) {
    setSelectedTemplate(tpl);
    setStep("details");
  }

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  }

  async function handleCreate() {
    if (!selectedTemplate || !form.title || !form.slug) return;
    const type = ["team", "project", "wiki", "communication", "hub"].includes(selectedTemplate.id)
      ? selectedTemplate.id : "team";
    const res = await api("/api/v1/sites", {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        type,
        template: selectedTemplate.id,
        visibility: form.visibility,
        isHub: form.isHub,
        language: form.language,
      }),
    });
    if (res.success) {
      setShowCreate(false);
      await load();
    } else {
      alert(res.error?.message || "Eroare la creare");
    }
  }

  const filtered = sites.filter((s) => {
    if (filter === "active" && s.status !== "active") return false;
    if (filter === "archived" && s.status !== "archived") return false;
    if (filter === "hub" && !s.isHub) return false;
    if (search && !`${s.title} ${s.description || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Site-uri</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length} {filtered.length === 1 ? "site" : "site-uri"} · Hub sites, communication sites, team sites
          </p>
        </div>
        <button className="btn-primary" onClick={startCreate}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Site nou
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="input flex-1 max-w-xs"
          placeholder="Caută site-uri…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "Toate" },
            { id: "active", label: "Active" },
            { id: "hub", label: "Hub-uri" },
            { id: "archived", label: "Arhivate" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
              style={{
                background: filter === f.id ? "var(--text)" : "transparent",
                color: filter === f.id ? "#fff" : "var(--text-secondary)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>
      ) : filtered.length === 0 ? (
        <div className="panel py-16 text-center">
          <p className="text-[13px] mb-2" style={{ color: "var(--text-secondary)" }}>Niciun site încă.</p>
          <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>Apasă „Site nou" pentru a începe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => {
            const badge = TYPE_BADGE[s.type] || TYPE_BADGE.team;
            const tpl = SITE_TEMPLATES.find((t) => t.id === s.template);
            return (
              <Link key={s.id} href={`/sites/${s.slug}`}
                className="panel hover:shadow-md transition-all no-underline overflow-hidden flex flex-col"
                style={{ minHeight: 180 }}>
                <div className="h-20 relative" style={{
                  background: s.coverImage ? `url(${s.coverImage}) center/cover` : `linear-gradient(135deg, ${tpl?.color || "#6366F1"}, ${tpl?.color || "#6366F1"}90)`,
                }}>
                  {s.isHub && (
                    <span className="absolute top-2 right-2 text-[9.5px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(255,255,255,0.95)", color: "#0F172A" }}>
                      HUB
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{s.title}</p>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded shrink-0" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
                  </div>
                  <p className="text-[10.5px] line-clamp-2 mb-2 flex-1" style={{ color: "var(--text-tertiary)" }}>{s.description || "—"}</p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    <span>/{s.slug}</span>
                    <span>·</span>
                    <span className="capitalize">{s.visibility}</span>
                    {s.status === "archived" && (<><span>·</span><span style={{ color: "#EAB308" }}>Arhivat</span></>)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-[min(900px,92vw)] max-h-[88vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-[15px] font-medium" style={{ color: "var(--text)" }}>
                  {step === "template" ? "Alege un template" : `Configurare — ${selectedTemplate?.title}`}
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {step === "template" ? "Începe cu un template gata făcut sau pornește de la zero" : "Detaliile site-ului"}
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="border-0 bg-transparent cursor-pointer p-1.5 rounded hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {step === "template" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SITE_TEMPLATES.map((tpl) => (
                    <button key={tpl.id}
                      onClick={() => selectTemplate(tpl)}
                      className="border cursor-pointer text-left p-3 rounded-lg flex gap-3 transition-all hover:shadow-md"
                      style={{ borderColor: "var(--border)", background: "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = tpl.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                      <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-white text-[13px] font-semibold" style={{ background: tpl.color }}>
                        {tpl.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{tpl.title}</p>
                        <p className="text-[10.5px] mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{tpl.description}</p>
                        <span className="inline-block mt-1.5 text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{tpl.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nume site *</label>
                    <input className="input" autoFocus placeholder="ex: Echipa Marketing"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>URL (slug) *</label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span style={{ color: "var(--text-tertiary)" }}>/sites/</span>
                      <input className="input flex-1" placeholder="echipa-marketing" value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Descriere</label>
                    <textarea className="input" rows={2} placeholder="Pentru ce este acest site?" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Vizibilitate</label>
                      <select className="input" value={form.visibility}
                        onChange={(e) => setForm({ ...form, visibility: e.target.value as any })}>
                        <option value="private">Privat (doar membri)</option>
                        <option value="internal">Intern (toți colegii)</option>
                        <option value="public">Public</option>
                        <option value="extranet">Extranet (cu externi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Limbă principală</label>
                      <select className="input" value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}>
                        <option value="ro">Română</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isHub} onChange={(e) => setForm({ ...form, isHub: e.target.checked })} />
                    <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>Acesta este un Hub Site (poate fi părintele altor site-uri)</span>
                  </label>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              {step === "details" ? (
                <button onClick={() => setStep("template")} className="btn-secondary">← Înapoi la template-uri</button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Anulează</button>
                {step === "details" && (
                  <button onClick={handleCreate} className="btn-primary" disabled={!form.title || !form.slug}>Creează site</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
