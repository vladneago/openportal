import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────
// AI Site Generator
//
// Given a short business description, generates a complete set of
// content blocks ready to drop into a home page: hero, features grid,
// about (textImage), services preview, reviews fallback, FAQ-style
// textImage, and a final CTA banner.
//
// Returns structured JSON the route can map directly to site-builder
// block shapes. No template rendering or DB writes here.
// ─────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = process.env.ANTHROPIC_DEFAULT_MODEL || "claude-haiku-4-5-20251001";

const client: Anthropic | null = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

export const aiSiteGeneratorEnabled = client !== null;

export interface SiteGenerationInput {
  businessName: string;
  industry: string; // e.g. "beauty", "barbershop", "spa_wellness", "cofetarie", etc.
  oneLineDescription: string;
  uniqueValue?: string; // why customers choose them — free text
  tone?: "modern" | "lux" | "casual" | "warm" | "professional";
  city?: string;
}

export interface GeneratedContent {
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: { text: string; href: string };
    ctaSecondary?: { text: string; href: string };
  };
  features: Array<{ icon: string; title: string; text: string }>;
  about: {
    title: string;
    text: string;
  };
  servicesPreview: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
  reviewsFallback: Array<{ author: string; text: string; rating: number }>;
  faq: Array<{ q: string; a: string }>;
  ctaBanner: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

// ─────────────────────────────────────────────
// Industry-specific style hints (the tone block is small enough that
// caching it isn't worth it).
// ─────────────────────────────────────────────

const INDUSTRY_HINTS: Record<string, string> = {
  beauty: "Salon de înfrumusețare — vibe rafinat, feminin, accent pe încredere și atenție la detalii. Servicii frecvente: coafură, manichiură, machiaj, tratamente.",
  barbershop: "Frizerie / barbershop — vibe relaxat, masculin, accent pe meserie și comunitate. Servicii: tuns, fade, barbă.",
  spa_wellness: "SPA & wellness — vibe calm, contemplativ, accent pe relaxare și ritual. Servicii: masaje, tratamente faciale, aromaterapie.",
  fitness: "Sală fitness / personal trainer — vibe energic, motivant, accent pe rezultate și disciplină. Servicii: antrenamente, programe slăbire/masă.",
  yoga_pilates: "Yoga / pilates — vibe blând, mindful, accent pe echilibru și prezență. Servicii: clase, instructori.",
  medical: "Cabinet medical — vibe încrezător, empatic, NU dă sfaturi medicale. Subliniază programări, costuri orientative, pregătire consultație.",
  dental: "Stomatologie — vibe profesional, liniștitor, accent pe pacient confortabil. Servicii: igienizare, plombe, ortodonție, implanturi.",
  bakery: "Cofetărie / patiserie — vibe cald, artizanal, accent pe ingrediente și ocazie. Servicii: torturi event, prăjituri, comenzi.",
  cofetarie: "Cofetărie / patiserie — vibe cald, artizanal, accent pe ingrediente și ocazie. Servicii: torturi event, prăjituri, comenzi.",
  florist: "Florărie — vibe sensibil, creativ, accent pe ocazii și buchete personalizate.",
  photographer: "Fotograf — vibe creativ, atent la detalii, accent pe portofoliu și momente speciale.",
  restaurant: "Restaurant — vibe ospitalier, accent pe meniu și atmosferă.",
  cafe: "Cafenea — vibe relaxat, prietenos, accent pe specialty coffee și comunitate.",
  lawyer: "Avocat / notar — vibe sobru, încrezător, accent pe expertiză și discreție.",
  accountant: "Contabil — vibe organizat, încrezător, accent pe deadline-uri ANAF și raportare clară.",
  consulting: "Consultant — vibe profesionist, încrezător, accent pe expertiză și rezultate măsurabile.",
  psychology: "Psiholog / terapeut — vibe empatic, sigur, fără promisiuni miraculoase. Accent pe abordare + confidențialitate.",
  veterinary: "Veterinar — vibe blând cu animalele, profesionist cu oamenii. Accent pe servicii + program urgențe.",
  automotive: "Atelier auto — vibe pragmatic, încrezător, accent pe expertiză tehnică și prețuri corecte.",
  hotel_bnb: "Hotel / pensiune — vibe ospitalier, accent pe locație + experiență locală.",
  education: "Cursuri / training — vibe entuziast, accent pe rezultate cursanți.",
  tattoo_studio: "Tatuaj / piercing — vibe creativ-cool, accent pe artist + portofoliu + igienă.",
};

const TONE_LABELS: Record<string, string> = {
  modern: "modern, curat, cu fraze scurte și concrete",
  lux: "elegant, premium, cu accent pe rafinament și exclusivitate",
  casual: "prietenos, relaxat, accesibil, cu personalitate",
  warm: "cald, primitor, empatic, ca o conversație cu un prieten",
  professional: "profesional, sobru, încredere, fără floricele",
};

// ─────────────────────────────────────────────
// Build the prompt for Claude. We use a JSON-only response format and
// a strict schema so the route can parse safely.
// ─────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Ești un copywriter senior pentru afaceri locale din România. Generezi conținut pentru pagina principală a unui site profesionist.

REGULI:
- Scrii DOAR în română, fără preluare directă din inputul utilizatorului.
- Tonul, lungimea și vocabularul sunt adaptate industriei + tone-ului cerut.
- NU INVENTEZI prețuri, servicii foarte specifice, premii, dovezi sociale false. Folosește formulări generale când nu ai detalii.
- Hero: titlu MAX 60 caractere, captivant, beneficiu clar. Subtitlu 80-140 caractere, susține titlul.
- Features: 4 caracteristici. Fiecare cu emoji potrivit, titlu (3-5 cuvinte) și text (12-20 cuvinte).
- About: paragraf 2-3 propoziții despre povestea sau valorile afacerii. Cald, autentic, nu corporate.
- ServicesPreview: titlu + subtitlu scurte care te trag către lista de servicii.
- ReviewsFallback: 3 recenzii placeholder cu rating 5, autorii sunt nume românești comune (Maria P., Andrei T., Ioana M., etc.), textul 1-2 propoziții, autentice, nu „cel mai bun X din Y", ci feedback real.
- FAQ: 4 întrebări frecvente cu răspunsuri 1-3 propoziții, utile, NU promoționale.
- CtaBanner: titlu de tip îndemn, subtitlu cu micro-beneficiu, buton scurt.
- SEO title: max 60 caractere. SEO description: max 155 caractere.

Răspunzi DOAR cu JSON valid (fără markdown fences, fără comentarii). Schema:

{
  "hero": { "title": string, "subtitle": string, "ctaPrimary": { "text": string, "href": "/programari" }, "ctaSecondary": { "text": string, "href": "/servicii" } },
  "features": [{ "icon": string, "title": string, "text": string }, ...4],
  "about": { "title": string, "text": string },
  "servicesPreview": { "title": string, "subtitle": string, "ctaText": string, "ctaHref": "/servicii" },
  "reviewsFallback": [{ "author": string, "text": string, "rating": 5 }, ...3],
  "faq": [{ "q": string, "a": string }, ...4],
  "ctaBanner": { "title": string, "subtitle": string, "ctaText": string, "ctaHref": "/programari" },
  "seo": { "title": string, "description": string }
}`;
}

function buildUserPrompt(input: SiteGenerationInput): string {
  const industryHint = INDUSTRY_HINTS[input.industry] || `Industria: ${input.industry}.`;
  const toneHint = input.tone ? TONE_LABELS[input.tone] || input.tone : TONE_LABELS.warm;

  return `Generează conținut pentru site-ul afacerii:

NUME: ${input.businessName}
INDUSTRIE: ${input.industry} — ${industryHint}
DESCRIERE 1-LINE: ${input.oneLineDescription}
${input.uniqueValue ? `DE CE NE ALEG CLIENȚII: ${input.uniqueValue}` : ""}
${input.city ? `ORAȘ: ${input.city}` : ""}
TON: ${toneHint}

Generează JSON-ul complet, conform schemei.`;
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export async function generateSiteContent(input: SiteGenerationInput): Promise<GeneratedContent> {
  if (!client) {
    // Fallback content when ANTHROPIC_API_KEY is missing — keeps the
    // onboarding flow demoable in dev without an API key.
    return buildStubContent(input);
  }

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2400,
    temperature: 0.7,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

  if (!raw) {
    throw new Error("Model returned empty response");
  }

  // Strip possible code fences in case the model misbehaves
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Model returned invalid JSON: ${(err as Error).message}. Preview: ${cleaned.slice(0, 200)}`);
  }

  return validateAndCoerce(parsed, input);
}

// ─────────────────────────────────────────────
// Validation + coercion (light — protect downstream against missing fields)
// ─────────────────────────────────────────────

function validateAndCoerce(raw: unknown, input: SiteGenerationInput): GeneratedContent {
  const stub = buildStubContent(input);
  if (!raw || typeof raw !== "object") return stub;

  const r = raw as Record<string, unknown>;

  const hero = (r.hero as Record<string, unknown>) || {};
  const ctaP = (hero.ctaPrimary as Record<string, unknown>) || {};
  const ctaS = (hero.ctaSecondary as Record<string, unknown>) || {};

  const features = Array.isArray(r.features) ? (r.features as Array<Record<string, unknown>>) : [];
  const about = (r.about as Record<string, unknown>) || {};
  const servicesPreview = (r.servicesPreview as Record<string, unknown>) || {};
  const reviews = Array.isArray(r.reviewsFallback) ? (r.reviewsFallback as Array<Record<string, unknown>>) : [];
  const faq = Array.isArray(r.faq) ? (r.faq as Array<Record<string, unknown>>) : [];
  const ctaBanner = (r.ctaBanner as Record<string, unknown>) || {};
  const seo = (r.seo as Record<string, unknown>) || {};

  return {
    hero: {
      title: typeof hero.title === "string" ? hero.title : stub.hero.title,
      subtitle: typeof hero.subtitle === "string" ? hero.subtitle : stub.hero.subtitle,
      ctaPrimary: {
        text: typeof ctaP.text === "string" ? ctaP.text : "Programează-te",
        href: typeof ctaP.href === "string" ? ctaP.href : "/programari",
      },
      ctaSecondary: ctaS.text
        ? {
            text: typeof ctaS.text === "string" ? ctaS.text : "Servicii",
            href: typeof ctaS.href === "string" ? ctaS.href : "/servicii",
          }
        : undefined,
    },
    features: features.slice(0, 6).map((f, i) => ({
      icon: typeof f.icon === "string" ? f.icon : ["✨", "🌟", "💎", "🌿"][i % 4],
      title: typeof f.title === "string" ? f.title : `Caracteristică ${i + 1}`,
      text: typeof f.text === "string" ? f.text : "",
    })),
    about: {
      title: typeof about.title === "string" ? about.title : stub.about.title,
      text: typeof about.text === "string" ? about.text : stub.about.text,
    },
    servicesPreview: {
      title: typeof servicesPreview.title === "string" ? servicesPreview.title : "Serviciile noastre",
      subtitle: typeof servicesPreview.subtitle === "string" ? servicesPreview.subtitle : "",
      ctaText: typeof servicesPreview.ctaText === "string" ? servicesPreview.ctaText : "Vezi toate serviciile",
      ctaHref: "/servicii",
    },
    reviewsFallback: reviews.slice(0, 3).map((rv, i) => ({
      author: typeof rv.author === "string" ? rv.author : ["Maria P.", "Andrei T.", "Ioana M."][i],
      text: typeof rv.text === "string" ? rv.text : "Experiență minunată!",
      rating: typeof rv.rating === "number" && rv.rating >= 1 && rv.rating <= 5 ? rv.rating : 5,
    })),
    faq: faq.slice(0, 6).map((q) => ({
      q: typeof q.q === "string" ? q.q : "",
      a: typeof q.a === "string" ? q.a : "",
    })).filter((q) => q.q && q.a),
    ctaBanner: {
      title: typeof ctaBanner.title === "string" ? ctaBanner.title : "Programează-te acum",
      subtitle: typeof ctaBanner.subtitle === "string" ? ctaBanner.subtitle : "",
      ctaText: typeof ctaBanner.ctaText === "string" ? ctaBanner.ctaText : "Rezervă online",
      ctaHref: "/programari",
    },
    seo: {
      title: typeof seo.title === "string" ? seo.title.slice(0, 60) : `${input.businessName}`,
      description: typeof seo.description === "string" ? seo.description.slice(0, 155) : input.oneLineDescription,
    },
  };
}

// ─────────────────────────────────────────────
// Stub content for dev mode (no API key)
// ─────────────────────────────────────────────

function buildStubContent(input: SiteGenerationInput): GeneratedContent {
  const name = input.businessName || "Afacerea Mea";
  return {
    hero: {
      title: `Bun venit la ${name}`,
      subtitle: input.oneLineDescription || "Serviciile pe care le cauți, livrate cu profesionalism.",
      ctaPrimary: { text: "Programează-te", href: "/programari" },
      ctaSecondary: { text: "Vezi servicii", href: "/servicii" },
    },
    features: [
      { icon: "✨", title: "Profesional", text: "Echipă cu experiență în domeniu" },
      { icon: "🌿", title: "Calitate", text: "Standarde înalte, atenție la detalii" },
      { icon: "📅", title: "Programare rapidă", text: "Online, în 30 de secunde" },
      { icon: "💬", title: "Suport real", text: "Răspundem rapid pe orice canal" },
    ],
    about: {
      title: "Despre noi",
      text: `${name} este o afacere locală cu pasiune pentru ceea ce face. Aici găsești profesionalism, atenție la detalii și grija pentru fiecare client.`,
    },
    servicesPreview: {
      title: "Serviciile noastre",
      subtitle: "Cele mai cerute servicii ale noastre",
      ctaText: "Vezi toate serviciile",
      ctaHref: "/servicii",
    },
    reviewsFallback: [
      { author: "Maria P.", text: "Experiență excelentă. Recomand!", rating: 5 },
      { author: "Andrei T.", text: "Profesionalism și atenție la detalii.", rating: 5 },
      { author: "Ioana M.", text: "Mereu plec mulțumită. Mulțumesc!", rating: 5 },
    ],
    faq: [
      { q: "Cum mă programez?", a: "Cel mai rapid e prin pagina de programări online. Alegi serviciul, ora și-ți confirmăm prin email." },
      { q: "Cum plătesc?", a: "Plata se face la fața locului — cash, card sau transfer." },
      { q: "Pot anula sau reprograma?", a: "Da, oricând cu cel puțin 24 de ore înainte, folosind linkul din email-ul de confirmare." },
      { q: "Aveți parcare?", a: "Întreabă-ne la programare — îți spunem cele mai bune opțiuni." },
    ],
    ctaBanner: {
      title: "Programează-te acum",
      subtitle: "Online, în 30 de secunde — confirmi cu un email și gata.",
      ctaText: "Rezervă online",
      ctaHref: "/programari",
    },
    seo: {
      title: `${name} — programare online`,
      description: (input.oneLineDescription || `${name} — programare online rapidă, profesionalism și atenție la detalii.`).slice(0, 155),
    },
  };
}

// ─────────────────────────────────────────────
// Block factory — converts GeneratedContent into site-builder blocks
// matching the existing schemas (BlockRenderer/BLOCK_TYPES).
// ─────────────────────────────────────────────

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

function blockId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function contentToBlocks(content: GeneratedContent): Block[] {
  const blocks: Block[] = [
    {
      id: blockId("hero"),
      type: "hero",
      data: {
        title: content.hero.title,
        subtitle: content.hero.subtitle,
        ctaPrimary: content.hero.ctaPrimary,
        ...(content.hero.ctaSecondary ? { ctaSecondary: content.hero.ctaSecondary } : {}),
      },
    },
    {
      id: blockId("features"),
      type: "featuresGrid",
      data: {
        title: "De ce ne aleg clienții",
        features: content.features,
      },
    },
    {
      id: blockId("about"),
      type: "textImage",
      data: {
        title: content.about.title,
        text: content.about.text,
        imagePosition: "right",
      },
    },
    {
      id: blockId("services"),
      type: "servicesPreview",
      data: content.servicesPreview,
    },
    {
      id: blockId("reviews"),
      type: "reviewsList",
      data: {
        title: "Ce spun clienții noștri",
        limit: 6,
        minRating: 0,
        fallbackItems: content.reviewsFallback,
      },
    },
  ];

  // FAQ as a stack of textImage blocks isn't ideal — for MVP we render
  // each FAQ as a featuresGrid item-list (with Q as title, A as text).
  if (content.faq.length > 0) {
    blocks.push({
      id: blockId("faq"),
      type: "featuresGrid",
      data: {
        title: "Întrebări frecvente",
        features: content.faq.map((f, i) => ({
          icon: ["❓", "💡", "📌", "✅", "🔑", "🤔"][i % 6],
          title: f.q,
          text: f.a,
        })),
      },
    });
  }

  blocks.push({
    id: blockId("cta"),
    type: "ctaBanner",
    data: content.ctaBanner,
  });

  return blocks;
}
