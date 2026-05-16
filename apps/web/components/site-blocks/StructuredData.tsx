// Server component — emits JSON-LD schema.org markup for a public site page.
// Helps Google rich results (LocalBusiness card, opening hours, services).

interface BusinessInfo {
  name: string | null;
  legalName?: string | null;
  description?: string | null;
  url: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl?: string | null;
  hours: Array<{ dayOfWeek: number; open: string; close: string; closed: boolean }>;
  socialLinks: Record<string, string>;
  services?: Array<{ name: string; description?: string | null; price?: string; currency?: string }>;
}

// Map dayOfWeek (0=Sun..6=Sat) → schema.org openingHoursSpecification format
const DAY_SCHEMA = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
];

export function LocalBusinessJsonLd({ business }: { business: BusinessInfo }) {
  const sameAs = Object.values(business.socialLinks || {}).filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  const openingHours = (business.hours || [])
    .filter((h) => !h.closed && h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_SCHEMA[h.dayOfWeek] || `https://schema.org/Monday`,
      opens: h.open,
      closes: h.close,
    }));

  const services = (business.services || []).map((s) => ({
    "@type": "Offer",
    name: s.name,
    ...(s.description ? { description: s.description } : {}),
    ...(s.price ? { price: s.price, priceCurrency: s.currency || "RON" } : {}),
  }));

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name || "Business",
    url: business.url,
  };

  if (business.legalName) payload.legalName = business.legalName;
  if (business.description) payload.description = business.description;
  if (business.logoUrl) payload.logo = business.logoUrl;
  if (business.email) payload.email = business.email;
  if (business.phone) payload.telephone = business.phone;

  if (business.address || business.city) {
    payload.address = {
      "@type": "PostalAddress",
      ...(business.address ? { streetAddress: business.address } : {}),
      ...(business.city ? { addressLocality: business.city } : {}),
      addressCountry: "RO",
    };
  }

  if (openingHours.length > 0) payload.openingHoursSpecification = openingHours;
  if (sameAs.length > 0) payload.sameAs = sameAs;

  if (services.length > 0) {
    payload.makesOffer = services;
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify with no whitespace; we control content fully.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
