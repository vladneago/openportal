import { notFound } from "next/navigation";
import Link from "next/link";
import { BlockRenderer, type Block, type RenderContext } from "@/components/site-blocks/BlockRenderer";
import { SiteThemeStyle } from "@/components/site-blocks/SiteThemeStyle";
import { CookieBanner } from "@/components/site-blocks/CookieBanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SitePayload {
  site: {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    themeId: string | null;
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
    gdprBannerEnabled: boolean;
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

interface NavPage {
  id: string;
  slug: string;
  title: string;
  isHomePage: boolean;
  sortOrder: number;
  status: string;
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

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}) {
  const { subdomain, slug } = await params;
  const slugStr = slug?.join("/") || "";

  // Resolve site by host (subdomain.openportal.app)
  const sitePayload = await fetchJson<SitePayload>(
    `${API_URL}/api/v1/public/site-builder/sites/by-host?host=${encodeURIComponent(subdomain + ".openportal.app")}`,
  );

  if (!sitePayload) notFound();

  const siteId = sitePayload.site.id;

  const [pageData, navPages, services] = await Promise.all([
    fetchJson<PagePayload>(
      `${API_URL}/api/v1/public/site-builder/sites/${siteId}/page?slug=${encodeURIComponent(slugStr)}`,
    ),
    fetchJson<NavPage[]>(`${API_URL}/api/v1/public/site-builder/sites/${siteId}/pages`),
    fetchJson<ServicePayload[]>(`${API_URL}/api/v1/public/site-builder/sites/${siteId}/services`),
  ]);

  if (!pageData) notFound();

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
    preview: false,
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

      {/* Header / Nav */}
      <header
        style={{
          background: "var(--site-surface)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
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
            href={`/s/${subdomain}`}
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
                  href={`/s/${subdomain}${p.isHomePage ? "" : `/${p.slug}`}`}
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
            Pagină în construcție.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "var(--site-surface)",
          padding: "40px 24px 24px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            fontFamily: "var(--site-font-body)",
            color: "var(--site-text-muted)",
            fontSize: "0.85rem",
          }}
        >
          <div>
            © {new Date().getFullYear()} {sitePayload.site.businessName || siteName}. Toate drepturile rezervate.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {Object.entries(sitePayload.site.socialLinks || {}).map(([key, url]) => (
              <a
                key={key}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--site-text-muted)", textDecoration: "none" }}
              >
                {key}
              </a>
            ))}
            <a
              href="https://openportal.app"
              style={{ color: "var(--site-text-muted)", textDecoration: "none", opacity: 0.7 }}
            >
              Powered by OpenPortal
            </a>
          </div>
        </div>
      </footer>

      {/* GDPR cookie banner */}
      {sitePayload.site.gdprBannerEnabled && <CookieBanner />}
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}) {
  const { subdomain, slug } = await params;
  const slugStr = slug?.join("/") || "";

  const sitePayload = await fetchJson<SitePayload>(
    `${API_URL}/api/v1/public/site-builder/sites/by-host?host=${encodeURIComponent(subdomain + ".openportal.app")}`,
  );
  if (!sitePayload) return { title: "Site negăsit" };

  const page = await fetchJson<PagePayload>(
    `${API_URL}/api/v1/public/site-builder/sites/${sitePayload.site.id}/page?slug=${encodeURIComponent(slugStr)}`,
  );

  const title = page?.seoTitle || page?.title || sitePayload.site.defaultTitle || sitePayload.site.name;
  const description = page?.seoDescription || sitePayload.site.defaultDescription || undefined;
  const ogImage = page?.ogImageUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: sitePayload.site.faviconUrl ? { icon: sitePayload.site.faviconUrl } : undefined,
  };
}
