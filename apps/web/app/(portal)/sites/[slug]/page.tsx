"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface SiteDetail {
  id: string; title: string; slug: string; description: string | null;
  type: string; template: string; status: string; visibility: string;
  logo: string | null; coverImage: string | null; siteIcon: string | null;
  isHub: boolean; hubSiteId: string | null;
  primaryOwnerId: string; theme: any; navigation: any[];
  features: any; defaultLanguage: string; timeZone: string;
  storageUsedBytes: string; documentCount: number; pageCount: number; listCount: number;
  weeklyActiveUsers: number; monthlyActiveUsers: number; pageViewsLast30d: number;
  memberCount?: number; followerCount?: number;
  createdAt: string; lastActivityAt: string | null;
}

interface PageItem {
  id: string; title: string; slug: string; status: string; layout: string;
  publishedAt: string | null; viewCount: number; likeCount: number; updatedAt: string;
  promotedAsNews: boolean;
}

interface ListItemRow {
  id: string; title: string; slug: string; description: string | null;
  template: string; icon: string | null; itemCount: number;
}

const TABS = ["home", "pages", "news", "documents", "lists", "members", "settings"] as const;

export default function SiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [tab, setTab] = useState<typeof TABS[number]>("home");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [lists, setLists] = useState<ListItemRow[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", slug: "", layout: "article" });
  const [newList, setNewList] = useState({ title: "", slug: "", template: "generic_list" });

  useEffect(() => { load(); }, [slug]);

  async function load() {
    setLoading(true);
    const siteRes = await api<SiteDetail>(`/api/v1/sites/${slug}`);
    if (!siteRes.success || !siteRes.data) { setLoading(false); return; }
    setSite(siteRes.data);
    const [pagesRes, listsRes, actRes] = await Promise.all([
      api<PageItem[]>(`/api/v1/pages?siteId=${siteRes.data.id}&limit=20`),
      api<ListItemRow[]>(`/api/v1/lists?siteId=${siteRes.data.id}`),
      api<any[]>(`/api/v1/sites/${slug}/activity?limit=15`),
    ]);
    if (pagesRes.success) setPages(pagesRes.data || []);
    if (listsRes.success) setLists(listsRes.data || []);
    if (actRes.success) setActivity(actRes.data || []);
    setLoading(false);
  }

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
  }

  async function createPage() {
    if (!site) return;
    const res = await api<{ id: string; slug: string }>("/api/v1/pages", {
      method: "POST",
      body: JSON.stringify({ siteId: site.id, ...newPage }),
    });
    if (res.success && res.data) {
      window.location.href = `/sites/${slug}/pages/${res.data.id}/edit`;
    } else alert(res.error?.message || "Eroare");
  }

  async function createList() {
    if (!site) return;
    const res = await api("/api/v1/lists", {
      method: "POST",
      body: JSON.stringify({ siteId: site.id, ...newList }),
    });
    if (res.success) {
      setShowCreateList(false);
      setNewList({ title: "", slug: "", template: "generic_list" });
      await load();
    } else alert(res.error?.message || "Eroare");
  }

  if (loading) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  if (!site) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Site negăsit.</div>;

  const accentColor = site.theme?.themePrimary || "#6366F1";
  const newsItems = pages.filter((p) => p.promotedAsNews);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="panel overflow-hidden" style={{ marginBottom: 12 }}>
        <div className="h-32 relative" style={{
          background: site.coverImage ? `url(${site.coverImage}) center/cover` : `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
        }}>
          {site.isHub && (
            <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.95)", color: "#0F172A" }}>
              HUB SITE
            </span>
          )}
        </div>
        <div className="p-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-[18px] font-semibold -mt-8 border-4 border-white shrink-0" style={{ background: accentColor }}>
            {site.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-medium" style={{ color: "var(--text)" }}>{site.title}</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{site.template}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{site.visibility}</span>
            </div>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>{site.description || "Niciun descriere."}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              <span>{site.memberCount || 0} membri</span>
              <span>·</span>
              <span>{site.pageCount} pagini</span>
              <span>·</span>
              <span>{site.documentCount} documente</span>
              <span>·</span>
              <span>{site.listCount} liste</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button className="btn-secondary text-[11px]" onClick={async () => { await api(`/api/v1/sites/${slug}/follow`, { method: "POST" }); }}>+ Urmărește</button>
            <Link href={`/sites/${slug}?tab=settings`} className="btn-secondary text-[11px] no-underline">Setări</Link>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="border-0 cursor-pointer px-3 py-2 text-[12px] font-medium transition-all capitalize"
            style={{
              background: "transparent",
              color: tab === t ? "var(--text)" : "var(--text-tertiary)",
              borderBottom: tab === t ? `2px solid ${accentColor}` : "2px solid transparent",
              marginBottom: -1,
            }}>
            {t === "home" ? "Acasă" : t === "pages" ? "Pagini" : t === "news" ? "Știri" :
             t === "documents" ? "Documente" : t === "lists" ? "Liste" :
             t === "members" ? "Membri" : "Setări"}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "home" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="panel p-5" style={{ background: `linear-gradient(135deg, ${accentColor}10, transparent)` }}>
              <h2 className="text-[16px] font-medium mb-1" style={{ color: "var(--text)" }}>Bine ai venit pe {site.title}</h2>
              <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{site.description || "Editați acest site adăugând pagini, liste și conținut."}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowCreatePage(true); setTab("pages"); }} className="btn-primary text-[11px]">+ Pagină nouă</button>
                <button onClick={() => { setShowCreateList(true); setTab("lists"); }} className="btn-secondary text-[11px]">+ Listă nouă</button>
              </div>
            </div>

            <div className="panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Pagini recente</h3>
                <Link href="?" onClick={(e) => { e.preventDefault(); setTab("pages"); }} className="text-[11px] no-underline" style={{ color: accentColor }}>Vezi toate →</Link>
              </div>
              <div className="space-y-1">
                {pages.slice(0, 5).map((p) => (
                  <Link key={p.id} href={`/sites/${slug}/pages/${p.id}/edit`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded no-underline transition-colors"
                    style={{ color: "var(--text)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                    <span className="text-[12px] flex-1 truncate">{p.title}</span>
                    {p.status === "draft" && <span className="text-[9.5px] px-1 rounded" style={{ background: "#FEF3C7", color: "#B45309" }}>Ciornă</span>}
                    {p.promotedAsNews && <span className="text-[9.5px] px-1 rounded" style={{ background: "#DBEAFE", color: "#1E40AF" }}>Știre</span>}
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{p.viewCount} vizualizări</span>
                  </Link>
                ))}
                {pages.length === 0 && <p className="text-[11px] py-4 text-center" style={{ color: "var(--text-tertiary)" }}>Nicio pagină încă.</p>}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="panel p-4">
              <h3 className="text-[12.5px] font-medium mb-3" style={{ color: "var(--text)" }}>Activitate</h3>
              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Vizualizări 30z</span><span className="font-medium">{site.pageViewsLast30d}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Membri activi/lună</span><span className="font-medium">{site.monthlyActiveUsers}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Membri activi/săpt</span><span className="font-medium">{site.weeklyActiveUsers}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Stocare</span><span className="font-medium">{(Number(site.storageUsedBytes) / 1024 / 1024).toFixed(1)} MB</span></div>
              </div>
            </div>
            <div className="panel p-4">
              <h3 className="text-[12.5px] font-medium mb-3" style={{ color: "var(--text)" }}>Recent</h3>
              <div className="space-y-2">
                {activity.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
                    <span className="truncate" style={{ color: "var(--text-secondary)" }}>{a.targetName || a.action}</span>
                  </div>
                ))}
                {activity.length === 0 && <p className="text-[11px] text-center py-2" style={{ color: "var(--text-tertiary)" }}>—</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "pages" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{pages.length} pagini</h3>
            <button onClick={() => setShowCreatePage(true)} className="btn-primary text-[11px]">+ Pagină nouă</button>
          </div>
          {showCreatePage && (
            <div className="panel p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" autoFocus placeholder="Titlu pagină" value={newPage.title}
                  onChange={(e) => setNewPage({ ...newPage, title: e.target.value, slug: slugify(e.target.value) })} />
                <input className="input" placeholder="slug" value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: slugify(e.target.value) })} />
              </div>
              <select className="input" value={newPage.layout} onChange={(e) => setNewPage({ ...newPage, layout: e.target.value })}>
                <option value="article">Article</option>
                <option value="home">Home</option>
                <option value="topic">Topic</option>
                <option value="landing">Landing</option>
                <option value="newsletter">Newsletter</option>
                <option value="press_release">Press Release</option>
                <option value="event">Event</option>
                <option value="announcement">Announcement</option>
                <option value="knowledge_base">Knowledge Base</option>
                <option value="wiki">Wiki</option>
                <option value="blank">Blank</option>
              </select>
              <div className="flex gap-2">
                <button onClick={createPage} className="btn-primary">Creează & deschide editor</button>
                <button onClick={() => setShowCreatePage(false)} className="btn-secondary">Anulează</button>
              </div>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-3 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 100px 80px 80px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Titlu</span><span>Status</span><span>Layout</span><span>Vizualizări</span><span></span>
            </div>
            {pages.map((p) => (
              <div key={p.id} className="grid gap-3 items-center px-4 py-2.5" style={{ gridTemplateColumns: "1fr 100px 80px 80px 80px", borderBottom: "1px solid var(--page-bg)" }}>
                <div>
                  <Link href={`/sites/${slug}/pages/${p.id}/edit`} className="text-[12.5px] font-medium no-underline" style={{ color: "var(--text)" }}>{p.title}</Link>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>/{p.slug}</p>
                </div>
                <span className="text-[10.5px] capitalize" style={{ color: p.status === "published" ? "#10B981" : "var(--text-tertiary)" }}>{p.status}</span>
                <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{p.layout}</span>
                <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{p.viewCount}</span>
                <Link href={`/sites/${slug}/pages/${p.id}/edit`} className="text-[10.5px] no-underline" style={{ color: accentColor }}>Editează →</Link>
              </div>
            ))}
            {pages.length === 0 && <div className="py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Nicio pagină.</div>}
          </div>
        </div>
      )}

      {tab === "news" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {newsItems.map((n) => (
            <Link key={n.id} href={`/sites/${slug}/pages/${n.id}/edit`} className="panel no-underline overflow-hidden">
              <div className="h-24" style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)` }} />
              <div className="p-3">
                <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{n.title}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{n.viewCount} vizualizări · {n.likeCount} aprecieri</p>
              </div>
            </Link>
          ))}
          {newsItems.length === 0 && <div className="col-span-full py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Nicio știre. Promovează o pagină ca știre din editor.</div>}
        </div>
      )}

      {tab === "lists" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{lists.length} liste & biblioteci</h3>
            <button onClick={() => setShowCreateList(true)} className="btn-primary text-[11px]">+ Listă nouă</button>
          </div>
          {showCreateList && (
            <div className="panel p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" autoFocus placeholder="Nume listă" value={newList.title}
                  onChange={(e) => setNewList({ ...newList, title: e.target.value, slug: slugify(e.target.value) })} />
                <input className="input" placeholder="slug" value={newList.slug} onChange={(e) => setNewList({ ...newList, slug: slugify(e.target.value) })} />
              </div>
              <select className="input" value={newList.template} onChange={(e) => setNewList({ ...newList, template: e.target.value })}>
                <optgroup label="Liste">
                  <option value="generic_list">Listă generică</option>
                  <option value="tasks">Sarcini</option>
                  <option value="contacts">Contacte</option>
                  <option value="links">Link-uri</option>
                  <option value="announcements">Anunțuri</option>
                  <option value="discussions">Discuții</option>
                  <option value="issues">Probleme</option>
                  <option value="events">Evenimente</option>
                  <option value="kpi">KPI</option>
                  <option value="survey">Sondaj</option>
                </optgroup>
                <optgroup label="Biblioteci">
                  <option value="document_library">Bibliotecă documente</option>
                  <option value="picture_library">Bibliotecă imagini</option>
                  <option value="asset_library">Bibliotecă active</option>
                  <option value="form_library">Bibliotecă formulare</option>
                  <option value="wiki_library">Bibliotecă wiki</option>
                  <option value="report_library">Bibliotecă rapoarte</option>
                </optgroup>
                <optgroup label="Special">
                  <option value="calendar">Calendar</option>
                </optgroup>
              </select>
              <div className="flex gap-2">
                <button onClick={createList} className="btn-primary">Creează</button>
                <button onClick={() => setShowCreateList(false)} className="btn-secondary">Anulează</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lists.map((l) => (
              <div key={l.id} className="panel p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded flex items-center justify-center text-[12px] font-semibold" style={{ background: ((l as any).color || accentColor) + "20", color: (l as any).color || accentColor }}>
                    {l.title.charAt(0)}
                  </div>
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{l.title}</p>
                </div>
                <p className="text-[10.5px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>{l.template.replace(/_/g, " ")}</p>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{l.itemCount} elemente</p>
              </div>
            ))}
            {lists.length === 0 && <div className="col-span-full py-8 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>Nicio listă.</div>}
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="panel p-8 text-center">
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Mergi în <Link href="/documents" className="no-underline" style={{ color: accentColor }}>Documente</Link> pentru a gestiona fișiere.</p>
        </div>
      )}

      {tab === "members" && (
        <div className="panel p-4">
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Site-ul are {site.memberCount || 0} membri.</p>
        </div>
      )}

      {tab === "settings" && (
        <div className="panel p-4 space-y-3">
          <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Acțiuni rapide</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-[11px]" onClick={async () => {
              if (!confirm("Arhivezi acest site?")) return;
              await api(`/api/v1/sites/${slug}/archive`, { method: "POST" });
              await load();
            }}>Arhivează</button>
            <button className="btn-secondary text-[11px]" onClick={async () => {
              await api(`/api/v1/sites/${slug}/restore`, { method: "POST" });
              await load();
            }}>Restaurează</button>
            <button className="btn-secondary text-[11px]" style={{ color: "#EF4444" }} onClick={async () => {
              if (!confirm(`Ștergi definitiv site-ul "${site.title}"? Această acțiune nu poate fi anulată.`)) return;
              await api(`/api/v1/sites/${slug}`, { method: "DELETE" });
              window.location.href = "/sites";
            }}>Șterge site</button>
          </div>
        </div>
      )}
    </div>
  );
}