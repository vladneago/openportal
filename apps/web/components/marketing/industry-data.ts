// Industry-specific landing page configurations.
// Each entry defines the copy + accent color for a vertical landing page
// (e.g. /saloane, /frizerii). All landings share the same React template
// to keep maintenance cost low.

export interface IndustryPainPoint {
  problem: string;
  solution: string;
}

export interface IndustryFeature {
  icon: string;
  title: string;
  body: string;
}

export interface IndustryLandingData {
  slug: string;
  // SEO
  title: string;
  description: string;
  ogTitle: string;
  // Hero
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  // Visual
  accentHex: string;
  // Why this industry needs OpenPortal
  painPoints: IndustryPainPoint[];
  // Features highlighted for this industry
  features: IndustryFeature[];
  // Social proof — examples of similar businesses (anonymized until we have real ones)
  testimonialSnippet: { who: string; quote: string };
  // FAQ items specific to the vertical
  faq: Array<{ q: string; a: string }>;
}

export const INDUSTRY_LANDINGS: Record<string, IndustryLandingData> = {
  saloane: {
    slug: "saloane",
    title: "Site pentru salon de înfrumusețare — Programări online + facturare | OpenPortal",
    description:
      "Lansează site-ul salonului tău în 60 de secunde. Programări online 24/7, reminder automat, facturare e-Factura ANAF. €25/lună, 14 zile gratis.",
    ogTitle: "OpenPortal pentru saloane — site, programări, facturare",
    heroBadge: "💇 Pentru saloane de înfrumusețare",
    heroTitle: "Salonul tău online,",
    heroHighlight: "în 60 de secunde",
    heroSubtitle:
      "Site cu rezervări online, calendar pentru fiecare stilist, reminder automat pe email, facturare e-Factura — totul integrat.",
    accentHex: "#EC4899",
    painPoints: [
      {
        problem: "Clientele te sună la 10 seara pentru programări",
        solution: "Rezervare online 24/7 direct pe site. Tu dormi, calendarul se umple.",
      },
      {
        problem: "Jumătate dintre programări sunt no-show",
        solution: "Reminder automat cu 24h și 2h înainte pe email. Reduce no-show cu 50%.",
      },
      {
        problem: "Plătești 200 lei/lună pe Booksy + 100 lei pe site + 80 lei pe facturare",
        solution: "OpenPortal le combină pe toate la €25/lună. Economisești 50% pe lună.",
      },
      {
        problem: "Stilistele au calendare diferite și se ciocnesc programările",
        solution: "Fiecare stilistă are propriul calendar. Sistem inteligent care nu permite suprapuneri.",
      },
    ],
    features: [
      {
        icon: "📅",
        title: "Calendar per stilist",
        body: "Adaugă echipa, fiecare cu propriile servicii, prețuri și ore disponibile. Calendarul comun se umple fără conflicte.",
      },
      {
        icon: "💋",
        title: "Site profesional",
        body: "Template-uri optimizate pentru saloane: galerie, prețuri, echipă, hartă. Editezi în browser, fără cod.",
      },
      {
        icon: "📲",
        title: "Reminder automat",
        body: "Email cu 24h și 2h înainte. Customer-ul poate anula sau reprograma online — nu mai sună la salon.",
      },
      {
        icon: "🧾",
        title: "Facturi + e-Factura",
        body: "Emite factură pe loc cu un click. Trimisă automat în SPV (ANAF). Track plăți și restanțe.",
      },
      {
        icon: "💬",
        title: "Chat AI pentru salon",
        body: "Asistent virtual care răspunde la întrebări despre programări, prețuri, locație. 24/7.",
      },
      {
        icon: "📊",
        title: "Rapoarte clare",
        body: "Vezi încasări zilnice, top servicii, clienți noi, retenție. Pe dashboard sau export Excel.",
      },
    ],
    testimonialSnippet: {
      who: "Salon Iris — Cluj",
      quote:
        "În prima săptămână, 60% din programări au venit online. Nu mai răspund la telefon ca acum 5 ani.",
    },
    faq: [
      {
        q: "Pot să import programările existente din Booksy/Excel?",
        a: "Da, oferim import gratuit din CSV. Echipa noastră poate ajuta cu migrarea în primele zile, fără cost suplimentar.",
      },
      {
        q: "Cât costă pentru un salon cu 5 stiliste?",
        a: "Pe planul Solo €25/lună ai până la 3 angajați. Peste 3 trec pe planul Solo Pro €50/lună, fără alte costuri.",
      },
      {
        q: "Cum funcționează cu Instagram?",
        a: "Pui link-ul de rezervare în bio sau adaugi widget-ul OpenPortal la postări. Clientele rezervă într-un click, direct de pe Instagram.",
      },
    ],
  },

  frizerii: {
    slug: "frizerii",
    title: "Site pentru frizerie / barbershop — Programări online | OpenPortal",
    description:
      "Site barbershop cu rezervări online, calendar per frizer, reminder automat și facturare. Look masculin, design clasic. €25/lună.",
    ogTitle: "OpenPortal pentru frizerii — programări online + site",
    heroBadge: "💈 Pentru frizerii și barbershop",
    heroTitle: "Frizeria ta,",
    heroHighlight: "open 24/7 online",
    heroSubtitle:
      "Clienții rezervă singuri ora când vor. Tu te concentrezi pe foarfece, nu pe telefon. Plus reminder automat și facturare integrată.",
    accentHex: "#F59E0B",
    painPoints: [
      {
        problem: "Răspunzi la telefon în loc să tunzi",
        solution: "Rezervări online 24/7. Telefonul tău sună doar pentru urgențe reale.",
      },
      {
        problem: "Clienții pleacă la concurență pentru că tu nu primești WhatsApp la 11 seara",
        solution: "Sistem care lucrează 24/7. Clientul vede orele libere și rezervă pe loc.",
      },
      {
        problem: "Plătești comision la fiecare rezervare prin platforme",
        solution: "0% comision pe rezervări. Plătești €25/lună fix și gata.",
      },
      {
        problem: "Pierzi clienți fideli pentru că nu le aduci aminte",
        solution: "Reminder automat la 24h și 2h. Clienții fideli vin la timp.",
      },
    ],
    features: [
      {
        icon: "✂️",
        title: "Calendar per frizer",
        body: "Fiecare frizer își gestionează propriul orar. Clienții aleg frizerul preferat sau primul disponibil.",
      },
      {
        icon: "🎨",
        title: "Design masculin",
        body: "Template-uri cu look bold, tipografie puternică. Nu mai semeni cu un salon de damă.",
      },
      {
        icon: "📱",
        title: "Optimizat pentru telefon",
        body: "Clienții rezervă în 30 secunde de pe mobil. Fără descărcat aplicație, fără cont nou.",
      },
      {
        icon: "💵",
        title: "Bon fiscal + factură",
        body: "Emite bon sau factură direct din POS. Compatibil cu cerințele ANAF e-Factura.",
      },
      {
        icon: "🔔",
        title: "Reminder + reprogramare",
        body: "Email cu 24h și 2h. Clientul poate reprograma online — nu mai blochezi ora degeaba.",
      },
      {
        icon: "💸",
        title: "Track tips & încasări",
        body: "Vezi încasări per frizer, tips, comisioane. Z-Report la sfârșit de zi.",
      },
    ],
    testimonialSnippet: {
      who: "Barbershop Alfa — București",
      quote:
        "După 2 luni cu OpenPortal, am crescut cu 40% rezervările. Telefonul tace, foarfecă lucrează.",
    },
    faq: [
      {
        q: "Pot folosi sistemul pentru POS și casă de marcat?",
        a: "Da. POS-ul integrat acceptă plăți cash, card, transfer. Pentru casa de marcat fiscală conform legii, sistemul exportă date conform formatului ANAF.",
      },
      {
        q: "Ce se întâmplă dacă pică internetul?",
        a: "Datele se sincronizează automat când revine net-ul. Programările existente sunt vizibile offline pe dashboard.",
      },
      {
        q: "Pot avea mai multe locații în același cont?",
        a: "Da, pe planul Solo Pro €50/lună ai resurse nelimitate, perfect pentru 2-3 locații sub același brand.",
      },
    ],
  },

  "cabinete-medicale": {
    slug: "cabinete-medicale",
    title: "Site pentru cabinet medical — Programări online + ANAF | OpenPortal",
    description:
      "Site profesional pentru cabinete medicale și clinici. Programări online, fișa pacient digitală, e-Factura ANAF, GDPR-compliant. €25/lună.",
    ogTitle: "OpenPortal pentru cabinete medicale și clinici",
    heroBadge: "🩺 Pentru cabinete medicale și clinici",
    heroTitle: "Cabinetul tău digital,",
    heroHighlight: "fără cozi la programări",
    heroSubtitle:
      "Pacienții se programează online, primesc confirmare și reminder. Tu vezi calendarul, emiți facturi conforme cu ANAF, gestionezi dosare digital — totul cu GDPR.",
    accentHex: "#0EA5E9",
    painPoints: [
      {
        problem: "Secretara petrece 4 ore/zi cu programări telefonice",
        solution: "Programări online prin site. Secretara are timp pentru ce e cu adevărat important.",
      },
      {
        problem: "Pacienții lipsesc fără să anunțe",
        solution: "Reminder automat cu 24h și 2h. Self-cancel sau reschedule online — știi exact cine vine.",
      },
      {
        problem: "Date pacienți în Excel, neasigurate, neîn conformitate GDPR",
        solution: "Bază de date criptată în UE, izolare multi-tenant, log de acces, GDPR-ready.",
      },
      {
        problem: "Facturarea către clinică sau asigurări durează ore",
        solution: "Facturare în 10 secunde. Trimitere automată e-Factura SPV. Aging report pentru restanțe.",
      },
    ],
    features: [
      {
        icon: "🩺",
        title: "Calendar per medic + cabinet",
        body: "Fiecare medic are propriul orar. Programări pe specialități, alocare automată în cabinete.",
      },
      {
        icon: "📋",
        title: "Fișa pacient digitală",
        body: "Istoric consultații, alergii, tratamente. Toate datele criptate, acces strict bazat pe rol.",
      },
      {
        icon: "🔒",
        title: "GDPR + ANSPDCP-ready",
        body: "Consents granulare, log de acces, DPA gata semnat. Date stocate exclusiv în UE.",
      },
      {
        icon: "🇷🇴",
        title: "ANAF e-Factura nativ",
        body: "Generare UBL 2.1 conform CIUS-RO. Submit automat în SPV. Status acceptat/respins direct în dashboard.",
      },
      {
        icon: "📱",
        title: "Site pentru pacienți noi",
        body: "Template-uri pentru cabinete: prezentare medici, specialități, prețuri, hartă. SEO local optimizat.",
      },
      {
        icon: "💬",
        title: "Chat AI pentru triere",
        body: "Asistent virtual care răspunde la întrebări comune și redirecționează urgențele direct la tine.",
      },
    ],
    testimonialSnippet: {
      who: "Cabinet Medicover — Iași",
      quote:
        "Am eliminat 80% din telefoanele pentru programări. Pacienții se programează seara, văd reminder-ul, vin la timp.",
    },
    faq: [
      {
        q: "Sunteți în conformitate cu reglementările medicale din România?",
        a: "Da. Datele pacienților sunt stocate exclusiv în UE, criptate end-to-end, cu log complet de acces. DPA semnat oferit oricărui client la cerere.",
      },
      {
        q: "Pot lucra mai mulți medici cu propriile conturi?",
        a: "Da. Pe planul Solo Pro ai utilizatori nelimitați, fiecare cu rolul lui (medic, asistent, recepție). Permisiuni granulate.",
      },
      {
        q: "Funcționează cu CNAS sau cu asigurări private?",
        a: "Facturarea generează documente conforme cu cerințele CNAS și ale asigurărilor. Integrare directă cu Casa de Sănătate este în roadmap.",
      },
    ],
  },

  cofetarii: {
    slug: "cofetarii",
    title: "Site pentru cofetărie / patiserie — Comenzi online | OpenPortal",
    description:
      "Site profesional pentru cofetării și patiserii. Comenzi online de torturi personalizate, programare pickup, plăți integrate. €25/lună.",
    ogTitle: "OpenPortal pentru cofetării — comenzi online + site",
    heroBadge: "🎂 Pentru cofetării și patiserii",
    heroTitle: "Comenzile tale,",
    heroHighlight: "fără confuzii",
    heroSubtitle:
      "Site cu meniu, formulare de comandă pentru torturi personalizate, programare pickup, plăți online. Nu mai pierzi comenzi în notițe pe hârtie.",
    accentHex: "#D97706",
    painPoints: [
      {
        problem: "Comenzile vin pe Instagram, WhatsApp, telefon — și pierzi câte una",
        solution: "Toate comenzile într-un singur loc — dashboard centralizat cu deadline-uri și status.",
      },
      {
        problem: "Clienții uită ziua de ridicare pentru tort",
        solution: "Reminder automat cu 24h și 2h înainte de pickup. Nu mai rămâi cu tort necolectat.",
      },
      {
        problem: "Pierzi timp explicând prețuri și disponibilitate",
        solution: "Site cu meniu, prețuri, gallery, FAQ. Clienții văd totul singuri.",
      },
      {
        problem: "Facturile pentru evenimente mari sunt o bătaie de cap",
        solution: "Facturare în 10 secunde. e-Factura ANAF automat. Plată cu link Stripe.",
      },
    ],
    features: [
      {
        icon: "🎂",
        title: "Comenzi personalizate",
        body: "Formular de comandă cu opțiuni: aromă, design, decorațiuni, evenimente. Upload poză de referință.",
      },
      {
        icon: "📅",
        title: "Programare pickup",
        body: "Clientul alege data și ora de ridicare. Calendarul tău nu se aglomerează niciodată.",
      },
      {
        icon: "💳",
        title: "Avans la comandă",
        body: "Solicită avans cu link Stripe la confirmare comandă. Reduci no-show pentru comenzi mari.",
      },
      {
        icon: "📷",
        title: "Galerie portofoliu",
        body: "Showcase pentru cele mai frumoase torturi. Convinge clienții noi cu lucrarea ta.",
      },
      {
        icon: "🚚",
        title: "Adrese de livrare",
        body: "Pentru evenimente, salvezi adresele clienților. Calculează costul livrării automat.",
      },
      {
        icon: "💬",
        title: "Chat cu clienții",
        body: "Conversații organizate pentru fiecare comandă. Nu mai pierzi mesaje pe Instagram.",
      },
    ],
    testimonialSnippet: {
      who: "Cofetăria Bella — Brașov",
      quote:
        "În 3 luni am crescut cu 70% comenzile pentru evenimente. Site-ul + reminder-ul fac toată diferența.",
    },
    faq: [
      {
        q: "Pot integra cu Glovo sau alte servicii de livrare?",
        a: "Pentru moment exportezi comenzile în Excel pentru Glovo. Integrare directă e în roadmap pentru Q3 2026.",
      },
      {
        q: "Cum funcționează cu comenzile pentru evenimente mari?",
        a: "Creezi un client (firma, salonul de evenimente), emiți factură cu termen de plată, primești notificare la încasare.",
      },
      {
        q: "Pot avea tort + ceai într-o singură comandă?",
        a: "Da. POS-ul integrat permite vânzare la pungă plus comenzi pre-programate. Vânzarea zilnică e separată de comenzile customizate.",
      },
    ],
  },

  florarii: {
    slug: "florarii",
    title: "Site pentru florărie — Comenzi online + livrare | OpenPortal",
    description:
      "Florărie online completă: comenzi cu livrare, abonamente săptămânale, facturare. Pentru florării boutique și aranjamente evenimente. €25/lună.",
    ogTitle: "OpenPortal pentru florării — comenzi online + livrare",
    heroBadge: "💐 Pentru florării și aranjamente evenimente",
    heroTitle: "Florile tale,",
    heroHighlight: "livrate la timp",
    heroSubtitle:
      "Site cu colecție, comenzi online cu programare livrare, abonamente săptămânale, integrare evenimente. Plus reminder pentru clienții fideli.",
    accentHex: "#EC4899",
    painPoints: [
      {
        problem: "Comenzi de ultim moment care îți strică ziua",
        solution: "Site cu disponibilitate clară. Comenzile express vin cu suprataxă vizibilă pe site.",
      },
      {
        problem: "Clienții fideli uită aniversările partenerelor",
        solution: "Setare abonament 'flori la fiecare 2 săptămâni' cu plată recurentă Stripe.",
      },
      {
        problem: "Coordonare livrări cu curier ad-hoc",
        solution: "Programare livrare cu fereastră orară. Adresa și nota sunt clare pentru fiecare comandă.",
      },
      {
        problem: "Evenimente mari (nunți) — facturare complicată",
        solution: "Devize de comandă cu plată în 2 tranșe. e-Factura automat la finalizare.",
      },
    ],
    features: [
      {
        icon: "💐",
        title: "Colecție online cu prețuri",
        body: "Catalog de buchete cu poze, mărimi, prețuri. Clienții văd ce le place și comandă direct.",
      },
      {
        icon: "🚚",
        title: "Programare livrare",
        body: "Clientul alege data și fereastra orară. Tu vezi ruta zilnică pe dashboard.",
      },
      {
        icon: "📅",
        title: "Abonamente săptămânale",
        body: "Flori la birou sau acasă, plată recurentă. Predictibilitate financiară pentru tine.",
      },
      {
        icon: "💍",
        title: "Aranjamente evenimente",
        body: "Forms dedicate pentru nunți, botezuri. Salvezi specificațiile, urmărești statusul.",
      },
      {
        icon: "🌹",
        title: "Reminder zile speciale",
        body: "Clienții pot programa surprize pentru 14 februarie, 8 martie. Tu primești alerta cu o săptămână înainte.",
      },
      {
        icon: "📲",
        title: "Comandă în 30 secunde",
        body: "Optimizat pentru mobil. Mama, soțul, prietenul comandă în drum spre casă.",
      },
    ],
    testimonialSnippet: {
      who: "Florăria Petale — Constanța",
      quote:
        "Abonamentele săptămânale mi-au dublat venitul lunar. Stabilitatea financiară a schimbat business-ul complet.",
    },
    faq: [
      {
        q: "Cum gestionez stocurile de flori și plante?",
        a: "Modul POS include stocuri pentru produse perisabile. Alerte la stoc minim. Z-Report zilnic cu pierderi.",
      },
      {
        q: "Pot trimite SMS la clienți pentru promoții?",
        a: "În roadmap pentru Q2 2026 prin integrare Twilio. Momentan, email-marketing inclus și GDPR-compliant.",
      },
      {
        q: "Funcționează pentru florărie cu showroom + livrare?",
        a: "Da. Ai modulele POS (pentru clienții care vin în showroom) și booking (pentru comenzi online cu livrare). Totul în același cont.",
      },
    ],
  },
};

export function getIndustryLanding(slug: string): IndustryLandingData | undefined {
  return INDUSTRY_LANDINGS[slug];
}

export const INDUSTRY_SLUGS = Object.keys(INDUSTRY_LANDINGS);
