import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "openportal.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host.replace(/\/$/, "")}`;

  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /onboarding
Disallow: /booking
Disallow: /billing
Disallow: /chat-widget
Disallow: /pos
Disallow: /site-builder
Disallow: /preview
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
