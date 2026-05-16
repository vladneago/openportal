import { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface NavPage {
  id: string;
  slug: string;
  title: string;
  isHomePage: boolean;
  sortOrder: number;
  status: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

interface SitePayload {
  site: {
    id: string;
    subdomain: string;
    customDomain: string | null;
  };
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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await params;
  const host = req.headers.get("host") || `${subdomain}.openportal.app`;
  const proto = req.headers.get("x-forwarded-proto") || "https";

  const sitePayload = await fetchJson<SitePayload>(
    `${API_URL}/api/v1/public/site-builder/sites/by-host?host=${encodeURIComponent(subdomain + ".openportal.app")}`,
  );

  if (!sitePayload) {
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"/>", {
      status: 404,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  // Determine the canonical base URL — prefer the request's actual host
  // so the sitemap works for both subdomain.openportal.app and custom domains.
  const baseUrl = `${proto}://${host.replace(/\/$/, "")}`;
  const sitePathPrefix = host.includes("openportal.app") && host.startsWith(subdomain + ".")
    ? "" // we're already on the subdomain
    : `/s/${subdomain}`; // we're on openportal.app and routing via /s/[subdomain]

  const navPages = (await fetchJson<NavPage[]>(
    `${API_URL}/api/v1/public/site-builder/sites/${sitePayload.site.id}/pages`,
  )) || [];

  const published = navPages.filter((p) => p.status === "published");

  const urls = published.map((p) => {
    const path = p.isHomePage ? sitePathPrefix || "/" : `${sitePathPrefix}/${p.slug}`;
    const loc = `${baseUrl}${path}`;
    const lastmod = p.publishedAt || p.updatedAt || new Date().toISOString();
    const priority = p.isHomePage ? "1.0" : "0.8";
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod.split("T")[0])}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
