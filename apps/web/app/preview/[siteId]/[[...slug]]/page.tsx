import { notFound } from "next/navigation";
import Link from "next/link";
import { BlockRenderer, type Block, type RenderContext } from "@/components/site-blocks/BlockRenderer";
import { SiteThemeStyle } from "@/components/site-blocks/SiteThemeStyle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SitePayload {
  site: {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    themeId: string | null;
    themeOverrides: Record<string, unknown>;
    logoUrl: string | null;
    faviconUrl: string | null;
    defaultLocale: string;
    businessName: string | null;
    businessAddress: string | null;
    businessCity: string | null;
    businessPhone: string | null;
    businessEmail: string | null;
    businessHours: Array<{ dayOfWeek: number; open: string; close: string; closed: boolean }>;
    socialLinks: Record<string, string>;
    primaryNav: Array<{ label: string; href: string }>;
    status: string;
    defaultTitle: string | null;
    defaultDescription: string | null;
  };
  theme: {
    id: string;
    slug: string;
    name: string;
    colors: Record<string, string>;
    typography: Record<string, string | number>;
    borderRadius?: Record<string, number>;
  } | null;
}

interface PagePayload {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  blocks: Block[];
  locale: string;
  isHomePage: boolean;
}

interface ServicePayload {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: string;
  color: string;
  imageUrl: string | null;
}

interface NavPage {
  id: string;
  slug: string;
  title: string;
  isHomePage: boolean;
  sortOrder: number;
  status: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: T };
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export default async function PreviewSitePage({
  params,
}: {
  params: Promise<{ siteId: string; slug?: string[] }>;
}) {
  const { siteId, slug } = await params;
  const slugStr = slug?.join("/") || "";

  const [sitePayload, pageData, navPages, services] = await Promise.all([
    fetchJson<SitePayload>(
      `${API_URL}/api/v1/public/site-builder/sites/by-id?id=${siteId}&preview=1`,
    ),
    fetchJson<PagePayload>(
      `${API_URL}/api/v1/public/site-builder/sites/${siteId}/page?slug=${encodeURIComponent(slugStr)}&preview=1`,
    ),
    fetchJson<NavPage[]>(
      `${API_URL}/api/v1/public/site-builder/sites/${siteId}/pages?preview=1`,
    ),
    fetchJson<ServicePayload[]>(
      `${API_URL}/api/v1/public/site-builder/sites/${siteId}/services`,
    ),
  ]);

  if (!pageData || !sitePayload) notFound();

  const nav = (navPages || [])
    .sort((a, b) => {
      if (a.isHomePage) return -1;
      if (b.isHomePage) return 1;
      return a.sortOrder - b.sortOrder;
    })
    .map((p) => ({ slug: p.slug, title: p.title, isHomePage: p.isHomePage }));

  const ctx: RenderContext = {
    siteId,
    subdomain: sitePayload.site.subdomain,
    preview: true,
    services: services || [],
    navigation: nav,
    business: {
      name: sitePayload.site.businessName,
      address: sitePayload.site.businessAddress,
      city: sitePayload.site.businessCity,
      phone: sitePayload.site.businessPhone,
      email: sitePayload.site.businessEmail,
      hours: sitePayload.site.businessHours ?? [],
      socialLinks: sitePayload.site.socialLinks ?? {},
    },
  };

  const siteName = sitePayload.site.name;

  return (
    <>
      <SiteThemeStyle theme={sitePayload.theme} />

      {/* Preview banner */}
      <div
        style={{
          background: "#0F172A",
          color: "#FAFAFA",
          padding: "8px 16px",
          fontSize: "0.8rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        🔧 Preview ciornă — vizibil doar pentru tine.{" "}
        <Link href={`/site-builder/${siteId}`} style={{ color: "#7DD3FC", textDecoration: "underline" }}>
          Editează site
        </Link>
      </div>

      {/* Header / Nav */}
      <header
        style={{
          background: "var(--site-surface)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/preview/${siteId}`}
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--site-text)",
              textDecoration: "none",
            }}
          >
            {sitePayload.site.logoUrl ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sitePayload.site.logoUrl}
                  alt={siteName}
                  style={{ width: 32, height: 32, borderRadius: "var(--site-radius-md)", objectFit: "cover" }}
                />
                {siteName}
              </span>
            ) : (
              siteName
            )}
          </Link>
          <nav style={{ display: "flex", gap: 24, fontFamily: "var(--site-font-body)", flexWrap: "wrap" }}>
            {nav.map((p) => {
              const isActive = p.slug === slugStr || (p.isHomePage && !slugStr);
              return (
                <Link
                  key={p.slug + (p.isHomePage ? "-home" : "")}
                  href={`/preview/${siteId}${p.isHomePage ? "" : `/${p.slug}`}`}
                  style={{
                    color: "var(--site-text)",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 400,
                    borderBottom: isActive ? "2px solid var(--site-primary)" : "2px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  {p.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Page blocks */}
      <main>
        {pageData.blocks && pageData.blocks.length > 0 ? (
          pageData.blocks.map((b) => <BlockRenderer key={b.id} block={b} ctx={ctx} />)
        ) : (
          <div
            style={{
              padding: "120px 24px",
              textAlign: "center",
              color: "var(--site-text-muted)",
              fontFamily: "var(--site-font-body)",
              background: "var(--site-bg)",
            }}
          >
            Pagină goală. Adaugă blocuri în editor.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "var(--site-surface)",
          padding: "32px 24px",
          textAlign: "center",
          fontFamily: "var(--site-font-body)",
          color: "var(--site-text-muted)",
          fontSize: "0.85rem",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        © {new Date().getFullYear()} {siteName}. Powered by OpenPortal.
      </footer>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteId: string; slug?: string[] }>;
}) {
  const { siteId, slug } = await params;
  const slugStr = slug?.join("/") || "";
  const page = await fetchJson<PagePayload>(
    `${API_URL}/api/v1/public/site-builder/sites/${siteId}/page?slug=${encodeURIComponent(slugStr)}&preview=1`,
  );
  return {
    title: page?.seoTitle || page?.title || "Site preview",
    description: page?.seoDescription || undefined,
  };
}
