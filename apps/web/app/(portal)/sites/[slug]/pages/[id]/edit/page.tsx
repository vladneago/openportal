"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";

interface PageData {
  id: string; siteId: string; title: string; slug: string;
  excerpt: string | null; coverImage: string | null;
  layout: string; status: string; canvas: any;
  promotedAsNews: boolean; newsCategory: string | null;
  language: string; metaTitle: string | null; metaDescription: string | null;
  webParts: WebPart[];
}

interface WebPart {
  id: string; type: string; title: string | null;
  config: any; appearance: any;
  sectionId: string | null; columnId: string | null; sortOrder: number;
}

const WEB_PART_CATEGORIES = [
  {
    name: "Text & Media",
    items: [
      { type: "text", label: "Text", icon: "T" },
      { type: "rich_text", label: "Text îmbogățit", icon: "T" },
      { type: "markdown", label: "Markdown", icon: "M" },
      { type: "heading", label: "Titlu", icon: "H" },
      { type: "quote", label: "Citat", icon: "❝" },
      { type: "callout", label: "Callout", icon: "!" },
      { type: "image", label: "Imagine", icon: "🖼" },
      { type: "image_gallery", label: "Galerie imagini", icon: "▦" },
      { type: "video", label: "Video", icon: "▷" },
      { type: "audio", label: "Audio", icon: "♪" },
      { type: "embed", label: "Embed", icon: "</>" },
      { type: "code_snippet", label: "Cod", icon: "{}" },
      { type: "divider", label: "Divizor", icon: "—" },
      { type: "spacer", label: "Spațiu", icon: "↕" },
    ],
  },
  {
    name: "Conținut dinamic",
    items: [
      { type: "hero", label: "Hero banner", icon: "★" },
      { type: "banner", label: "Banner", icon: "▬" },
      { type: "carousel", label: "Carusel", icon: "▸" },
      { type: "tabs", label: "Tab-uri", icon: "⊟" },
      { type: "accordion", label: "Acordeon", icon: "≡" },
      { type: "card_set", label: "Set carduri", icon: "▤" },
      { type: "quick_links", label: "Link-uri rapide", icon: "⚡" },
      { type: "highlighted_content", label: "Conținut evidențiat", icon: "✦" },
      { type: "news", label: "Știri", icon: "📰" },
      { type: "events", label: "Evenimente", icon: "📅" },
      { type: "calendar", label: "Calendar", icon: "📆" },
      { type: "documents", label: "Documente", icon: "📄" },
      { type: "list_view", label: "Vizualizare listă", icon: "≣" },
      { type: "site_activity", label: "Activitate site", icon: "↻" },
    ],
  },
  {
    name: "Persoane",
    items: [
      { type: "people", label: "Persoane", icon: "👥" },
      { type: "people_picker", label: "Selector persoane", icon: "@" },
      { type: "org_chart", label: "Organigrama", icon: "⊞" },
      { type: "user_profile", label: "Profil utilizator", icon: "○" },
      { type: "site_membership", label: "Membri site", icon: "○○" },
    ],
  },
  {
    name: "Date & Vizualizare",
    items: [
      { type: "kpi", label: "KPI", icon: "▲" },
      { type: "chart", label: "Grafic", icon: "📊" },
      { type: "metric", label: "Metric", icon: "#" },
      { type: "gauge", label: "Gauge", icon: "◐" },
      { type: "progress", label: "Progres", icon: "▰" },
      { type: "table", label: "Tabel", icon: "▦" },
      { type: "kanban", label: "Kanban", icon: "▥" },
      { type: "gantt", label: "Gantt", icon: "≡" },
      { type: "timeline", label: "Timeline", icon: "—" },
      { type: "tasks", label: "Sarcini", icon: "✓" },
      { type: "approvals", label: "Aprobări", icon: "✓✓" },
    ],
  },
  {
    name: "Interactiv",
    items: [
      { type: "form", label: "Formular", icon: "▭" },
      { type: "survey", label: "Sondaj", icon: "?" },
      { type: "poll", label: "Vot", icon: "✓" },
      { type: "search_box", label: "Căutare", icon: "🔍" },
      { type: "search_results", label: "Rezultate căutare", icon: "≣" },
      { type: "comments", label: "Comentarii", icon: "💬" },
      { type: "social_share", label: "Distribuie", icon: "↗" },
      { type: "follow_button", label: "Urmărește", icon: "+" },
    ],
  },
  {
    name: "Integrări",
    items: [
      { type: "iframe", label: "iFrame", icon: "⊡" },
      { type: "html", label: "HTML", icon: "</>" },
      { type: "yammer_feed", label: "Yammer", icon: "Y" },
      { type: "twitter_feed", label: "Twitter", icon: "𝕏" },
      { type: "rss_feed", label: "RSS", icon: "≡" },
      { type: "weather", label: "Vremea", icon: "☀" },
      { type: "world_clock", label: "Ceas mondial", icon: "🌍" },
      { type: "countdown", label: "Numărătoare", icon: "⏱" },
      { type: "map", label: "Hartă", icon: "📍" },
    ],
  },
  {
    name: "AI",
    items: [
      { type: "ai_summary", label: "Rezumat AI", icon: "✨" },
      { type: "ai_chat", label: "Chat AI", icon: "🤖" },
    ],
  },
];

const SECTION_LAYOUTS = [
  { id: "one_column", label: "1 coloană", cols: [12] },
  { id: "two_column", label: "2 coloane", cols: [6, 6] },
  { id: "three_column", label: "3 coloane", cols: [4, 4, 4] },
  { id: "left_sidebar", label: "Sidebar stânga", cols: [4, 8] },
  { id: "right_sidebar", label: "Sidebar dreapta", cols: [8, 4] },
  { id: "thirty_seventy", label: "30 / 70", cols: [4, 8] },
  { id: "seventy_thirty", label: "70 / 30", cols: [8, 4] },
];

export default function PageEditor({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState<{ section: string; column: string } | null>(null);
  const [selectedWp, setSelectedWp] = useState<WebPart | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const res = await api<PageData>(`/api/v1/pages/${id}`);
    if (res.success && res.data) setPage(res.data);
    setLoading(false);
  }

  async function saveCanvas(newCanvas: any) {
    if (!page) return;
    setSaving(true);
    await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ canvas: newCanvas }) });
    setPage({ ...page, canvas: newCanvas });
    setSaving(false);
  }

  async function publish() {
    setSaving(true);
    await api(`/api/v1/pages/${id}/publish`, { method: "POST" });
    await load();
    setSaving(false);
  }

  async function unpublish() {
    setSaving(true);
    await api(`/api/v1/pages/${id}/unpublish`, { method: "POST" });
    await load();
    setSaving(false);
  }

  async function promoteAsNews() {
    setSaving(true);
    await api(`/api/v1/pages/${id}/promote-as-news`, { method: "POST", body: JSON.stringify({}) });
    await load();
    setSaving(false);
  }

  async function addSection(layoutId: string) {
    if (!page) return;
    const layout = SECTION_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;
    const newSection = {
      id: "sec-" + Date.now(),
      layout: layoutId,
      spacing: "normal",
      columns: layout.cols.map((w, i) => ({ id: `col-${Date.now()}-${i}`, width: w, webParts: [] })),
    };
    const newCanvas = { ...page.canvas, sections: [...(page.canvas?.sections || []), newSection] };
    await saveCanvas(newCanvas);
  }

  async function removeSection(sectionId: string) {
    if (!page) return;
    const newCanvas = { ...page.canvas, sections: (page.canvas.sections || []).filter((s: any) => s.id !== sectionId) };
    // Also remove web parts in this section
    const wpsInSection = page.webParts.filter((wp) => wp.sectionId === sectionId);
    for (const wp of wpsInSection) {
      await api(`/api/v1/pages/web-parts/${wp.id}`, { method: "DELETE" });
    }
    await saveCanvas(newCanvas);
    await load();
  }

  async function addWebPart(type: string) {
    if (!page || !showAddPanel) return;
    const res = await api<WebPart>(`/api/v1/pages/${id}/web-parts`, {
      method: "POST",
      body: JSON.stringify({
        type, title: null, config: defaultConfig(type), appearance: {},
        sectionId: showAddPanel.section, columnId: showAddPanel.column,
        sortOrder: page.webParts.filter((w) => w.columnId === showAddPanel.column).length,
      }),
    });
    if (res.success) {
      setShowAddPanel(null);
      await load();
    }
  }

  function defaultConfig(type: string): any {
    switch (type) {
      case "text": case "rich_text": return { content: "Începe să scrii…" };
      case "heading": return { text: "Titlu", level: 2 };
      case "quote": return { text: "Citat memorabil…", attribution: "" };
      case "callout": return { type: "info", title: "Informație", body: "Detalii…" };
      case "image": return { url: "", alt: "", caption: "" };
      case "video": return { url: "" };
      case "embed": return { url: "" };
      case "divider": return { style: "solid" };
      case "spacer": return { height: 40 };
      case "code_snippet": return { code: "// cod aici", language: "javascript" };
      case "kpi": return { value: 0, label: "KPI", trend: 0, format: "number" };
      case "chart": return { type: "bar", title: "Grafic", data: [] };
      case "metric": return { value: 0, label: "Metric" };
      case "hero": return { headline: "Titlu hero", subheadline: "Subtitlu", cta: { label: "Acțiune", url: "#" } };
      case "quick_links": return { links: [], layout: "grid" };
      case "tabs": return { tabs: [{ id: "1", label: "Tab 1", content: "" }] };
      case "accordion": return { items: [{ id: "1", title: "Întrebare?", content: "Răspuns" }] };
      case "ai_summary": return { source: "page", maxWords: 150 };
      default: return {};
    }
  }

  async function updateWp(wp: WebPart, patch: Partial<WebPart>) {
    await api(`/api/v1/pages/web-parts/${wp.id}`, {
      method: "PATCH", body: JSON.stringify(patch),
    });
    await load();
  }

  async function deleteWp(wpId: string) {
    await api(`/api/v1/pages/web-parts/${wpId}`, { method: "DELETE" });
    setSelectedWp(null);
    await load();
  }

  if (loading) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  if (!page) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Pagină negăsită.</div>;

  const sections = page.canvas?.sections || [];

  return (
    <div className="space-y-3">
      {/* TOOLBAR */}
      <div className="panel px-3 py-2 flex items-center gap-2 flex-wrap" style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <a href={`/sites/${slug}`} className="text-[11px] no-underline" style={{ color: "var(--text-secondary)" }}>← {slug}</a>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <input
          className="text-[14px] font-medium border-0 bg-transparent flex-1 min-w-0 focus:outline-none"
          value={page.title}
          onChange={(e) => setPage({ ...page, title: e.target.value })}
          onBlur={async () => {
            await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ title: page.title }) });
          }}
          style={{ color: "var(--text)" }}
        />
        {saving && <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Salvare…</span>}
        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
          background: page.status === "published" ? "#DCFCE7" : "#F3F4F6",
          color: page.status === "published" ? "#15803D" : "#52525B",
        }}>{page.status}</span>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-[11px]">Setări</button>
        {!page.promotedAsNews && (
          <button onClick={promoteAsNews} className="btn-secondary text-[11px]">Promovează ca știre</button>
        )}
        {page.status === "published" ? (
          <button onClick={unpublish} className="btn-secondary text-[11px]">Anulează publicarea</button>
        ) : (
          <button onClick={publish} className="btn-primary text-[11px]">Publică</button>
        )}
      </div>

      {showSettings && (
        <div className="panel p-4 space-y-3">
          <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Setări pagină</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Layout</label>
              <select className="input" value={page.layout}
                onChange={async (e) => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ layout: e.target.value }) });
                  await load();
                }}>
                <option value="article">Article</option>
                <option value="home">Home</option>
                <option value="topic">Topic</option>
                <option value="landing">Landing</option>
                <option value="newsletter">Newsletter</option>
                <option value="press_release">Press Release</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Limbă</label>
              <select className="input" value={page.language}
                onChange={async (e) => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ language: e.target.value }) });
                  await load();
                }}>
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Excerpt</label>
              <textarea className="input" rows={2} value={page.excerpt || ""}
                onChange={(e) => setPage({ ...page, excerpt: e.target.value })}
                onBlur={async () => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ excerpt: page.excerpt }) });
                }} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Imagine de copertă (URL)</label>
              <input className="input" value={page.coverImage || ""}
                onChange={(e) => setPage({ ...page, coverImage: e.target.value })}
                onBlur={async () => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ coverImage: page.coverImage }) });
                }} />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meta title</label>
              <input className="input" value={page.metaTitle || ""}
                onChange={(e) => setPage({ ...page, metaTitle: e.target.value })}
                onBlur={async () => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ metaTitle: page.metaTitle }) });
                }} />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meta description</label>
              <input className="input" value={page.metaDescription || ""}
                onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
                onBlur={async () => {
                  await api(`/api/v1/pages/${id}`, { method: "PATCH", body: JSON.stringify({ metaDescription: page.metaDescription }) });
                }} />
            </div>
          </div>
        </div>
      )}

      {/* CANVAS */}
      <div className="panel" style={{ padding: 0 }}>
        {/* Hero (cover image + title) */}
        {page.coverImage && (
          <div className="h-48 relative" style={{ background: `url(${page.coverImage}) center/cover`, borderRadius: "8px 8px 0 0" }} />
        )}
        <div className="p-5">
          <h1 className="text-[28px] font-semibold mb-2" style={{ color: "var(--text)" }}>{page.title}</h1>
          {page.excerpt && <p className="text-[14px] mb-6" style={{ color: "var(--text-tertiary)" }}>{page.excerpt}</p>}

          {/* Sections */}
          {sections.map((section: any) => (
            <div key={section.id} className="my-4 group relative" style={{
              padding: section.spacing === "compact" ? 8 : section.spacing === "spacious" ? 24 : 16,
              background: section.background?.color || "transparent",
              borderRadius: 8,
            }}>
              <div className="absolute -left-3 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <button onClick={() => removeSection(section.id)} title="Șterge secțiunea"
                  className="border bg-white cursor-pointer w-5 h-5 rounded flex items-center justify-center text-[10px]"
                  style={{ color: "#EF4444", borderColor: "var(--border)" }}>×</button>
              </div>
              <div className="grid gap-3" style={{
                gridTemplateColumns: section.columns.map((c: any) => `${c.width}fr`).join(" "),
              }}>
                {section.columns.map((col: any) => {
                  const wpsInCol = page.webParts.filter((w) => w.sectionId === section.id && w.columnId === col.id).sort((a, b) => a.sortOrder - b.sortOrder);
                  return (
                    <div key={col.id} className="space-y-2 min-h-[60px]"
                      style={{ alignSelf: col.verticalAlign === "center" ? "center" : col.verticalAlign === "bottom" ? "end" : "start" }}>
                      {wpsInCol.map((wp) => (
                        <WebPartRender key={wp.id} wp={wp}
                          isSelected={selectedWp?.id === wp.id}
                          onSelect={() => setSelectedWp(wp)}
                          onUpdate={(patch) => updateWp(wp, patch)}
                          onDelete={() => deleteWp(wp.id)} />
                      ))}
                      <button onClick={() => setShowAddPanel({ section: section.id, column: col.id })}
                        className="w-full border-2 border-dashed cursor-pointer rounded py-2.5 text-[11px] transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--text-tertiary)", background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.color = "#6366F1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                        + Adaugă web part
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add new section */}
          <div className="mt-4 panel p-3" style={{ background: "var(--page-bg)", border: "1px dashed var(--border)" }}>
            <p className="text-[10.5px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>+ Adaugă secțiune</p>
            <div className="flex gap-1.5 flex-wrap">
              {SECTION_LAYOUTS.map((l) => (
                <button key={l.id} onClick={() => addSection(l.id)}
                  className="border cursor-pointer px-2.5 py-1.5 rounded text-[10.5px]"
                  style={{ borderColor: "var(--border)", background: "white", color: "var(--text-secondary)" }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WEB PART PICKER MODAL */}
      {showAddPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-[min(900px,92vw)] max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--text)" }}>Adaugă web part</h3>
              <button onClick={() => setShowAddPanel(null)} className="border-0 bg-transparent cursor-pointer text-[16px]" style={{ color: "var(--text-tertiary)" }}>×</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-44 border-r overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                {WEB_PART_CATEGORIES.map((cat, i) => (
                  <button key={i} onClick={() => setActiveCategory(i)}
                    className="border-0 cursor-pointer block w-full text-left px-3 py-2 text-[11.5px]"
                    style={{
                      background: activeCategory === i ? "var(--page-bg)" : "transparent",
                      color: activeCategory === i ? "var(--text)" : "var(--text-secondary)",
                      fontWeight: activeCategory === i ? 500 : 400,
                    }}>
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-2">
                  {WEB_PART_CATEGORIES[activeCategory].items.map((item) => (
                    <button key={item.type} onClick={() => addWebPart(item.type)}
                      className="border cursor-pointer p-2.5 rounded text-left transition-all"
                      style={{ borderColor: "var(--border)", background: "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                      <div className="text-[18px] mb-1">{item.icon}</div>
                      <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WebPartRender({ wp, isSelected, onSelect, onUpdate, onDelete }: {
  wp: WebPart; isSelected: boolean; onSelect: () => void;
  onUpdate: (patch: Partial<WebPart>) => void; onDelete: () => void;
}) {
  const cfg = wp.config || {};
  return (
    <div onClick={onSelect}
      className="relative rounded transition-all cursor-pointer group"
      style={{
        outline: isSelected ? "2px solid #6366F1" : "1px solid transparent",
        padding: 12, background: wp.appearance?.backgroundColor || "transparent",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.outline = "1px solid var(--border)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.outline = "1px solid transparent"; }}>
      {isSelected && (
        <div className="absolute -top-7 left-0 flex items-center gap-1 z-10">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#6366F1", color: "white" }}>{wp.type}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="border-0 bg-white shadow cursor-pointer w-5 h-5 rounded flex items-center justify-center text-[11px]" style={{ color: "#EF4444" }}>×</button>
        </div>
      )}
      <WebPartContent type={wp.type} cfg={cfg} onUpdate={(c) => onUpdate({ config: c })} />
    </div>
  );
}

function WebPartContent({ type, cfg, onUpdate }: { type: string; cfg: any; onUpdate: (c: any) => void }) {
  switch (type) {
    case "text":
    case "rich_text":
      return (
        <textarea className="w-full border-0 bg-transparent text-[13px] resize-none focus:outline-none"
          rows={3} value={cfg.content || ""}
          onChange={(e) => onUpdate({ ...cfg, content: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Începe să scrii…" />
      );
    case "heading":
      return (
        <input className="w-full border-0 bg-transparent text-[24px] font-semibold focus:outline-none"
          value={cfg.text || ""}
          onChange={(e) => onUpdate({ ...cfg, text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Titlu" />
      );
    case "quote":
      return (
        <blockquote className="border-l-4 pl-3" style={{ borderColor: "#6366F1" }}>
          <textarea className="w-full border-0 bg-transparent text-[14px] italic focus:outline-none resize-none"
            rows={2} value={cfg.text || ""}
            onChange={(e) => onUpdate({ ...cfg, text: e.target.value })}
            onClick={(e) => e.stopPropagation()} placeholder="Citat memorabil…" />
          {cfg.attribution && <cite className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>— {cfg.attribution}</cite>}
        </blockquote>
      );
    case "callout":
      return (
        <div className="p-3 rounded" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
          <p className="text-[12px] font-medium mb-0.5">{cfg.title || "Informație"}</p>
          <p className="text-[11.5px]" style={{ color: "#78350F" }}>{cfg.body || "Detalii…"}</p>
        </div>
      );
    case "image":
      return cfg.url ? (
        <figure>
          <img src={cfg.url} alt={cfg.alt || ""} className="max-w-full rounded" />
          {cfg.caption && <figcaption className="text-[11px] text-center mt-1" style={{ color: "var(--text-tertiary)" }}>{cfg.caption}</figcaption>}
        </figure>
      ) : (
        <div className="border-2 border-dashed rounded py-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>Niciun fișier — adaugă URL imagine</p>
          <input className="input max-w-sm mx-auto text-center" placeholder="https://..." onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ ...cfg, url: e.target.value })} />
        </div>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />;
    case "spacer":
      return <div style={{ height: cfg.height || 40 }} />;
    case "code_snippet":
      return (
        <pre className="rounded p-3 text-[12px] overflow-x-auto" style={{ background: "#0F172A", color: "#E2E8F0" }}>
          <code>{cfg.code || ""}</code>
        </pre>
      );
    case "kpi":
      return (
        <div className="text-center p-3">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>{cfg.label || "KPI"}</p>
          <p className="text-[28px] font-semibold mt-1" style={{ color: "var(--text)" }}>{cfg.value ?? "—"}</p>
          {cfg.trend !== undefined && cfg.trend !== 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: cfg.trend > 0 ? "#10B981" : "#EF4444" }}>
              {cfg.trend > 0 ? "↑" : "↓"} {Math.abs(cfg.trend)}%
            </p>
          )}
        </div>
      );
    case "hero":
      return (
        <div className="p-6 text-center rounded" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          <h2 className="text-[26px] font-semibold text-white">{cfg.headline || "Titlu hero"}</h2>
          <p className="text-[14px] mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>{cfg.subheadline || ""}</p>
          {cfg.cta && <button className="mt-3 px-4 py-2 rounded bg-white text-[12px] font-medium" style={{ color: "#6366F1" }}>{cfg.cta.label || "Acțiune"}</button>}
        </div>
      );
    case "quick_links":
      return (
        <div>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>Link-uri rapide</p>
          <div className="grid grid-cols-3 gap-2">
            {(cfg.links || []).slice(0, 6).map((l: any, i: number) => (
              <div key={i} className="p-2 rounded border text-center text-[11px]" style={{ borderColor: "var(--border)" }}>{l.label || `Link ${i + 1}`}</div>
            ))}
            {(!cfg.links || cfg.links.length === 0) && (
              <button className="col-span-3 border-2 border-dashed cursor-pointer py-3 rounded text-[10.5px]"
                style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
                onClick={(e) => { e.stopPropagation(); onUpdate({ ...cfg, links: [{ label: "Link 1", url: "#" }] }); }}>
                + Adaugă link-uri
              </button>
            )}
          </div>
        </div>
      );
    case "people":
      return (
        <div>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>Persoane</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-9 h-9 rounded-full" style={{ background: "var(--page-bg)", border: "2px solid white" }} />
            ))}
          </div>
        </div>
      );
    case "news":
    case "events":
    case "documents":
    case "list_view":
    case "calendar":
    case "highlighted_content":
      return (
        <div className="border-2 border-dashed rounded p-3 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>{type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
          <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Configurează acest web part în panoul de proprietăți</p>
        </div>
      );
    case "embed":
    case "iframe":
      return cfg.url ? (
        <div className="rounded overflow-hidden" style={{ aspectRatio: "16/9", background: "#000" }}>
          <iframe src={cfg.url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-popups" />
        </div>
      ) : (
        <input className="input" placeholder="URL embed/iframe" onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ ...cfg, url: e.target.value })} />
      );
    case "video":
      return cfg.url ? (
        <video controls src={cfg.url} className="w-full rounded" />
      ) : (
        <input className="input" placeholder="URL video" onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ ...cfg, url: e.target.value })} />
      );
    case "tabs":
      return (
        <div>
          <div className="flex gap-1 mb-2 border-b" style={{ borderColor: "var(--border)" }}>
            {(cfg.tabs || []).map((t: any, i: number) => (
              <span key={t.id} className="text-[11.5px] px-2 py-1.5" style={{ color: i === 0 ? "var(--text)" : "var(--text-tertiary)", borderBottom: i === 0 ? "2px solid #6366F1" : "none" }}>{t.label}</span>
            ))}
          </div>
          <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{(cfg.tabs?.[0]?.content) || ""}</p>
        </div>
      );
    case "ai_summary":
    case "ai_chat":
      return (
        <div className="p-3 rounded" style={{ background: "linear-gradient(135deg, #EDE9FE, #DBEAFE)" }}>
          <p className="text-[11px] font-medium" style={{ color: "#5B21B6" }}>✨ {type === "ai_summary" ? "Rezumat AI" : "Chat AI"}</p>
          <p className="text-[11px] mt-1" style={{ color: "#374151" }}>{type === "ai_summary" ? "Rezumat generat automat al conținutului paginii." : "Asistent AI pentru întrebări legate de site."}</p>
        </div>
      );
    default:
      return (
        <div className="text-center py-4 rounded" style={{ background: "var(--page-bg)" }}>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{type}</p>
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Web part neimplementat încă</p>
        </div>
      );
  }
}
