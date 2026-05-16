// Configurations for /vs/<competitor> comparison landing pages.
// High-intent SEO: people who already use Booksy/Wix and search for
// alternatives are pre-qualified buyers.

export interface ComparisonRow {
  label: string;
  group?: string;
  openPortal: string | boolean;
  competitor: string | boolean;
}

export interface ComparisonData {
  slug: string;
  competitor: string;
  competitorLogo?: string; // optional emoji or text logo
  // SEO
  title: string;
  description: string;
  ogTitle: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  // Pricing teaser
  competitorPriceHint: string;
  openPortalPriceHint: string;
  // Comparison rows
  rows: ComparisonRow[];
  // Why-switch section
  whySwitch: Array<{ title: string; body: string }>;
  // FAQ
  faq: Array<{ q: string; a: string }>;
}

export const COMPARISONS: Record<string, ComparisonData> = {
  booksy: {
    slug: "booksy",
    competitor: "Booksy",
    competitorLogo: "💅",
    title: "OpenPortal vs Booksy — Alternativă mai ieftină și mai completă | OpenPortal",
    description:
      "Cauți alternativă la Booksy? OpenPortal include site web, facturare e-Factura ANAF și POS — la jumătate de preț. Migrare gratuită. Vezi comparația completă.",
    ogTitle: "OpenPortal vs Booksy — comparație completă",
    heroTitle: "Plătești Booksy 200+ lei/lună și încă ai nevoie de site separat?",
    heroSubtitle:
      "OpenPortal îți oferă programări online, site web, facturare ANAF și POS — într-un singur produs, la €25/lună (~125 lei). Plus migrare gratuită din Booksy.",
    competitorPriceHint: "Booksy de la 150 lei/lună + comisioane",
    openPortalPriceHint: "OpenPortal €25/lună (~125 lei), fără comisioane",
    rows: [
      // Pricing
      { label: "Preț de pornire", group: "Preț", openPortal: "€25/lună fix", competitor: "Min. 150 lei/lună + comisioane" },
      { label: "Comisioane pe rezervări online", openPortal: "0%", competitor: "Variabil" },
      { label: "Setup fee", openPortal: "Zero", competitor: "Zero" },
      { label: "Trial gratuit", openPortal: "14 zile, fără card", competitor: "14 zile" },
      // Booking
      { label: "Programări online 24/7", group: "Programări", openPortal: true, competitor: true },
      { label: "Calendar per resursă (staff)", openPortal: true, competitor: true },
      { label: "Reminder email cu 24h și 2h", openPortal: true, competitor: true },
      { label: "Self-cancel + self-reschedule", openPortal: true, competitor: "Doar cancel" },
      { label: "Embed widget pentru site extern", openPortal: true, competitor: "Limitat" },
      // Site
      { label: "Site web propriu inclus", group: "Site web", openPortal: true, competitor: false },
      { label: "Editor vizual no-code", openPortal: true, competitor: false },
      { label: "Domeniu propriu", openPortal: "Plan Pro", competitor: "Nu" },
      { label: "Template-uri industrie", openPortal: "40+", competitor: "Doar profil business" },
      { label: "SEO + meta tags personalizate", openPortal: true, competitor: false },
      // Billing
      { label: "Facturare ANAF e-Factura", group: "Facturare", openPortal: true, competitor: false },
      { label: "Emitere facturi pe loc", openPortal: true, competitor: "Indirect" },
      { label: "Link plată Stripe pe factură", openPortal: true, competitor: false },
      { label: "Track restanțe + aging", openPortal: true, competitor: false },
      // POS
      { label: "POS terminal cu stoc", group: "POS", openPortal: true, competitor: false },
      { label: "Z-Report zilnic conform legii", openPortal: true, competitor: false },
      // AI
      { label: "Chat AI cu Claude pe site", group: "AI", openPortal: true, competitor: false },
      // Other
      { label: "Open-source (AGPLv3)", group: "Alte", openPortal: true, competitor: false },
      { label: "Date stocate exclusiv în UE", openPortal: true, competitor: "Cloud SUA" },
      { label: "Export complet date (CSV)", openPortal: true, competitor: "Limitat" },
      { label: "Migrare gratuită din competitor", openPortal: true, competitor: "—" },
    ],
    whySwitch: [
      {
        title: "Ai un produs, nu trei",
        body:
          "Booksy face doar programări. Plătești separat pentru site (Wix ~80 lei/lună), facturare (FGO ~50 lei/lună), POS (50+ lei/lună). OpenPortal le combină pe toate.",
      },
      {
        title: "Site-ul tău, nu un profil în catalogul lor",
        body:
          "Pe Booksy ești un profil printre alții, lângă concurența ta. Cu OpenPortal ai site-ul tău cu domeniul tău — clienții vin direct la tine.",
      },
      {
        title: "ANAF e-Factura integrat",
        body:
          "Booksy nu emite facturi conforme cu reglementările române. Cu OpenPortal generezi UBL 2.1 CIUS-RO și trimiți automat în SPV — fără tool separat.",
      },
      {
        title: "Migrare gratuită",
        body:
          "Importăm gratuit clienți, programări, istoric din Booksy. În 48h ești operațional pe OpenPortal cu toate datele tale.",
      },
    ],
    faq: [
      {
        q: "Pot importa programările existente din Booksy?",
        a: "Da, gratuit. Tu exporți CSV-ul din Booksy (Settings → Export), îl trimiți pe email, iar echipa noastră îl încarcă în 24h.",
      },
      {
        q: "Pierd clienții fideli dacă schimb?",
        a: "Nu. Importăm clienții cu telefon + email + istoric. Clienții tăi te găsesc pe noul site, pot rezerva fără să-și facă cont nou.",
      },
      {
        q: "Ce se întâmplă cu profilul meu Booksy?",
        a: "Îl poți păstra în paralel cât vrei. Mulți utilizatori îl mențin 1-2 luni ca tranziție, apoi îl închid când clienții s-au mutat la rezervări direct prin site.",
      },
      {
        q: "Pot anula oricând dacă nu mă mulțumește?",
        a: "Da. Plan lunar fără contract. Exporți datele tale (clienți, programări, facturi) oricând în CSV.",
      },
    ],
  },

  wix: {
    slug: "wix",
    competitor: "Wix",
    competitorLogo: "🌐",
    title: "OpenPortal vs Wix — Site + programări + facturare integrate | OpenPortal",
    description:
      "Wix e bun la site, dar pentru programări și facturare ANAF ai nevoie de tool-uri extra. OpenPortal le combină pe toate la €25/lună. Vezi comparația.",
    ogTitle: "OpenPortal vs Wix — alternativă all-in-one pentru solo business",
    heroTitle: "Wix face site frumos. Dar nu programări online, nu e-Factura ANAF, nu POS.",
    heroSubtitle:
      "OpenPortal e construit special pentru solo business: site profesional + programări + facturare ANAF + POS, toate integrate. La un preț comparabil cu Wix-ul singur.",
    competitorPriceHint: "Wix de la $14/lună + Wix Bookings $39/lună",
    openPortalPriceHint: "OpenPortal €25/lună — tot inclus",
    rows: [
      { label: "Preț de pornire", group: "Preț", openPortal: "€25/lună (~€25)", competitor: "$14 + $39 Bookings = ~$53/lună" },
      { label: "Setup fee", openPortal: "Zero", competitor: "Zero" },
      { label: "Trial gratuit", openPortal: "14 zile, fără card", competitor: "Plan gratuit cu reclame Wix" },

      { label: "Site web cu editor vizual", group: "Site web", openPortal: true, competitor: true },
      { label: "Template-uri profesionale", openPortal: "40+ industrie", competitor: "900+ generice" },
      { label: "Domeniu propriu", openPortal: "Plan Pro", competitor: "Plan plătit" },
      { label: "Înlăturare branding", openPortal: "Plan Pro", competitor: "Plan plătit" },
      { label: "Blog integrat", openPortal: "În roadmap", competitor: true },

      { label: "Programări online", group: "Programări", openPortal: "Native", competitor: "Wix Bookings (cost extra)" },
      { label: "Calendar per resursă", openPortal: true, competitor: true },
      { label: "Reminder 24h + 2h", openPortal: true, competitor: "Limitat" },
      { label: "Self-cancel + reschedule", openPortal: true, competitor: "Limitat" },

      { label: "Facturare ANAF e-Factura", group: "Facturare", openPortal: true, competitor: false },
      { label: "Plăți Stripe pe factură", openPortal: true, competitor: "Wix Payments doar" },
      { label: "Track restanțe", openPortal: true, competitor: false },

      { label: "POS terminal", group: "POS", openPortal: true, competitor: "Wix POS (US/Canada only)" },
      { label: "Z-Report ANAF-compliant", openPortal: true, competitor: false },

      { label: "Chat AI nativ", group: "AI", openPortal: "Claude integrat", competitor: "Doar chatbot basic" },

      { label: "Open-source", group: "Alte", openPortal: "AGPLv3", competitor: "Proprietary" },
      { label: "Suport în limba română", openPortal: true, competitor: "Doar EN" },
      { label: "GDPR + DPA pentru clienți EU", openPortal: "DPA semnat oferit", competitor: "Termen general" },
      { label: "Date stocate exclusiv în UE", openPortal: true, competitor: "Cloud SUA / global" },
    ],
    whySwitch: [
      {
        title: "Construit pentru business-uri RO",
        body:
          "Wix e generic pentru orice piață. OpenPortal e construit pentru solo business din România — ANAF e-Factura, casa de marcat conformă, suport în română.",
      },
      {
        title: "Un singur produs, nu 3 abonamente",
        body:
          "Cu Wix plătești separat pentru site, Wix Bookings (programări), Wix Payments. Total ~$53/lună. OpenPortal include tot la €25/lună.",
      },
      {
        title: "Editor mai rapid pentru solo business",
        body:
          "Wix e excelent dar are zeci de funcții pe care nu le vei folosi. OpenPortal e optimizat pentru cazul tipic: site + programări + facturare în 60 secunde.",
      },
      {
        title: "Open-source",
        body:
          "Codul OpenPortal e public pe GitHub. Poți audita, contribui, sau găzdui propria instanță. Wix e cutie neagră.",
      },
    ],
    faq: [
      {
        q: "Pot migra site-ul meu Wix la OpenPortal?",
        a: "Conținutul (texte, imagini) îl exporți din Wix și-l reîncarci în OpenPortal. Pentru migrarea integrală asistată, contactează-ne pe hello@openportal.app — facem mutarea gratuit în 48h.",
      },
      {
        q: "Wix are mai multe template-uri, nu?",
        a: "Wix are 900+ template-uri generice. OpenPortal are 40+ template-uri specializate pe industrie (saloane, frizerii, cofetării, cabinete medicale, etc.) — mai puține opțiuni, dar fiecare optimizată pentru cazul tău.",
      },
      {
        q: "Pot avea blog pe OpenPortal?",
        a: "Blog-ul e în roadmap pentru Q2 2026. Pentru moment, dacă blog-ul e critic pentru tine, Wix sau Ghost rămân alternative bune (le poți integra prin subdomeniu).",
      },
      {
        q: "Care e diferența la SEO?",
        a: "OpenPortal generează sitemap.xml, robots.txt, meta tags, JSON-LD LocalBusiness automat — totul SEO-ready. Wix necesită configurare manuală + Wix SEO Wiz separat.",
      },
    ],
  },
};

export function getComparison(slug: string): ComparisonData | undefined {
  return COMPARISONS[slug];
}

export const COMPARISON_SLUGS = Object.keys(COMPARISONS);
