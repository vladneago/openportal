"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface WebSite {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  status: string;
  defaultLocale: string;
  themeId: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  logoUrl: string | null;
  publishedAt: string | null;
}

interface WebPage {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: string;
  isHomePage: boolean;
  sortOrder: number;
  publishedAt: string | null;
  updatedAt: string;
}

const PAGE_STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  published: "Publicată",
  unpublished: "Nepublicată",
};

const PAGE_STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  scheduled: "#06B6D4",
  published: "#10B981",
  unpublished: "#F59E0B",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params?.id as string;

  const [site, setSite] = useState<WebSite | null>(null);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPage, setShowNewPage] = useState(false);

  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    isHomePage: false,
  });

  const [siteForm, setSiteForm] = useState({
    name: "",
    customDomain: "",
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessPhone: "",
    businessEmail: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!siteId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function load() {
    setLoading(true);
    const [siteRes, pagesRes] = await Promise.all([
      api(`/api/v1/site-builder/sites/${siteId}`),
      api(`/api/v1/site-builder/pages?siteId=${siteId}`),
    ]);
    if (siteRes.success) {
      setSite(siteRes.data);
      setSiteForm({
        name: siteRes.data.name,
        customDomain: siteRes.data.customDomain ?? "",
        businessName: siteRes.data.businessName ?? "",
        businessAddress: siteRes.data.businessAddress ?? "",
        businessCity: siteRes.data.businessCity ?? "",
        businessPhone: siteRes.data.businessPhone ?? "",
        businessEmail: siteRes.data.businessEmail ?? "",
        logoUrl: siteRes.data.logoUrl ?? "",
      });
    }
    if (pagesRes.success) setPages(pagesRes.data || []);
    setLoading(false);
  }

  async function handleSaveSite() {
    if (!site) return;
    const res = await api(`/api/v1/site-builder/sites/${site.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: siteForm.name,
        customDomain: siteForm.customDomain || undefined,
        businessName: siteForm.businessName || undefined,
        businessAddress: siteForm.businessAddress || undefined,
        businessCity: siteForm.businessCity || undefined,
        businessPhone: siteForm.businessPhone || undefined,
        businessEmail: siteForm.businessEmail || undefined,
        logoUrl: siteForm.logoUrl || undefined,
      }),
    });
    if (res.success) {
      alert("Salvat");
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleCreatePage() {
    if (!pageForm.title.trim() || !site) return;
    const res = await api(`/api/v1/site-builder/pages`, {
      method: "POST",
      body: JSON.stringify({
        siteId: site.id,
        title: pageForm.title,
        slug: pageForm.slug || (pageForm.isHomePage ? "" : slugify(pageForm.title)),
        locale: site.defaultLocale,
        isHomePage: pageForm.isHomePage,
        blocks: [],
      }),
    });
    if (res.success) {
      setShowNewPage(false);
      setPageForm({ title: "", slug: "", isHomePage: false });
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function publishPage(id: string) {
    await api(`/api/v1/site-builder/pages/${id}/publish`, { method: "POST" });
    await load();
  }

  async function deletePage(id: string) {
    if (!confirm("Ștergi această pagină?")) return;
    await api(`/api/v1/site-builder/pages/${id}`, { method: "DELETE" });
    await load();
  }

  async function publishSite() {
    if (!site) return;
    await api(`/api/v1/site-builder/sites/${site.id}/publish`, { method: "POST" });
    await load();
  }

  async function unpublishSite() {
    if (!site) return;
    await api(`/api/v1/site-builder/sites/${site.id}/unpublish`, { method: "POST" });
    await load();
  }

  async function deleteSite() {
    if (!site) return;
    if (!confirm("Ștergi acest site? Toate paginile vor fi pierdute.")) return;
    await api(`/api/v1/site-builder/sites/${site.id}`, { method: "DELETE" });
    router.push("/site-builder");
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Se încarcă…
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Site negăsit.{" "}
        <Link href="/site-builder" className="underline">
          Înapoi la listă
        </Link>
      </div>
    );
  }

  const publicUrl = `https://${site.customDomain || `${site.subdomain}.openportal.app`}`;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs mb-3">
        <Link href="/site-builder" className="no-underline" style={{ color: "var(--text-tertiary)" }}>
          Site-uri
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--text)" }}>
          {site.name}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {site.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={site.logoUrl} alt={site.name} className="w-12 h-12 rounded-md object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center text-lg font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              {site.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
              {site.name}
            </h1>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener"
              className="text-xs hover:underline"
              style={{ color: "var(--text-tertiary)" }}
            >
              {publicUrl}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/preview/${site.id}`}
            target="_blank"
            rel="noopener"
            className="btn-secondary text-sm no-underline"
          >
            Preview
          </a>
          {site.status === "published" ? (
            <button onClick={unpublishSite} className="btn-secondary text-sm">
              Depublică
            </button>
          ) : (
            <button onClick={publishSite} className="btn-primary text-sm">
              Publică
            </button>
          )}
          <button onClick={deleteSite} className="text-sm px-3 py-1.5 rounded-md" style={{ color: "#EF4444" }}>
            Șterge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Settings */}
        <div className="col-span-12 md:col-span-5">
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
              Setări site
            </h2>

            <div className="space-y-3">
              <Field label="Nume site">
                <input
                  type="text"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>

              <Field label="Subdomain (nu se poate schimba)">
                <input
                  type="text"
                  value={`${site.subdomain}.openportal.app`}
                  readOnly
                  className="input w-full text-sm font-mono"
                  style={{ opacity: 0.6 }}
                />
              </Field>

              <Field label="Domeniu propriu (opțional)">
                <input
                  type="text"
                  value={siteForm.customDomain}
                  onChange={(e) => setSiteForm({ ...siteForm, customDomain: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder="salonluna.ro"
                />
              </Field>

              <Field label="Logo URL">
                <input
                  type="url"
                  value={siteForm.logoUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, logoUrl: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="https://…"
                />
              </Field>

              <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>
                  Informații afacere
                </div>
                <div className="space-y-2">
                  <Field label="Nume afacere">
                    <input
                      type="text"
                      value={siteForm.businessName}
                      onChange={(e) => setSiteForm({ ...siteForm, businessName: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <Field label="Adresă">
                    <input
                      type="text"
                      value={siteForm.businessAddress}
                      onChange={(e) => setSiteForm({ ...siteForm, businessAddress: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <Field label="Localitate">
                    <input
                      type="text"
                      value={siteForm.businessCity}
                      onChange={(e) => setSiteForm({ ...siteForm, businessCity: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Telefon">
                      <input
                        type="tel"
                        value={siteForm.businessPhone}
                        onChange={(e) => setSiteForm({ ...siteForm, businessPhone: e.target.value })}
                        className="input w-full text-sm"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={siteForm.businessEmail}
                        onChange={(e) => setSiteForm({ ...siteForm, businessEmail: e.target.value })}
                        className="input w-full text-sm"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveSite} className="btn-primary text-sm w-full">
                Salvează modificările
              </button>
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="col-span-12 md:col-span-7">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Pagini ({pages.length})
              </h2>
              <button onClick={() => setShowNewPage(true)} className="btn-secondary text-xs">
                + Pagină
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Nicio pagină creată încă.
              </div>
            ) : (
              pages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                        {p.title}
                      </span>
                      {p.isHomePage && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "#10B98122", color: "#10B981" }}
                        >
                          home
                        </span>
                      )}
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: (PAGE_STATUS_COLORS[p.status] || "#71717A") + "22",
                          color: PAGE_STATUS_COLORS[p.status] || "#71717A",
                        }}
                      >
                        {PAGE_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                      /{p.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/site-builder/${site.id}/pages/${p.id}/edit`}
                      className="btn-primary text-xs no-underline"
                    >
                      Editează
                    </Link>
                    {p.status !== "published" && (
                      <button onClick={() => publishPage(p.id)} className="btn-secondary text-xs">
                        Publică
                      </button>
                    )}
                    <button
                      onClick={() => deletePage(p.id)}
                      className="text-xs p-1.5 rounded"
                      style={{ color: "var(--text-tertiary)" }}
                      title="Șterge"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showNewPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowNewPage(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Pagină nouă
            </h2>

            <div className="space-y-3">
              <Field label="Titlu">
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, title: e.target.value, slug: pageForm.slug || slugify(e.target.value) })
                  }
                  className="input w-full text-sm"
                  placeholder="Despre noi"
                  autoFocus
                />
              </Field>

              <Field label="Slug (URL)">
                <input
                  type="text"
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  className="input w-full text-sm font-mono"
                  placeholder="despre-noi"
                  disabled={pageForm.isHomePage}
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={pageForm.isHomePage}
                  onChange={(e) => setPageForm({ ...pageForm, isHomePage: e.target.checked, slug: e.target.checked ? "" : pageForm.slug })}
                />
                Pagină home (înlocuiește pagina principală)
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNewPage(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleCreatePage}
                disabled={!pageForm.title.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !pageForm.title.trim() ? 0.5 : 1 }}
              >
                Creează
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
