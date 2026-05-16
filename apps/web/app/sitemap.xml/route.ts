import { NextRequest } from "next/server";
import { INDUSTRY_SLUGS } from "@/components/marketing/industry-data";
import { COMPARISON_SLUGS } from "@/components/marketing/comparison-data";

const MARKETING_PATHS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/preturi", priority: "0.9", changefreq: "monthly" },
  { path: "/ajutor", priority: "0.7", changefreq: "weekly" },
  { path: "/status", priority: "0.5", changefreq: "always" },
  { path: "/login", priority: "0.5", changefreq: "monthly" },
  { path: "/register", priority: "0.7", changefreq: "monthly" },
  { path: "/legal/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/dpa", priority: "0.3", changefreq: "yearly" },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "openportal.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host.replace(/\/$/, "")}`;

  const today = new Date().toISOString().split("T")[0];

  const urls = [
    ...MARKETING_PATHS.map((m) => ({
      loc: baseUrl + m.path,
      lastmod: today,
      changefreq: m.changefreq,
      priority: m.priority,
    })),
    ...INDUSTRY_SLUGS.map((slug) => ({
      loc: `${baseUrl}/${slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...COMPARISON_SLUGS.map((slug) => ({
      loc: `${baseUrl}/vs/${slug}`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
