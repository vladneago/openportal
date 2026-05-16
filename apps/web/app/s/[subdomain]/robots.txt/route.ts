import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await params;
  const host = req.headers.get("host") || `${subdomain}.openportal.app`;
  const proto = req.headers.get("x-forwarded-proto") || "https";

  const baseUrl = `${proto}://${host.replace(/\/$/, "")}`;
  const sitePathPrefix = host.includes("openportal.app") && host.startsWith(subdomain + ".")
    ? ""
    : `/s/${subdomain}`;

  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}${sitePathPrefix}/sitemap.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
