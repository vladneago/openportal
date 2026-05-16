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
  // ─────────────────────────────────────────────
  // Template 6: Cabinet medical
  // ─────────────────────────────────────────────
  {
    slug: "medical-clinic-trust",
    name: "Cabinet Medical",
    description: "Site profesional pentru cabinete medicale, clinici, medici de familie.",
    category: "medical",
    industryTags: ["medic", "cabinet", "clinică", "medicină de familie", "specialist"],
    themeSlug: "medical-trust",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Sănătatea ta, prioritatea noastră",
            subtitle: "Servicii medicale de încredere, într-un cabinet modern și prietenos",
            ctaPrimary: { text: "Programează consultație", href: "/programari" },
            ctaSecondary: { text: "Vezi specialitățile", href: "/servicii" },
            backgroundImage: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600",
          }),
          block("featuresGrid", {
            title: "De ce ne aleg pacienții",
            features: [
              { icon: "🩺", title: "Medici specialiști", text: "Experiență de peste 15 ani în domeniu" },
              { icon: "🔬", title: "Echipamente moderne", text: "Tehnologie medicală de ultimă generație" },
              { icon: "⏱️", title: "Fără cozi", text: "Programare online, respectăm ora rezervată" },
              { icon: "🤝", title: "Comunicare empatică", text: "Îți explicăm tot, fără jargon medical" },
            ],
          }),
          block("servicesPreview", { title: "Specialități medicale", ctaText: "Vezi toate serviciile", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Pacienți mulțumiți",
            items: [
              { author: "Marian I.", text: "Doctor foarte atent, m-am simțit ascultat. Recomand cu drag.", rating: 5 },
              { author: "Elena B.", text: "Programare online rapidă, fără așteptare. Excelent!", rating: 5 },
            ],
          }),
          block("ctaBanner", {
            title: "Ai nevoie de un consult?",
            subtitle: "Programează-te online — fără telefoane, fără așteptări",
            ctaText: "Rezervă acum",
            ctaHref: "/programari",
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Specialități",
        isHome: false,
        blocks: [
          block("hero", { title: "Specialități medicale", subtitle: "O gamă completă de servicii medicale" }),
          block("servicesList", { displayMode: "list" }),
        ],
      },
      {
        slug: "echipa",
        title: "Echipa medicală",
        isHome: false,
        blocks: [
          block("hero", { title: "Echipa medicală", subtitle: "Medici cu experiență, dedicați pacienților" }),
          block("team", {
            title: "Specialiștii noștri",
            members: [
              { name: "Dr. Andrei Popescu", role: "Medic primar Medicina Familiei", avatarUrl: "" },
              { name: "Dr. Maria Ionescu", role: "Medic specialist Cardiologie", avatarUrl: "" },
            ],
          }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Programează o consultație", subtitle: "Alege specialitatea, data și ora" }),
          block("bookingWidget", { showServicePicker: true, showStaffPicker: true }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Cum ne găsești" }),
          block("contactInfo", { showMap: true, showHours: true, showSocial: false }),
          block("contactForm", { fields: ["name", "email", "phone", "message"] }),
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Template 7: Stomatolog
  // ─────────────────────────────────────────────
  {
    slug: "dental-care-modern",
    name: "Cabinet Stomatologic",
    description: "Site curat pentru cabinete stomatologice cu accent pe încredere și transparență.",
    category: "dental",
    industryTags: ["stomatolog", "dentist", "cabinet dentar", "ortodonție", "implanturi"],
    themeSlug: "medical-trust",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Zâmbetul tău, în mâini sigure",
            subtitle: "Stomatologie modernă, fără durere, cu prețuri transparente",
            ctaPrimary: { text: "Programează consult", href: "/programari" },
            backgroundImage: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1600",
          }),
          block("featuresGrid", {
            title: "De ce noi",
            features: [
              { icon: "🦷", title: "Tratamente moderne", text: "Tehnologie laser, scanare 3D, materiale premium" },
              { icon: "💉", title: "Anestezie computerizată", text: "Fără durere, fără frică" },
              { icon: "💰", title: "Prețuri transparente", text: "Devizul îți este prezentat înainte de tratament" },
              { icon: "📅", title: "Planificare pe etape", text: "Tratamente eșalonate, pe bugetul tău" },
            ],
          }),
          block("servicesPreview", { title: "Servicii stomatologice", ctaText: "Vezi tot", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Pacienți care zâmbesc",
            items: [
              { author: "Ioana M.", text: "Mi-au făcut implant fără să simt nimic. Profesioniști!", rating: 5 },
              { author: "Adrian D.", text: "Cei mai buni dentiști din oraș. Mereu mă întorc cu drag.", rating: 5 },
              { author: "Carmen T.", text: "Prețuri corecte, calitate ireproșabilă. Recomand!", rating: 5 },
            ],
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Servicii",
        isHome: false,
        blocks: [
          block("hero", { title: "Servicii stomatologice" }),
          block("servicesList", { displayMode: "grid" }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Programează-te", subtitle: "Online, în mai puțin de 1 minut" }),
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
  // ─────────────────────────────────────────────
  // Template 8: Personal trainer / Sala fitness
  // ─────────────────────────────────────────────
  {
    slug: "fitness-personal-trainer",
    name: "Personal Trainer",
    description: "Site energic pentru antrenori personali, săli fitness, studio yoga și pilates.",
    category: "fitness",
    industryTags: ["fitness", "personal trainer", "antrenor", "yoga", "pilates", "sala"],
    themeSlug: "fitness-energy",
    isFeatured: true,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Transformă-ți corpul. Schimbă-ți viața.",
            subtitle: "Antrenamente personalizate pentru rezultate reale",
            ctaPrimary: { text: "Rezervă o ședință", href: "/programari" },
            ctaSecondary: { text: "Vezi programele", href: "/servicii" },
            backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600",
          }),
          block("featuresGrid", {
            title: "Cum lucrăm",
            features: [
              { icon: "💪", title: "Programe personalizate", text: "Plan adaptat obiectivelor și fizicului tău" },
              { icon: "🥗", title: "Consiliere nutrițională", text: "Planul de alimentație complementar antrenamentelor" },
              { icon: "📊", title: "Track progres", text: "Măsurători săptămânale, ajustăm strategia continuu" },
              { icon: "🎯", title: "Rezultate garantate", text: "Dacă nu vezi progres în 3 luni, banii înapoi" },
            ],
          }),
          block("servicesPreview", { title: "Pachete antrenament", ctaText: "Vezi toate pachetele", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Transformări reale",
            items: [
              { author: "Alex R.", text: "Am slăbit 15kg în 6 luni. Echipă excelentă!", rating: 5 },
              { author: "Maria V.", text: "Mi-am redescoperit forța. Recomand 100%!", rating: 5 },
            ],
          }),
          block("ctaBanner", {
            title: "Prima ședință e GRATUITĂ",
            subtitle: "Hai să discutăm obiectivele tale fără obligație",
            ctaText: "Programează evaluare",
            ctaHref: "/programari",
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Pachete",
        isHome: false,
        blocks: [
          block("hero", { title: "Pachete și prețuri", subtitle: "Alege programul potrivit pentru tine" }),
          block("servicesList", { displayMode: "grid" }),
        ],
      },
      {
        slug: "despre",
        title: "Despre",
        isHome: false,
        blocks: [
          block("hero", { title: "Despre mine", subtitle: "Antrenor certificat cu 10+ ani experiență" }),
          block("textImage", {
            title: "Pasiune pentru transformare",
            text: "Am ajutat peste 200 de clienți să-și atingă obiectivele de fitness. De la pierdere în greutate la pregătire pentru competiții, fiecare program e gândit individual.",
            imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
            imagePosition: "right",
          }),
        ],
      },
      {
        slug: "programari",
        title: "Programări",
        isHome: false,
        blocks: [
          block("hero", { title: "Programează ședința" }),
          block("bookingWidget", { showServicePicker: true, showStaffPicker: false }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Contactează-mă" }),
          block("contactInfo", { showMap: true, showHours: true, showSocial: true }),
          block("contactForm", { fields: ["name", "email", "phone", "message"] }),
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Template 9: Fotograf
  // ─────────────────────────────────────────────
  {
    slug: "photographer-portfolio",
    name: "Studio Foto",
    description: "Site portfolio elegant pentru fotografi, videografi, studio foto.",
    category: "photographer",
    industryTags: ["fotograf", "videograf", "studio foto", "nuntă", "evenimente", "portrait"],
    themeSlug: "professional-clean",
    isFeatured: false,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Momentele tale, surprinse perfect",
            subtitle: "Fotografie de eveniment, portret și produs cu suflet",
            ctaPrimary: { text: "Rezervă ședință", href: "/programari" },
            ctaSecondary: { text: "Vezi portofoliul", href: "/portofoliu" },
            backgroundImage: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600",
          }),
          block("featuresGrid", {
            title: "Servicii foto",
            features: [
              { icon: "💍", title: "Nunți & evenimente", text: "Surprind emoția fiecărui moment important" },
              { icon: "👨‍👩‍👧", title: "Portrete de familie", text: "Sesiuni relaxate, în studio sau outdoor" },
              { icon: "📦", title: "Fotografie produs", text: "Pentru shop online, lifestyle, advertising" },
              { icon: "🎓", title: "Promoții & corporate", text: "Headshots, team photos, evenimente brand" },
            ],
          }),
          block("servicesPreview", { title: "Pachete foto", ctaText: "Vezi prețuri", ctaHref: "/servicii" }),
          block("testimonials", {
            title: "Clienții mei spun",
            items: [
              { author: "Andra & Mihai", text: "Pozele de la nuntă sunt magice. Mulțumim din suflet!", rating: 5 },
              { author: "Catalin S.", text: "Profesionist, punctual, rezultate spectaculoase.", rating: 5 },
            ],
          }),
        ],
      },
      {
        slug: "portofoliu",
        title: "Portofoliu",
        isHome: false,
        blocks: [
          block("hero", { title: "Portofoliu", subtitle: "Câteva dintre proiectele mele preferate" }),
          block("textImage", {
            title: "Stil fotografic propriu",
            text: "Lucrez în stil natural, fără pose forțate. Caut momentele autentice, lumina caldă, emoțiile reale.",
            imageUrl: "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=800",
            imagePosition: "left",
          }),
        ],
      },
      {
        slug: "servicii",
        title: "Servicii",
        isHome: false,
        blocks: [
          block("hero", { title: "Servicii și pachete" }),
          block("servicesList", { displayMode: "list" }),
        ],
      },
      {
        slug: "programari",
        title: "Rezervări",
        isHome: false,
        blocks: [
          block("hero", { title: "Rezervă o sesiune foto" }),
          block("bookingWidget", { showServicePicker: true, showStaffPicker: false }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Hai să discutăm proiectul tău" }),
          block("contactInfo", { showMap: false, showHours: false, showSocial: true }),
          block("contactForm", { fields: ["name", "email", "phone", "message"] }),
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Template 10: Florărie
  // ─────────────────────────────────────────────
  {
    slug: "florist-boutique",
    name: "Florărie Boutique",
    description: "Site cald și colorat pentru florării, aranjamente florale, livrări evenimente.",
    category: "florist",
    industryTags: ["florărie", "flori", "aranjamente", "buchete", "livrare flori", "evenimente"],
    themeSlug: "beauty-vintage",
    isFeatured: false,
    pagesContent: [
      {
        slug: "",
        title: "Acasă",
        isHome: true,
        blocks: [
          block("hero", {
            title: "Florile spun ce cuvintele nu pot",
            subtitle: "Aranjamente florale unice, livrate cu emoție",
            ctaPrimary: { text: "Comandă acum", href: "/comenzi" },
            ctaSecondary: { text: "Vezi colecția", href: "/colectie" },
            backgroundImage: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600",
          }),
          block("featuresGrid", {
            title: "De ce florăria noastră",
            features: [
              { icon: "🌸", title: "Flori proaspete zilnic", text: "Importăm direct de la cei mai buni furnizori" },
              { icon: "🚚", title: "Livrare în 2 ore", text: "În tot orașul, gratis peste 150 lei" },
              { icon: "💝", title: "Aranjamente personalizate", text: "Spune-ne ocazia, creăm buchetul perfect" },
              { icon: "📞", title: "Comenzi pentru evenimente", text: "Nunți, botezuri, corporate, conferințe" },
            ],
          }),
          block("servicesPreview", { title: "Buchete populare", ctaText: "Vezi toate aranjamentele", ctaHref: "/colectie" }),
          block("ctaBanner", {
            title: "Vrei buchete săptămânale?",
            subtitle: "Abonament pentru birou sau acasă — flori proaspete în fiecare săptămână",
            ctaText: "Solicită ofertă",
            ctaHref: "/contact",
          }),
        ],
      },
      {
        slug: "colectie",
        title: "Colecție",
        isHome: false,
        blocks: [
          block("hero", { title: "Colecția noastră", subtitle: "Aranjamente pentru orice ocazie" }),
          block("servicesList", { displayMode: "grid" }),
        ],
      },
      {
        slug: "comenzi",
        title: "Comenzi",
        isHome: false,
        blocks: [
          block("hero", { title: "Comandă online", subtitle: "Alege buchetul, alege momentul" }),
          block("bookingWidget", { showServicePicker: true, showStaffPicker: false }),
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        isHome: false,
        blocks: [
          block("hero", { title: "Vino la noi sau ne suni" }),
          block("contactInfo", { showMap: true, showHours: true, showSocial: true }),
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
