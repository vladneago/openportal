"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface WebSite {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  customDomainStatus: string | null;
  themeId: string | null;
  templateId: string | null;
  status: string;
  publishedAt: string | null;
  logoUrl: string | null;
  defaultLocale: string;
  businessName: string | null;
  businessCity: string | null;
  updatedAt: string;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  previewImageUrl: string | null;
  thumbnailUrl: string | null;
  isPremium: boolean;
  isFeatured: boolean;
}

interface Theme {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isPremium: boolean;
  previewImageUrl: string | null;
}

const TABS = [
  { href: "/site-builder", label: "Site-uri" },
  { href: "/site-builder/templates", label: "Template-uri" },
  { href: "/site-builder/themes", label: "Teme" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  published: "Publicat",
  unpublished: "Nepublicat",
  suspended: "Suspendat",
  archived: "Arhivat",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  published: "#10B981",
  unpublished: "#F59E0B",
  suspended: "#EF4444",
  archived: "#52525B",
};

const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Salon înfrumusețare",
  barbershop: "Frizerie / Barbershop",
  spa_wellness: "SPA & Wellness",
  fitness: "Fitness",
  yoga_pilates: "Yoga / Pilates",
  restaurant: "Restaurant",
  cafe: "Cafenea",
  bakery: "Cofetărie / Patiserie",
  florist: "Florărie",
  photographer: "Fotograf",
  medical: "Cabinet medical",
  dental: "Stomatologie",
  veterinary: "Veterinar",
  legal: "Avocat / Notar",
  accounting: "Contabilitate",
  consulting: "Consultanță",
  education: "Educație",
  real_estate: "Imobiliare",
  automotive: "Auto",
  hotel_bnb: "Hotel / Pensiune",
  events: "Evenimente",
  tattoo_studio: "Tatuaj",
  fashion_retail: "Modă / Retail",
  general_business: "Business general",
  portfolio: "Portofoliu",
  landing_page: "Landing page",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function SitesListPage() {
  const [sites, setSites] = useState<WebSite[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    templateId: "",
    themeId: "",
    businessName: "",
    businessCity: "",
    businessPhone: "",
    businessEmail: "",
    defaultLocale: "ro",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [sitesRes, tplRes, themeRes] = await Promise.all([
      api(`/api/v1/site-builder/sites`),
      api(`/api/v1/site-builder/templates`),
      api(`/api/v1/site-builder/themes?includeSystem=true`),
    ]);
    if (sitesRes.success) setSites(sitesRes.data || []);
    if (tplRes.success) setTemplates(tplRes.data || []);
    if (themeRes.success) setThemes(themeRes.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.subdomain.trim()) return;

    const res = await api(`/api/v1/site-builder/sites`, {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        subdomain: form.subdomain,
        templateId: form.templateId || undefined,
        themeId: form.themeId || undefined,
        businessName: form.businessName || undefined,
        businessCity: form.businessCity || undefined,
        businessPhone: form.businessPhone || undefined,
        businessEmail: form.businessEmail || undefined,
        defaultLocale: form.defaultLocale,
      }),
    });

    if (res.success) {
      setShowCreate(false);
      setForm({
        name: "",
        subdomain: "",
        templateId: "",
        themeId: "",
        businessName: "",
        businessCity: "",
        businessPhone: "",
        businessEmail: "",
        defaultLocale: "ro",
      });
      await load();
    } else {
      alert(res.error?.message || "Eroare la creare site");
    }
  }

  async function handlePublish(id: string) {
    await api(`/api/v1/site-builder/sites/${id}/publish`, { method: "POST" });
    await load();
  }

  async function handleUnpublish(id: string) {
    await api(`/api/v1/site-builder/sites/${id}/unpublish`, { method: "POST" });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi acest site? (toate paginile vor fi pierdute)")) return;
    await api(`/api/v1/site-builder/sites/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Site-urile mele
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Site-uri publice pentru afacerea ta — subdomain gratuit sau domeniu propriu.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Site nou
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/site-builder" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/site-builder" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/site-builder" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
        >
          Se încarcă…
        </div>
      ) : sites.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-base font-medium mb-2" style={{ color: "var(--text)" }}>
            Nu ai niciun site creat încă
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Alege un template pentru industria ta și ai un site online în câteva minute.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            Creează primul site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sites.map((s) => (
            <div
              key={s.id}
              className="rounded-lg p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {s.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.logoUrl} alt={s.name} className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-base font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                    >
                      {s.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {s.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                      {s.customDomain || `${s.subdomain}.openportal.app`}
                    </div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: (STATUS_COLORS[s.status] || "#71717A") + "22",
                    color: STATUS_COLORS[s.status] || "#71717A",
                  }}
                >
                  {STATUS_LABELS[s.status]}
                </span>
              </div>

              {(s.businessName || s.businessCity) && (
                <div className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                  {s.businessName}
                  {s.businessCity ? ` · ${s.businessCity}` : ""}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Link href={`/site-builder/${s.id}`} className="btn-secondary text-xs no-underline">
                  Editează
                </Link>
                {s.status === "published" ? (
                  <button onClick={() => handleUnpublish(s.id)} className="btn-secondary text-xs">
                    Depublică
                  </button>
                ) : (
                  <button onClick={() => handlePublish(s.id)} className="btn-secondary text-xs">
                    Publică
                  </button>
                )}
                <a
                  href={`https://${s.customDomain || `${s.subdomain}.openportal.app`}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs p-1.5 rounded no-underline"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Vizualizează"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs p-1.5 rounded ml-auto"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Șterge"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-2xl my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Site nou
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nume site">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value, subdomain: form.subdomain || slugify(e.target.value) })
                    }
                    className="input w-full text-sm"
                    placeholder="Salon Luna"
                    autoFocus
                  />
                </Field>
                <Field label="Subdomain">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={form.subdomain}
                      onChange={(e) => setForm({ ...form, subdomain: slugify(e.target.value) })}
                      className="input flex-1 text-sm font-mono"
                      placeholder="salon-luna"
                    />
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      .openportal.app
                    </span>
                  </div>
                </Field>
              </div>

              <Field label="Template (opțional)">
                {templates.length === 0 ? (
                  <div className="text-xs p-3 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
                    Niciun template disponibil încă. Site-ul va fi creat gol și poate fi configurat manual.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, templateId: "" })}
                      className="rounded-md p-3 text-left text-xs"
                      style={{
                        background: !form.templateId ? "var(--bg-hover)" : "var(--bg-surface)",
                        border: `1px solid ${!form.templateId ? "var(--accent)" : "var(--border)"}`,
                        color: "var(--text)",
                      }}
                    >
                      <div className="font-medium">Gol</div>
                      <div style={{ color: "var(--text-tertiary)" }}>Configurez singur</div>
                    </button>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, templateId: t.id })}
                        className="rounded-md p-3 text-left text-xs"
                        style={{
                          background: form.templateId === t.id ? "var(--bg-hover)" : "var(--bg-surface)",
                          border: `1px solid ${form.templateId === t.id ? "var(--accent)" : "var(--border)"}`,
                          color: "var(--text)",
                        }}
                      >
                        <div className="font-medium truncate">{t.name}</div>
                        <div style={{ color: "var(--text-tertiary)" }} className="truncate">
                          {CATEGORY_LABELS[t.category] || t.category}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Temă (opțional)">
                <select
                  value={form.themeId}
                  onChange={(e) => setForm({ ...form, themeId: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">Temă implicită</option>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isSystem ? " (sistem)" : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>
                  Informații afacere (afișate în footer / contact)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nume afacere">
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <Field label="Localitate">
                    <input
                      type="text"
                      value={form.businessCity}
                      onChange={(e) => setForm({ ...form, businessCity: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <Field label="Telefon">
                    <input
                      type="tel"
                      value={form.businessPhone}
                      onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={form.businessEmail}
                      onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.subdomain.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.name.trim() || !form.subdomain.trim() ? 0.5 : 1 }}
              >
                Creează site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
