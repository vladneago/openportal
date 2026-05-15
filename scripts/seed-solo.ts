/**
 * OpenPortal — Solo Wedge Seed (themes + templates)
 * Idempotent: safe to re-run.
 *
 * Usage: cd packages/db && npx tsx ../../scripts/seed-solo.ts
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://openportal:openportal_dev@localhost:5432/openportal";
const sql = postgres(DATABASE_URL);

// ─────────────────────────────────────────────
// THEMES — 10 system themes (tenantId = NULL → visible to all)
// ─────────────────────────────────────────────

const themes = [
  {
    slug: "beauty-modern",
    name: "Beauty Modern",
    description: "Roz coral + crem, sans-serif elegant. Pentru saloane moderne.",
    colors: {
      primary: "#E91E63",
      secondary: "#FF9CB6",
      accent: "#F7A8A8",
      background: "#FFFAFB",
      surface: "#FFFFFF",
      text: "#1A0F12",
      textMuted: "#7A5C66",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Playfair Display', Georgia, serif",
      fontFamilyBody: "'Inter', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.333,
      lineHeight: 1.6,
    },
  },
  {
    slug: "beauty-vintage",
    name: "Beauty Vintage",
    description: "Roz prăfuit + bej cald, serif vintage. Pentru saloane retro.",
    colors: {
      primary: "#B07A7A",
      secondary: "#D4B5A0",
      accent: "#E8C5A0",
      background: "#FBF7F2",
      surface: "#FFFFFF",
      text: "#2A1F1A",
      textMuted: "#7A6A5A",
      success: "#5A8A5A",
      warning: "#C49A4A",
      error: "#B85450",
    },
    typography: {
      fontFamilyHeading: "'Cormorant Garamond', Georgia, serif",
      fontFamilyBody: "'Lora', Georgia, serif",
      baseFontSize: 16,
      headingScale: 1.414,
      lineHeight: 1.65,
    },
  },
  {
    slug: "salon-lux",
    name: "Salon Lux",
    description: "Negru + auriu, premium. Pentru saloane high-end.",
    colors: {
      primary: "#C9A961",
      secondary: "#E5C77A",
      accent: "#A88A4A",
      background: "#0A0A0A",
      surface: "#1A1A1A",
      text: "#FAFAFA",
      textMuted: "#A0A0A0",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Cinzel', Georgia, serif",
      fontFamilyBody: "'Montserrat', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.414,
      lineHeight: 1.6,
    },
  },
  {
    slug: "barbershop-bold",
    name: "Barbershop Bold",
    description: "Bleumarin închis + chihlimbar, masculin. Pentru frizerii.",
    colors: {
      primary: "#F59E0B",
      secondary: "#D97706",
      accent: "#FCD34D",
      background: "#0F1729",
      surface: "#1E293B",
      text: "#F1F5F9",
      textMuted: "#94A3B8",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Oswald', Impact, sans-serif",
      fontFamilyBody: "'Roboto', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.333,
      lineHeight: 1.55,
    },
  },
  {
    slug: "spa-wellness",
    name: "Spa Wellness",
    description: "Verde salvie + crem, liniștitor. Pentru SPA-uri și wellness.",
    colors: {
      primary: "#7A9F7A",
      secondary: "#A8C5A8",
      accent: "#D4DFC8",
      background: "#F8F9F3",
      surface: "#FFFFFF",
      text: "#1F2A1F",
      textMuted: "#6A7A6A",
      success: "#5A8A5A",
      warning: "#D4A056",
      error: "#B85450",
    },
    typography: {
      fontFamilyHeading: "'DM Serif Display', Georgia, serif",
      fontFamilyBody: "'DM Sans', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.333,
      lineHeight: 1.7,
    },
  },
  {
    slug: "cafe-cozy",
    name: "Cafe Cozy",
    description: "Maro cald + crem, prietenos. Pentru cafenele și cofetării.",
    colors: {
      primary: "#8B5A2B",
      secondary: "#C49A6C",
      accent: "#E8B380",
      background: "#FAF6F0",
      surface: "#FFFFFF",
      text: "#2A1810",
      textMuted: "#7A5A4A",
      success: "#5A8A4A",
      warning: "#D49A3A",
      error: "#B85040",
    },
    typography: {
      fontFamilyHeading: "'Caveat', cursive",
      fontFamilyBody: "'Nunito', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.414,
      lineHeight: 1.6,
    },
  },
  {
    slug: "restaurant-elegant",
    name: "Restaurant Elegant",
    description: "Roșu profund + auriu, sofisticat. Pentru restaurante fine dining.",
    colors: {
      primary: "#7A1F2A",
      secondary: "#B45260",
      accent: "#C9A961",
      background: "#FFFAF5",
      surface: "#FFFFFF",
      text: "#1F1010",
      textMuted: "#7A4A4A",
      success: "#5A8A4A",
      warning: "#D49A3A",
      error: "#B85040",
    },
    typography: {
      fontFamilyHeading: "'Italiana', Georgia, serif",
      fontFamilyBody: "'Libre Franklin', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.414,
      lineHeight: 1.6,
    },
  },
  {
    slug: "medical-trust",
    name: "Medical Trust",
    description: "Albastru calm + alb, încredere. Pentru cabinete medicale.",
    colors: {
      primary: "#0EA5E9",
      secondary: "#7DD3FC",
      accent: "#06B6D4",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      textMuted: "#64748B",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Inter', system-ui, sans-serif",
      fontFamilyBody: "'Inter', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.25,
      lineHeight: 1.65,
    },
  },
  {
    slug: "fitness-energy",
    name: "Fitness Energy",
    description: "Negru + portocaliu electric, dinamic. Pentru săli fitness și antrenori.",
    colors: {
      primary: "#FF5722",
      secondary: "#FF8A65",
      accent: "#FFD54F",
      background: "#0A0A0A",
      surface: "#1F1F1F",
      text: "#FAFAFA",
      textMuted: "#A0A0A0",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Bebas Neue', Impact, sans-serif",
      fontFamilyBody: "'Roboto', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.5,
      lineHeight: 1.5,
    },
  },
  {
    slug: "professional-clean",
    name: "Professional Clean",
    description: "Bleumarin + alb, profesionist. Pentru avocați, contabili, consultanți.",
    colors: {
      primary: "#1E40AF",
      secondary: "#3B82F6",
      accent: "#06B6D4",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#0F172A",
      textMuted: "#64748B",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    typography: {
      fontFamilyHeading: "'Inter', system-ui, sans-serif",
      fontFamilyBody: "'Inter', system-ui, sans-serif",
      baseFontSize: 16,
      headingScale: 1.25,
      lineHeight: 1.6,
    },
  },
];

// ─────────────────────────────────────────────
// TEMPLATES — 5 industry templates with full pages content
// ─────────────────────────────────────────────

type Block = { id: string; type: string; data: Record<string, unknown> };

function block(type: string, data: Record<string, unknown>): Block {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type,
    data,
  };
}

const templates = [
  {
    slug: "beauty-modern-salon",
    name: "Salon Modern",
    description: "Site complet pentru salon de înfrumusețare cu rezervări online.",
    category: "beauty",
    industryTags: ["salon", "coafură", "manichiură", "cosmetică"],
    themeSlug: "beauty-modern",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Frumusețea ta, în mâini bune",
            subtitle: "Salon de înfrumusețare cu peste 10 ani de experiență",
            ctaPrimary: { text: "Programează-te acum", href: "/programari" },
            ctaSecondary: { text: "Vezi serviciile", href: "/servicii" },
            backgroundImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600",
          }),
          block("featuresGrid", {
            title: "De ce ne aleg clientele",
            features: [
              { icon: "✨", title: "Stiliști certificați", text: "Echipa noastră are pregătire internațională" },
              { icon: "🌿", title: "Produse premium", text: "Folosim doar mărci recunoscute, fără paraben" },
              { icon: "📅", title: "Programare rapidă", text: "Rezervă online în 30 de secunde" },
            ],
          }),
          block("servicesPreview", {
            title: "Servicii populare",
            subtitle: "Cele mai cerute servicii din salon",
            ctaText: "Vezi toate serviciile",
            ctaHref: "/servicii",
          }),
          block("testimonials", {
            title: "Ce spun clientele noastre",
            items: [
              { author: "Maria P.", text: "Cea mai bună experiență de salon. Mă întorc lună de lună!", rating: 5 },
              { author: "Andreea D.", text: "Stil profesionist și atmosferă caldă. Recomand!", rating: 5 },
              { author: "Cristina M.", text: "Mereu plec mulțumită. Atenție la detalii incredibilă.", rating: 5 },
            ],
          }),
          block("ctaBanner", {
            title: "Programează-te acum",
            subtitle: "Prima ședință cu 20% reducere pentru noile cliente",
            ctaText: "Rezervă online",
            ctaHref: "/programari",
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Servicii",
        isHome: false,
        blocks: [
          block("hero", {
            title: "Serviciile noastre",
            subtitle: "O gamă completă pentru frumusețea ta",
            ctaPrimary: { text: "Programează-te", href: "/programari" },
          }),
          block("servicesList", {
            displayMode: "grid",
          }),
        ],
      },
      {
        slug: "despre",
        title: "Despre noi",
        isHome: false,
        blocks: [
          block("hero", {
            title: "Despre salonul nostru",
            subtitle: "Pasiune pentru frumusețe din 2014",
          }),
          block("textImage", {
            title: "Povestea noastră",
            text: "Am deschis acest salon cu visul de a oferi servicii de calitate într-o atmosferă caldă și prietenoasă. De atunci, am crescut alături de comunitatea noastră de cliente fidele.",
            imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
            imagePosition: "right",
          }),
          block("team", {
            title: "Echipa noastră",
            members: [
              { name: "Ana Popescu", role: "Hairstylist Senior", avatarUrl: "" },
              { name: "Elena Marin", role: "Cosmetician", avatarUrl: "" },
              { name: "Diana Stancu", role: "Manichiurist", avatarUrl: "" },
            ],
          }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", {
            title: "Rezervă-ți programarea",
            subtitle: "Alege serviciul, data și ora — confirmare instantă",
          }),
          block("bookingWidget", {
            showServicePicker: true,
            showStaffPicker: true,
          }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Contactează-ne", subtitle: "Suntem aici să te ajutăm" }),
          block("contactInfo", {
            showMap: true,
            showHours: true,
            showSocial: true,
          }),
          block("contactForm", {
            fields: ["name", "email", "phone", "message"],
          }),
        ],
      },
    ],
  },
  {
    slug: "barbershop-classic",
    name: "Frizerie Clasică",
    description: "Site pentru frizerie/barbershop cu look masculin și booking online.",
    category: "barbershop",
    industryTags: ["frizerie", "barbershop", "tuns", "barbă"],
    themeSlug: "barbershop-bold",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Stil. Tradiție. Bărbăție.",
            subtitle: "Frizerie clasică pentru bărbații care apreciază calitatea",
            ctaPrimary: { text: "Programează-te", href: "/programari" },
            backgroundImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600",
          }),
          block("servicesPreview", { title: "Serviciile noastre", ctaText: "Vezi tot", ctaHref: "/servicii" }),
          block("textImage", {
            title: "Mai mult decât o frizerie",
            text: "Aici nu doar te tunzi. Bei o cafea, asculți o poveste, ieși cu un look impecabil.",
            imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
            imagePosition: "left",
          }),
          block("ctaBanner", {
            title: "Programează-te online",
            ctaText: "Rezervă acum",
            ctaHref: "/programari",
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Servicii",
        isHome: false,
        blocks: [
          block("hero", { title: "Servicii", subtitle: "Prețuri clare, fără surprize" }),
          block("servicesList", { displayMode: "list" }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Rezervă", subtitle: "Alege ora care îți convine" }),
          block("bookingWidget", { showServicePicker: true, showStaffPicker: true }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Contact" }),
          block("contactInfo", { showMap: true, showHours: true, showSocial: true }),
        ],
      },
    ],
  },
  {
    slug: "spa-wellness-retreat",
    name: "SPA & Wellness",
    description: "Site pentru centre SPA cu accent pe relaxare și natură.",
    category: "spa_wellness",
    industryTags: ["spa", "wellness", "masaj", "relaxare"],
    themeSlug: "spa-wellness",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Reconectare cu tine",
            subtitle: "Tratamente SPA care îți redau echilibrul",
            ctaPrimary: { text: "Programează tratament", href: "/programari" },
            backgroundImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600",
          }),
          block("featuresGrid", {
            title: "Filosofia noastră",
            features: [
              { icon: "🌿", title: "Ingrediente naturale", text: "Produse organice certificate" },
              { icon: "🧘", title: "Terapeuți experimentați", text: "Echipa noastră are peste 1000 ore de pregătire" },
              { icon: "💧", title: "Atmosferă relaxantă", text: "Spații proiectate pentru deconectare totală" },
            ],
          }),
          block("servicesPreview", { title: "Tratamente populare", ctaText: "Vezi toate tratamentele", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Experiențe ale oaspeților noștri",
            items: [
              { author: "Ioana D.", text: "Mă simt ca într-o altă lume. O oază de pace.", rating: 5 },
              { author: "Mihai T.", text: "Cel mai bun masaj din oraș, fără îndoială.", rating: 5 },
            ],
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Tratamente",
        isHome: false,
        blocks: [
          block("hero", { title: "Tratamentele noastre", subtitle: "Un univers de relaxare" }),
          block("servicesList", { displayMode: "grid" }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Rezervă-ți momentul" }),
          block("bookingWidget", { showServicePicker: true }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Vino să ne cunoști" }),
          block("contactInfo", { showMap: true, showHours: true }),
        ],
      },
    ],
  },
  {
    slug: "cofetarie-artizanala",
    name: "Cofetărie Artizanală",
    description: "Site cald pentru cofetării, patiserii, brutării artizanale.",
    category: "bakery",
    industryTags: ["cofetărie", "patiserie", "tort", "comenzi"],
    themeSlug: "cafe-cozy",
    isFeatured: false,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Făcute cu drag, livrate cu pasiune",
            subtitle: "Torturi și deserturi artizanale pentru momentele speciale",
            ctaPrimary: { text: "Comandă tort", href: "/contact" },
            ctaSecondary: { text: "Vezi meniul", href: "/meniu" },
            backgroundImage: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1600",
          }),
          block("featuresGrid", {
            title: "De ce noi",
            features: [
              { icon: "🌾", title: "Ingrediente naturale", text: "Fără conservanți, fără arome artificiale" },
              { icon: "👩‍🍳", title: "Rețete proprii", text: "Dezvoltate în peste 8 ani de experiență" },
              { icon: "🎂", title: "Torturi personalizate", text: "Spune-ne ideea ta, o facem realitate" },
            ],
          }),
          block("servicesPreview", { title: "Produse populare", ctaText: "Meniul complet", ctaHref: "/meniu" }),
          block("ctaBanner", {
            title: "Comandă pentru evenimentul tău",
            subtitle: "Aniversări, botezuri, nunți — facem orice tort visezi",
            ctaText: "Cere ofertă",
            ctaHref: "/contact",
          }),
        ],
      },
      {
        slug: "meniu",
        title: "Meniu",
        isHome: false,
        blocks: [
          block("hero", { title: "Meniul nostru", subtitle: "Dulciuri pentru toate gusturile" }),
          block("servicesList", { displayMode: "grid" }),
        ],
      },
      {
        slug: "contact",
        title: "Contact & Comenzi",
        isHome: false,
        blocks: [
          block("hero", { title: "Comandă-ți tortul perfect" }),
          block("contactInfo", { showMap: true, showHours: true, showSocial: true }),
          block("contactForm", { fields: ["name", "phone", "email", "message"] }),
        ],
      },
    ],
  },
  {
    slug: "consultant-profesional",
    name: "Consultant Profesional",
    description: "Site curat pentru consultanți, avocați, contabili, asigurări.",
    category: "consulting",
    industryTags: ["consultant", "avocat", "contabil", "asigurări", "PFA"],
    themeSlug: "professional-clean",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Expertiză în care poți avea încredere",
            subtitle: "Servicii profesioniste pentru afacerea ta",
            ctaPrimary: { text: "Programează consultanță", href: "/programari" },
            ctaSecondary: { text: "Servicii", href: "/servicii" },
            backgroundImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600",
          }),
          block("featuresGrid", {
            title: "Ce ofer",
            features: [
              { icon: "📋", title: "Consultanță personalizată", text: "Analizez situația ta specifică și recomand soluții" },
              { icon: "⚖️", title: "Conformitate legală", text: "Toate procedurile respectă legislația în vigoare" },
              { icon: "🤝", title: "Relație pe termen lung", text: "Sunt partenerul tău, nu doar un furnizor" },
            ],
          }),
          block("servicesPreview", { title: "Servicii", ctaText: "Vezi toate", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Clienții mei",
            items: [
              { author: "SC. Tehno SRL", text: "Profesionist și mereu disponibil. Recomand cu încredere.", rating: 5 },
              { author: "PFA Constantin", text: "M-a ajutat să economisesc bani și timp.", rating: 5 },
            ],
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Servicii",
        isHome: false,
        blocks: [
          block("hero", { title: "Servicii oferite" }),
          block("servicesList", { displayMode: "list" }),
        ],
      },
      {
        slug: "despre",
        title: "Despre",
        isHome: false,
        blocks: [
          block("hero", { title: "Despre mine" }),
          block("textImage", {
            title: "Experiență de peste 15 ani",
            text: "Am ajutat sute de antreprenori să își dezvolte afacerea în condiții optime, respectând toate prevederile legale.",
            imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
            imagePosition: "left",
          }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Programează consultanță" }),
          block("bookingWidget", { showServicePicker: true }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Hai să vorbim" }),
          block("contactInfo", { showMap: false, showHours: true, showSocial: true }),
          block("contactForm", { fields: ["name", "email", "phone", "message"] }),
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────

async function seedSolo() {
  console.log("\n🌱 Seeding Solo wedge data (themes + templates)...\n");

  // Themes
  const themeIdBySlug = new Map<string, string>();
  for (const t of themes) {
    const [row] = await sql`
      INSERT INTO web_themes (
        tenant_id, slug, name, description,
        colors, typography,
        is_system, is_premium, is_active
      ) VALUES (
        NULL, ${t.slug}, ${t.name}, ${t.description},
        ${JSON.stringify(t.colors)}::jsonb, ${JSON.stringify(t.typography)}::jsonb,
        true, false, true
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    let id: string;
    if (row) {
      id = row.id as string;
    } else {
      const [existing] = await sql`
        SELECT id FROM web_themes WHERE slug = ${t.slug} AND tenant_id IS NULL LIMIT 1
      `;
      id = existing.id as string;
    }
    themeIdBySlug.set(t.slug, id);
  }
  console.log(`✓ Themes: ${themes.length} system themes`);

  // Templates
  for (const tpl of templates) {
    const themeId = themeIdBySlug.get(tpl.themeSlug) || null;

    await sql`
      INSERT INTO web_templates (
        slug, name, description, category, industry_tags, market_tags, languages,
        theme_id, pages_content, default_copy, required_modules,
        is_premium, is_featured, is_active, install_count, sort_order
      ) VALUES (
        ${tpl.slug}, ${tpl.name}, ${tpl.description}, ${tpl.category},
        ${JSON.stringify(tpl.industryTags)}::jsonb, ${JSON.stringify(["RO"])}::jsonb, ${JSON.stringify(["ro", "en"])}::jsonb,
        ${themeId}, ${JSON.stringify(tpl.pagesContent)}::jsonb, ${JSON.stringify({})}::jsonb, ${JSON.stringify(["booking"])}::jsonb,
        false, ${tpl.isFeatured}, true, 0, 0
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        industry_tags = EXCLUDED.industry_tags,
        theme_id = EXCLUDED.theme_id,
        pages_content = EXCLUDED.pages_content,
        is_featured = EXCLUDED.is_featured,
        updated_at = NOW()
    `;
  }
  console.log(`✓ Templates: ${templates.length} industry templates`);

  console.log("\n✅ Solo seed complete!\n");
  await sql.end();
}

seedSolo().catch((err) => {
  console.error("❌ Solo seed failed:", err);
  process.exit(1);
});
