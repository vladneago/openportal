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

  "spa-wellness": {
    slug: "spa-wellness",
    title: "Site pentru SPA & wellness — Programări online + reminder | OpenPortal",
    description:
      "Site pentru centre SPA și wellness cu rezervări online, calendar terapeuți, abonamente clienți. Atmosferă premium, control complet. €25/lună.",
    ogTitle: "OpenPortal pentru SPA — programări online + site premium",
    heroBadge: "🧖 Pentru centre SPA și wellness",
    heroTitle: "Centrul tău SPA,",
    heroHighlight: "într-o oază digitală",
    heroSubtitle:
      "Site cu atmosferă premium, programări online pentru fiecare terapeut, abonamente pentru clienții fideli. Plus reminder care reduce no-show-ul.",
    accentHex: "#7A9F7A",
    painPoints: [
      {
        problem: "Programări complicate cu mai multe încăperi și terapeuți",
        solution: "Sistem inteligent care alocă automat camerele libere și terapeutul potrivit.",
      },
      {
        problem: "Clientele cu abonament uită să rezerve ședințele incluse",
        solution: "Reminder automat + dashboard cu ședințe rămase. Clientele vin mai des.",
      },
      {
        problem: "Pierzi clienți pentru că nu sună niciodată noaptea",
        solution: "Rezervări online 24/7. Vin clienți noi în orele când tu dormi.",
      },
      {
        problem: "Vouchere și cadouri pierdute în notițe pe hârtie",
        solution: "Sistem de vouchere digitale cu cod unic + redemption tracking.",
      },
    ],
    features: [
      {
        icon: "🧖‍♀️",
        title: "Calendar pentru fiecare terapeut",
        body: "Adaugă echipa, fiecare cu specializările și orarele lor. Sistemul nu permite suprapuneri.",
      },
      {
        icon: "🎫",
        title: "Abonamente și pachete",
        body: "Vinde abonamente (4 ședințe/lună) sau pachete (10 masaje). Tracking automat al utilizării.",
      },
      {
        icon: "🎁",
        title: "Vouchere cadou",
        body: "Generează vouchere cu coduri unice. Clienții îți cumpără cadouri de Crăciun sau aniversări.",
      },
      {
        icon: "🌿",
        title: "Site cu look premium",
        body: "Template-uri cu paleta de culori naturale, fotografie atmosferică. Comunici exclusivitate.",
      },
      {
        icon: "📲",
        title: "Reminder + reprogramare",
        body: "Email cu 24h și 2h. Clientul reprograma online — nu mai blochezi terapeutul degeaba.",
      },
      {
        icon: "💼",
        title: "Pachete corporate",
        body: "Onboarding rapid pentru contracte cu firme. Facturare lunară către HR, conform ANAF.",
      },
    ],
    testimonialSnippet: {
      who: "SPA Aurora — Brașov",
      quote:
        "Abonamentele lunare ne-au dat predictibilitate. Știm exact ce încasări avem la începutul lunii.",
    },
    faq: [
      {
        q: "Pot integra cu sistemul de plată al hotelului?",
        a: "Da, exportăm facturile în format compatibil cu majoritatea PMS-urilor (Opera, Mews, Cloudbeds). Integrare directă pentru hoteluri partener.",
      },
      {
        q: "Cum funcționează cu abonamentele nelimitate?",
        a: "Setezi limita per ciclu (ex. 4 ședințe/lună). Sistemul te alertează când clienta atinge limita, ca să negociezi extensie.",
      },
      {
        q: "Pot bloca o cameră pentru evenimente private?",
        a: "Da, prin modulul „blocked slots” excluzi camere sau terapeuți pentru evenimente. Calendarul se reactivează automat după.",
      },
    ],
  },

  fitness: {
    slug: "fitness",
    title: "Site pentru personal trainer / fitness — Programări online | OpenPortal",
    description:
      "Site pentru antrenori personali, săli fitness, studio yoga și pilates. Rezervări ședințe, abonamente lunare, tracking progres. €25/lună.",
    ogTitle: "OpenPortal pentru personal trainers și fitness",
    heroBadge: "💪 Pentru personal trainers și fitness",
    heroTitle: "Antrenamentele tale,",
    heroHighlight: "fără ședințe pierdute",
    heroSubtitle:
      "Clienții rezervă ședințele singuri, primesc reminder, plătesc abonament recurent. Tu te concentrezi pe rezultate, nu pe administrare.",
    accentHex: "#FF5722",
    painPoints: [
      {
        problem: "Clienții uită ședințele și pierzi venit",
        solution: "Reminder automat cu 24h și 2h. No-show-uri reduse cu 50%.",
      },
      {
        problem: "Plata pentru abonamente cu transferuri pe Revolut e haos",
        solution: "Plată recurentă automată Stripe. Banii vin lunar fără să-i ceri.",
      },
      {
        problem: "Programări de grup vs. 1-la-1 amestecate",
        solution: "Sistem separat pentru grupuri și PT. Setezi capacitate per ședință de grup.",
      },
      {
        problem: "Nu ai timp să răspunzi la întrebări de la 10 clienți diferiți",
        solution: "Chat AI care răspunde la întrebări frecvente despre programe, prețuri, locație.",
      },
    ],
    features: [
      {
        icon: "🏋️",
        title: "Sesiuni 1-la-1 și grup",
        body: "Setezi capacitate per ședință. Yoga = 10 oameni, PT = 1. Sistemul închide automat când e plin.",
      },
      {
        icon: "💳",
        title: "Abonamente Stripe",
        body: "8 ședințe/lună, plată recurentă automată. Cancel anytime din dashboard-ul tău.",
      },
      {
        icon: "📊",
        title: "Tracking progres clienți",
        body: "Notele și măsurătorile per client. Vezi exact cum evoluează fiecare.",
      },
      {
        icon: "📱",
        title: "Rezervare pe mobil",
        body: "Clienții rezervă din vestiar înainte să iasă. Optimizat pentru mobile-first.",
      },
      {
        icon: "🎯",
        title: "Programe personalizate",
        body: "Atașează PDF cu planul de antrenament la fiecare client. Update facil din dashboard.",
      },
      {
        icon: "🏆",
        title: "Punctuație și gamification",
        body: "Streak de ședințe consecutive, badges la milestone-uri. Motivează clienții să revină.",
      },
    ],
    testimonialSnippet: {
      who: "Personal Trainer Vlad — Cluj",
      quote:
        "În prima lună am dublat numărul de clienți. Sistemul de abonamente recurente îmi dă stabilitate.",
    },
    faq: [
      {
        q: "Cum gestionez clienții cu abonament care vin neînregistrați?",
        a: "Marchezi prezența manual din calendar. Sesiunea se scade din contul lor. Dacă au sărit limita, nu pot rezerva noi ședințe.",
      },
      {
        q: "Pot organiza challenge-uri (ex. 30 zile fitness)?",
        a: "Da, creezi un program cu durată și ședințe incluse. Clienții se înscriu, văd progresul, primesc badge la final.",
      },
      {
        q: "Cum integrez cu Apple Watch / Garmin?",
        a: "Pentru moment exportezi date manual. Integrare directă cu Apple HealthKit + Garmin Connect e în roadmap pentru Q3 2026.",
      },
    ],
  },

  stomatologi: {
    slug: "stomatologi",
    title: "Site pentru cabinet stomatologic — Programări online + e-Factura | OpenPortal",
    description:
      "Site pentru cabinete stomatologice. Programări online, fișa pacient digitală, plan de tratament cu deviz, e-Factura ANAF. GDPR-compliant. €25/lună.",
    ogTitle: "OpenPortal pentru stomatologi — programări + fișa pacient",
    heroBadge: "🦷 Pentru cabinete stomatologice",
    heroTitle: "Cabinetul tău dentar,",
    heroHighlight: "fără carnețele",
    heroSubtitle:
      "Programări online, fișa pacient digitală, plan de tratament cu deviz transparent, facturare e-Factura. Pacienții vin la timp, fără telefoane.",
    accentHex: "#06B6D4",
    painPoints: [
      {
        problem: "Pacienții lipsesc fără să anunțe",
        solution: "Reminder cu 24h și 2h. Self-cancel online — știi exact cine vine.",
      },
      {
        problem: "Devizele se pierd în Word și nu sunt actualizate",
        solution: "Plan de tratament digital atașat la fișa pacient. Update cu un click.",
      },
      {
        problem: "Acoperirea de la asigurări nu e clară",
        solution: "Câmpuri dedicate în fișa pacient pentru asigurare + procent acoperit. Calcul automat în deviz.",
      },
      {
        problem: "Pacienții cu fobie nu cer informații pentru că le e jenă",
        solution: "Chat AI care răspunde la întrebări sensibile (durere, costuri, etape) fără jenă.",
      },
    ],
    features: [
      {
        icon: "🦷",
        title: "Fișa pacient cu odontogramă",
        body: "Toate dinții pe schemă vizuală. Click pe dinte → istoric tratamente, planuri, vizualizări.",
      },
      {
        icon: "💵",
        title: "Devize transparente",
        body: "Plan de tratament cu fazele, costuri, asigurare. Pacientul aprobă online înainte de începere.",
      },
      {
        icon: "📷",
        title: "Imagini radiologice",
        body: "Atașează RX, panoramice, scanări 3D direct în fișa pacient. Acces criptat, GDPR-compliant.",
      },
      {
        icon: "🔒",
        title: "GDPR + asigurări",
        body: "Consents semnate digital. Export pentru CASMB sau asigurări private în 1 click.",
      },
      {
        icon: "🇷🇴",
        title: "ANAF e-Factura nativ",
        body: "Facturi conforme cu CIUS-RO, trimise automat în SPV. Status acceptat direct în dashboard.",
      },
      {
        icon: "📲",
        title: "Reminder pacienți",
        body: "Email cu 24h și 2h. Pacientul poate reprograma online — nu mai pierzi ore goale în cabinet.",
      },
    ],
    testimonialSnippet: {
      who: "Cabinet Dr. Andrei Popescu — Cluj",
      quote:
        "De când folosim OpenPortal, no-show-urile au scăzut la sub 5%. Programul cabinetului e mult mai eficient.",
    },
    faq: [
      {
        q: "Cum import pacienții existenți din Word/Excel?",
        a: "Oferim import gratuit din CSV. Echipa noastră asistă cu migrarea în primele 14 zile, fără cost suplimentar.",
      },
      {
        q: "Funcționează cu CNAS / CASMB?",
        a: "Datele se exportă în format compatibil cu raportările CASMB. Integrare directă cu CASMB este în roadmap pentru 2026.",
      },
      {
        q: "Pot avea mai mulți medici în același cabinet?",
        a: "Da. Pe planul Solo Pro €50/lună ai utilizatori nelimitați. Fiecare medic vede doar pacienții săi (sau toți, dacă alegi).",
      },
    ],
  },

  fotografie: {
    slug: "fotografie",
    title: "Site pentru fotograf / studio foto — Portofoliu + rezervări | OpenPortal",
    description:
      "Site portofoliu cu galerie spectaculoasă, rezervări sesiuni foto, contracte digitale și plăți online. Pentru fotografi de eveniment și portret. €25/lună.",
    ogTitle: "OpenPortal pentru fotografi — portofoliu + rezervări",
    heroBadge: "📸 Pentru fotografi și studiouri foto",
    heroTitle: "Portofoliul tău,",
    heroHighlight: "convingător din prima",
    heroSubtitle:
      "Site cu galerie premium, rezervare ședință direct de la potențiali clienți, contract digital + avans Stripe. Te concentrezi pe artă, nu pe administrare.",
    accentHex: "#8B5CF6",
    painPoints: [
      {
        problem: "Pierzi 80% din lead-urile de pe Instagram pentru că negocierea durează 3 zile",
        solution: "Site cu prețuri vizibile + rezervare directă cu avans. Lead-uri calificate, nu interogări.",
      },
      {
        problem: "Contractele Word sunt confuze și clienții nu le citesc",
        solution: "Contract digital semnat online. Stocat lângă proiect. Toți știu ce s-a agreat.",
      },
      {
        problem: "Livrarea pozelor durează săptămâni",
        solution: "Galerie privată pentru fiecare proiect. Clientul vede pozele când vrea, descarcă cu cod.",
      },
      {
        problem: "Avansurile cu transferuri pe Revolut sunt o bătaie de cap",
        solution: "Link Stripe pentru avans la confirmare. Vezi imediat dacă a plătit.",
      },
    ],
    features: [
      {
        icon: "🖼️",
        title: "Portofoliu cu galerie",
        body: "Template cu grid masonry, lightbox full-screen, organizat pe categorii. SEO-ready.",
      },
      {
        icon: "📅",
        title: "Rezervare ședință",
        body: "Clientul alege ziua, ora, pachetul. Tu primești notificare cu detalii, plătit avans inclus.",
      },
      {
        icon: "📄",
        title: "Contract digital",
        body: "Template editabil, semnat online cu IP + timestamp. Valid juridic conform legii române.",
      },
      {
        icon: "🔐",
        title: "Galerii private clienți",
        body: "Link unic cu parolă pentru fiecare proiect. Clienții descarcă pozele lor, fără să vadă alte proiecte.",
      },
      {
        icon: "💳",
        title: "Plăți Stripe",
        body: "Avans la rezervare, restul la livrare. Bani direct în contul tău, fără comisioane intermediare.",
      },
      {
        icon: "📦",
        title: "Pachete diversificate",
        body: "Portret, nuntă, eveniment corporate — fiecare cu prețuri, durată, livrabile. Clienții aleg singuri.",
      },
    ],
    testimonialSnippet: {
      who: "Foto Andrei — București",
      quote:
        "Site-ul mă vinde 24/7. Înainte negociam cu 10 clienți și acceptam 2. Acum vin gata convinși și plătesc avans.",
    },
    faq: [
      {
        q: "Pot integra cu Adobe Lightroom sau Pixieset?",
        a: "Galeriile private OpenPortal sunt comparabile cu Pixieset. Pentru moment, importul din Lightroom se face manual.",
      },
      {
        q: "Cum funcționează cu nunțile (avans + restul la eveniment)?",
        a: "Setezi 30% avans la rezervare + 70% factură emisă cu termen plată = ziua nunții. Reminder automat la pacient.",
      },
      {
        q: "Pot avea un blog pe site pentru SEO?",
        a: "Da, site-ul include modul blog cu editor visual. Publicare la programare, SEO meta automat, optimizat Google.",
      },
    ],
  },

  consultanti: {
    slug: "consultanti",
    title: "Site pentru consultanți / avocați / contabili — Programări + facturare | OpenPortal",
    description:
      "Site profesional pentru consultanți, avocați, contabili, asigurări, PFA. Programări 1-la-1, facturare onorarii e-Factura, contracte digitale. €25/lună.",
    ogTitle: "OpenPortal pentru consultanți și PFA",
    heroBadge: "💼 Pentru consultanți, avocați, contabili",
    heroTitle: "Practica ta,",
    heroHighlight: "fără birocrație",
    heroSubtitle:
      "Site curat care comunică expertiză, programări 1-la-1 online, facturare onorarii direct la ANAF. Mai mult timp pentru clienți, mai puțin pentru administrare.",
    accentHex: "#1E40AF",
    painPoints: [
      {
        problem: "Negocierea de fee-uri și plăți te face să pari neserios",
        solution: "Tarif vizibil pe site, link de plată după consultație. Profesional și transparent.",
      },
      {
        problem: "Calendarul tău e amestecat între întâlniri și deep work",
        solution: "Bucket-uri de timp pentru clienți noi, follow-up, deep work. Sistemul respectă boundaries.",
      },
      {
        problem: "Facturarea către firme durează ore — devize, factură, emisie SPV",
        solution: "Factură în 10 secunde, trimisă în SPV automat. Track plăți restante cu aging report.",
      },
      {
        problem: "Clienții cer documente vechi după 2 ani",
        solution: "Tot istoricul digital într-un loc. Search instant pentru facturi, contracte, note.",
      },
    ],
    features: [
      {
        icon: "👔",
        title: "Site care comunică încredere",
        body: "Template-uri minimaliste, profesionale, fără efecte distrage. Focus pe expertiza ta.",
      },
      {
        icon: "🗓️",
        title: "Programări 1-la-1",
        body: "Clienții aleg slot-uri pre-aprobate. Buffer-uri între întâlniri. Tu controlezi când ești disponibil.",
      },
      {
        icon: "🧾",
        title: "Facturare onorarii",
        body: "Template pentru servicii intelectuale. e-Factura ANAF automat. TVA-uri configurabile (0%, 9%, 19%).",
      },
      {
        icon: "📂",
        title: "Dosare clienți",
        body: "Toate informațiile despre fiecare client într-un loc. Note, contracte, facturi, plăți — istoric complet.",
      },
      {
        icon: "📞",
        title: "Apel video integrat",
        body: "Link Zoom/Meet generat automat la rezervare. Pacientul primește invitația prin email.",
      },
      {
        icon: "💵",
        title: "Plăți Stripe + transfer",
        body: "Acceptă plăți online la consultație sau pe factură. Tracking automat al status-ului plății.",
      },
    ],
    testimonialSnippet: {
      who: "Avocat Maria Ionescu — București",
      quote:
        "Înainte petreceam o zi pe săptămână cu facturarea. Acum durează 30 minute. Timpul recâștigat îl folosesc cu clienții.",
    },
    faq: [
      {
        q: "Cum funcționează pentru un avocat care lucrează cu retainer (onorariu lunar)?",
        a: "Setezi factură recurentă automată pentru clienții cu retainer. Sistemul emite + trimite în SPV lunar fără să intervii.",
      },
      {
        q: "Pot atașa contracte semnate la fișa clientului?",
        a: "Da. Upload PDF, semnătură digitală cu certificat calificat (compatibil cu eIDAS), arhivare automată.",
      },
      {
        q: "Există integrare cu CSV-ul de la Saga sau Smartbill?",
        a: "Export complet în format compatibil. Integrare nativă cu Saga e în roadmap pentru Q3 2026.",
      },
    ],
  },

  yoga: {
    slug: "yoga",
    title: "Site pentru studio yoga / pilates — Rezervări online + abonamente | OpenPortal",
    description:
      "Site pentru studiouri yoga, pilates, meditație. Rezervări clase cu capacitate limitată, abonamente recurente, instructori multipli. €25/lună.",
    ogTitle: "OpenPortal pentru studiouri yoga și pilates",
    heroBadge: "🧘 Pentru studiouri yoga, pilates, meditație",
    heroTitle: "Studio-ul tău,",
    heroHighlight: "fără locuri pierdute",
    heroSubtitle:
      "Cursanții rezervă clasele singuri, primesc reminder, plătesc abonament recurent. Capacitate limitată per clasă, niciun chaos la sala plină.",
    accentHex: "#7A9F7A",
    painPoints: [
      {
        problem: "Cursanții vin nerezervați și sala e plină la refuz",
        solution: "Capacitate per clasă (ex. max 12). Sistemul închide rezervările când e plin.",
      },
      {
        problem: "Plățile pe Revolut pentru abonament 8 ședințe/lună sunt o bătaie de cap",
        solution: "Abonament recurent automat Stripe. Banii vin lunar fără reminder de la tine.",
      },
      {
        problem: "Cursanții uită clasele și pierzi venit",
        solution: "Reminder cu 24h și 2h. Self-cancel online, alți cursanți pot prinde locul liber.",
      },
      {
        problem: "Tracking abonamente cu ce ședințe au rămas e haotic",
        solution: "Dashboard per cursant cu ședințe rămase din pachet. Alertă când expiră.",
      },
    ],
    features: [
      {
        icon: "🧘‍♀️",
        title: "Capacitate per clasă",
        body: "Yoga 12 oameni, Pilates Reformer 6, Meditație 20. Sistemul respectă limita pe fiecare clasă în parte.",
      },
      {
        icon: "💳",
        title: "Abonamente Stripe recurente",
        body: "8 ședințe/lună la 250 lei, plată automată în prima zi. Cancel anytime din dashboard.",
      },
      {
        icon: "📅",
        title: "Orar săptămânal vizibil",
        body: "Public pe site cu nume instructor, durată, capacitate disponibilă. Cursanții văd ce-i așteaptă.",
      },
      {
        icon: "🎯",
        title: "Pachete cu expirare",
        body: "10 ședințe valabile 3 luni, sau abonament nelimitat. Tracking automat pe fiecare cursant.",
      },
      {
        icon: "👥",
        title: "Workshop-uri & retreat-uri",
        body: "Evenimente speciale cu avans Stripe, listă invitați, comunicare prin email automat.",
      },
      {
        icon: "🌐",
        title: "Site cu atmosferă",
        body: "Template-uri cu paleta naturală, fotografie atmosferică. Comunici liniștea înainte ca oamenii să intre.",
      },
    ],
    testimonialSnippet: {
      who: "Yoga Studio Zen — Cluj",
      quote:
        "Abonamentele recurente mi-au dat liniștea financiară. Știu exact câți cursanți am, câți bani intră lunar, fără telefoane.",
    },
    faq: [
      {
        q: "Cum gestionez listele de așteptare la clasele pline?",
        a: "Sistemul afișează automat lista de așteptare. Când cineva anulează, primul în waitlist primește email automat cu link de rezervare.",
      },
      {
        q: "Pot oferi clase online + în studio simultan?",
        a: "Da. Setezi clase ca având două variante: în studio (cu locație) și online (cu link Zoom auto-generat). Cursanții aleg formatul.",
      },
      {
        q: "Funcționează cu Wellhub / Multisport / 7Card?",
        a: "Da. Cursanții cu acele carduri se rezervă normal, fără plată. Tu marchezi prezența la sfârșitul lunii pentru raport.",
      },
    ],
  },

  restaurante: {
    slug: "restaurante",
    title: "Site pentru restaurant / bistro — Rezervări mese online | OpenPortal",
    description:
      "Site pentru restaurante și bistrouri cu rezervări mese, meniu online, gestiune mese, comenzi pentru evenimente. e-Factura ANAF. €25/lună.",
    ogTitle: "OpenPortal pentru restaurante și bistrouri",
    heroBadge: "🍽️ Pentru restaurante, bistrouri, fine-dining",
    heroTitle: "Restaurantul tău,",
    heroHighlight: "rezervat la timp",
    heroSubtitle:
      "Site cu meniu, rezervări mese online, evenimente private, facturare conformă ANAF. Nu mai pierzi mese pentru că suni-mă-mai-târziu durează prea mult.",
    accentHex: "#92400E",
    painPoints: [
      {
        problem: "Telefonul sună non-stop pentru rezervări — chelnerii nu mai pot lucra",
        solution: "Rezervări online 24/7. Telefonul se liniștește, oamenii își rezervă singuri.",
      },
      {
        problem: "Mesele rezervate care nu mai vin — pierzi venit de week-end",
        solution: "Reminder cu 24h și 2h + cerere confirmare. No-show-uri reduse cu 60%.",
      },
      {
        problem: "Comenzile pentru evenimente private în Excel se pierd",
        solution: "Dosar dedicat per eveniment cu meniu, invitați, plăți, comunicare. Toate într-un loc.",
      },
      {
        problem: "Facturare către firme cu deviz, restanțe — durează ore",
        solution: "Factură în 10 secunde. e-Factura ANAF automat. Aging report pentru restanțe.",
      },
    ],
    features: [
      {
        icon: "🍷",
        title: "Rezervări mese online",
        body: "Clientul alege ziua, ora, nr. persoane. Sistemul îți spune dacă ai loc, fără ciocniri.",
      },
      {
        icon: "📋",
        title: "Meniu online actualizabil",
        body: "Update prețuri, alergeni, disponibilitate în 30 secunde. Schimbi meniul sezonier instant.",
      },
      {
        icon: "🎉",
        title: "Evenimente private",
        body: "Formular dedicat pentru aniversări, nunți, corporate. Avans Stripe, plan eveniment, comunicare clienți.",
      },
      {
        icon: "🇷🇴",
        title: "ANAF e-Factura nativ",
        body: "Facturi pentru firme cu deduceri TVA + raportare CASMB. Trimis automat în SPV.",
      },
      {
        icon: "🔔",
        title: "Confirmări automate",
        body: "Email la rezervare, reminder cu 24h și 2h. Cancel/reschedule online direct de către client.",
      },
      {
        icon: "📊",
        title: "Rapoarte încasări",
        body: "Z-Report zilnic, top mese, top zile săptămânii, încasări per categorie meniu.",
      },
    ],
    testimonialSnippet: {
      who: "Bistro La Mama — București",
      quote:
        "Vinerea sunt 80 de rezervări. Înainte ne sunau 80 de telefoane. Acum tăcere și sala plină.",
    },
    faq: [
      {
        q: "Cum gestionez mesele cu capacități diferite?",
        a: "Configurezi mese cu numere și capacități individuale (2, 4, 6 persoane). Sistemul atribuie automat masa potrivită fiecărei rezervări.",
      },
      {
        q: "Pot suspenda rezervările pentru zile speciale?",
        a: "Da. Programări → Blocked Slots → blochezi ore sau zile întregi pentru evenimente private sau închidere.",
      },
      {
        q: "Cum cer avans pentru rezervări mari sau evenimente?",
        a: "Setezi avans pentru mese de 8+ sau evenimente. Link Stripe trimis automat, rezervarea se confirmă doar după plată.",
      },
    ],
  },

  avocati: {
    slug: "avocati",
    title: "Site pentru cabinet avocatură — Programări online + facturare | OpenPortal",
    description:
      "Site profesional pentru cabinete avocatură și notariate. Programări consultații online, facturare onorarii ANAF, contracte digitale, dosare clienți. €25/lună.",
    ogTitle: "OpenPortal pentru avocați și notari",
    heroBadge: "⚖️ Pentru cabinete avocatură și notariate",
    heroTitle: "Cabinetul tău juridic,",
    heroHighlight: "fără birocrație internă",
    heroSubtitle:
      "Site sobru care comunică expertiză, programări consultații online, facturare onorarii direct la ANAF, dosare digitale criptate. Time-tracking pe ore facturate.",
    accentHex: "#1E40AF",
    painPoints: [
      {
        problem: "Negocierea de onorarii și plăți te face să pari prețios",
        solution: "Tarif vizibil pe site, link plată după consultație. Profesional și transparent, ca avocații din UK.",
      },
      {
        problem: "Calendarul amestecat între consultații, instanță, deep work",
        solution: "Tipuri de slot dedicate. Buffer-uri între consultații. Sistemul respectă boundaries.",
      },
      {
        problem: "Facturare onorarii cu deviz, retainer, restanțe — birocrație",
        solution: "Factură în 10 secunde, e-Factura ANAF automat. Track plăți + retainer recurent.",
      },
      {
        problem: "Dosarele Word + emailuri sunt o bătaie de cap când vin auditele",
        solution: "Dosar digital per client cu istoric complet. Search instant pentru orice document.",
      },
    ],
    features: [
      {
        icon: "📚",
        title: "Dosare clienți criptate",
        body: "Istoric consultații, contracte, plăți, comunicare. Acces strict bazat pe rol în cabinet.",
      },
      {
        icon: "💼",
        title: "Retainer recurent",
        body: "Client cu retainer 5000 lei/lună? Factură + plată automată în prima zi. Zero intervenție manuală.",
      },
      {
        icon: "📞",
        title: "Apel video integrat",
        body: "Link Zoom/Meet generat automat la rezervare consultație. Pacient primește invitația prin email.",
      },
      {
        icon: "⚖️",
        title: "Specialități per avocat",
        body: "Fiecare avocat din cabinet are propriile specialități + calendar + tarife. Clienții aleg specialistul potrivit.",
      },
      {
        icon: "🇷🇴",
        title: "ANAF e-Factura",
        body: "Onorarii facturate conform legii, trimise automat în SPV. TVA-uri 0/9/19% configurabile.",
      },
      {
        icon: "🔐",
        title: "Contracte digitale",
        body: "Template-uri editabile + semnătură electronică conformă eIDAS. Valid juridic în RO + UE.",
      },
    ],
    testimonialSnippet: {
      who: "Cabinet Av. Maria Ionescu — București",
      quote:
        "Înainte petreceam joi întreaga zi cu facturarea. Acum durează 30 minute. Timpul recâștigat e timp cu clienții.",
    },
    faq: [
      {
        q: "Funcționează pentru cabinet cu 2-3 avocați?",
        a: "Pe planul Solo Pro €50/lună ai utilizatori nelimitați. Fiecare avocat are propriile dosare, calendar, facturi. Permisiuni granulate.",
      },
      {
        q: "Pot importa dosarele existente din Word/Excel?",
        a: "Da. Import gratuit din CSV/Excel pentru contacte clienți + atașamente PDF. Migrarea complete asistată de echipa noastră în 48h.",
      },
      {
        q: "Cum funcționează cu firme care plătesc retainer lunar?",
        a: "Setezi factură recurentă automată pentru retainer. Sistemul emite + trimite în SPV lunar. Track ore facturate vs retainer.",
      },
    ],
  },

  contabili: {
    slug: "contabili",
    title: "Site pentru contabili / experți contabili — Portal clienți | OpenPortal",
    description:
      "Site pentru cabinete contabilitate cu portal clienți, schimb documente, facturare lunară recurentă, integrare ANAF. €25/lună.",
    ogTitle: "OpenPortal pentru contabili și experți contabili",
    heroBadge: "📊 Pentru cabinete contabilitate",
    heroTitle: "Contabilitatea ta,",
    heroHighlight: "fără hârtii pierdute",
    heroSubtitle:
      "Portal clienți pentru upload documente, programări consultații, facturare recurentă automată, integrare directă ANAF pentru declarații. Timp recâștigat pentru muncă reală.",
    accentHex: "#0F766E",
    painPoints: [
      {
        problem: "Clienții îți trimit facturi pe WhatsApp, pe email, pe Drive — chaos",
        solution: "Portal dedicat per client cu upload securizat. Toate documentele într-un loc, organizate.",
      },
      {
        problem: "Facturarea lunară către 20 de clienți durează 2 zile",
        solution: "Factură recurentă automată per client. Lunar emisă + trimisă în SPV + reminder plată.",
      },
      {
        problem: "Întâlnirile pentru explicare bilanț se aglomerează prost",
        solution: "Programări online cu slot-uri pre-aprobate. Clienții aleg ora, tu primești agenda clară.",
      },
      {
        problem: "Termenele ANAF te stresează — uiți date, plătești penalizări",
        solution: "Calendar integrat cu deadline-urile ANAF + reminder pe email. Niciodată mai târziu.",
      },
    ],
    features: [
      {
        icon: "📁",
        title: "Portal clienți",
        body: "Fiecare client are propriul portal cu istoric documente, facturi, declarații. Login dedicat, securitate maximă.",
      },
      {
        icon: "🔁",
        title: "Facturare recurentă",
        body: "Setezi onorariu lunar per client (ex. 500 lei SRL mic). Sistemul emite + trimite în SPV automat.",
      },
      {
        icon: "📅",
        title: "Calendar ANAF",
        body: "Toate deadline-urile (D100, D112, bilanț, etc.) pre-populate. Reminder cu o săptămână înainte.",
      },
      {
        icon: "💰",
        title: "Track restanțe",
        body: "Aging report pentru clienții care întârzie. Reminder automat pe email + suspend la 60 zile.",
      },
      {
        icon: "🤝",
        title: "Onboarding clienți noi",
        body: "Wizard pentru preluare contabilitate: documente necesare, ofertă auto-generată, semnătură online.",
      },
      {
        icon: "📈",
        title: "Rapoarte business",
        body: "Vezi câți clienți activi, MRR, top servicii. Date pentru deciziile tale de business.",
      },
    ],
    testimonialSnippet: {
      who: "Expert Contabil Andrei R. — Brașov",
      quote:
        "Portalul clienți mi-a redus la jumătate timpul pierdut cu căutarea documentelor. Plus, retainer recurent automat — venit predictibil.",
    },
    faq: [
      {
        q: "Funcționează cu Saga, Smartbill sau alte programe contabile?",
        a: "Pentru moment exportăm CSV compatibil cu Saga + Smartbill pentru import. Integrare directă cu Saga este în roadmap pentru Q3 2026.",
      },
      {
        q: "Cum gestionez documentele primite de la clienți?",
        a: "Portal client → secțiunea Documente → upload PDF/imagine. Tu vezi notificare la fiecare upload nou + organizat pe luni.",
      },
      {
        q: "Pot avea ajutoare în cabinet cu acces limitat?",
        a: "Da. Pe planul Solo Pro adaugi utilizatori cu roluri: contabil senior (acces complet), junior (anumite firme), receptionist (doar programări).",
      },
    ],
  },

  psihologi: {
    slug: "psihologi",
    title: "Site pentru psiholog / psihoterapeut — Programări online | OpenPortal",
    description:
      "Site cald pentru psihologi, psihoterapeuți, coaches. Programări online, ședințe video securizate, fișa pacient confidențială. GDPR-compliant. €25/lună.",
    ogTitle: "OpenPortal pentru psihologi și terapeuți",
    heroBadge: "🧠 Pentru psihologi, terapeuți, coaches",
    heroTitle: "Practica ta de terapie,",
    heroHighlight: "fără friction",
    heroSubtitle:
      "Pacienții se programează online cu un click, primesc reminder, ședințe video securizate. Tu te concentrezi pe persoană, nu pe administrare.",
    accentHex: "#7C3AED",
    painPoints: [
      {
        problem: "Pacienții cu anxietate evită să sune pentru programare",
        solution: "Rezervare online complet anonimă până la confirmare. Bariera psihologică dispare.",
      },
      {
        problem: "Apel video pe Zoom personal, link generat manual, parolă uitată",
        solution: "Link video securizat generat automat la rezervare. Pacient primește în email + parolă unică.",
      },
      {
        problem: "Notițele de ședință pe hârtie sau Word — nesigure GDPR",
        solution: "Note ședință în fișa pacient criptată end-to-end. Acces doar tu, log de modificări.",
      },
      {
        problem: "Pacienții care pleacă fără să plătească după ședință",
        solution: "Plată în avans cu Stripe Link sau direct după ședință. Niciodată jenant.",
      },
    ],
    features: [
      {
        icon: "🔐",
        title: "Confidențialitate strictă",
        body: "Fișa pacient criptată end-to-end. Codul deontologic respectat tehnic, nu doar pe hârtie.",
      },
      {
        icon: "💻",
        title: "Sesiuni video securizate",
        body: "Link generat automat la rezervare, valabil doar pentru ședința aceea. Compatibil cu Jitsi, Zoom, Meet.",
      },
      {
        icon: "📝",
        title: "Note de ședință",
        body: "Câmpuri structurate per ședință: stare, teme abordate, obiective, plan. Tracking longitudinal al evoluției.",
      },
      {
        icon: "🌿",
        title: "Site cu atmosferă caldă",
        body: "Template cald, fără efecte distrage. Bariera primului contact e cât mai joasă.",
      },
      {
        icon: "💳",
        title: "Plăți la ședință",
        body: "Stripe Link în email la confirmare. Plata se face înainte, te concentrezi pe ședință.",
      },
      {
        icon: "📅",
        title: "Programări periodice",
        body: "Pacient cu ședințe săptămânale? Auto-rezervă slot-ul aceleași zile timp de 8 săptămâni.",
      },
    ],
    testimonialSnippet: {
      who: "Psihoterapeut Cristina T. — București",
      quote:
        "Rezervările online au crescut cu 70% după ce am pus link-ul pe Instagram. Bariera contactului telefonic dispărea.",
    },
    faq: [
      {
        q: "Funcționează cu Casa Sănătate sau alte asigurări?",
        a: "Da. În fișa pacient salvezi datele asigurării. Facturile generate sunt conforme cu cerințele CASMB și asigurărilor private.",
      },
      {
        q: "Cum protejez confidențialitatea pacienților online?",
        a: "Datele sunt criptate end-to-end în UE. Notițele tale nu sunt accesibile nimănui în afară de tine. Audit log complet, conform Colegiului Psihologilor.",
      },
      {
        q: "Pot oferi ședințe pentru grupuri (terapie de grup)?",
        a: "Da. Configurezi capacitate per ședință (ex. 8 persoane). Sistemul închide rezervările când e plin. Confidențialitate respectată în UI.",
      },
    ],
  },

  veterinari: {
    slug: "veterinari",
    title: "Site pentru cabinet veterinar / pet shop — Programări online | OpenPortal",
    description:
      "Site pentru cabinete veterinare și pet shops. Programări consultații online, fișa medicală animal, vaccinare cu evidență, reminder anual. €25/lună.",
    ogTitle: "OpenPortal pentru veterinari și pet shops",
    heroBadge: "🐶 Pentru cabinete veterinare și pet shops",
    heroTitle: "Cabinetul tău veterinar,",
    heroHighlight: "lângă fiecare pet din lista ta",
    heroSubtitle:
      "Programări online pentru consultații + vaccinare, fișa medicală digitală per animal, reminder automat anual + grooming. Părinții pet-urilor te iubesc pentru profesionalism.",
    accentHex: "#0EA5E9",
    painPoints: [
      {
        problem: "Părinții pet-urilor uită vaccinurile anuale și animăluțul rămâne neprotejat",
        solution: "Reminder automat cu o lună înainte de expirare. Email + reminder text cu data programării sugerată.",
      },
      {
        problem: "Fișa medicală pe hârtie se pierde sau e indescifrabilă",
        solution: "Fișă digitală per animal cu istoric vaccinări, tratamente, alergii, intervenții. Lizibilă pentru orice medic.",
      },
      {
        problem: "Programări telefonice pentru urgențe ratează apelurile importante",
        solution: "Slot-uri dedicate pentru urgențe, restul prin programare online. Telefonul tace pentru programări de rutină.",
      },
      {
        problem: "Comunicarea cu clienții pentru rezultate analize durează zile",
        solution: "Notificare automată la rezultat analize + atașament în fișa pet-ului. Toți informați la timp.",
      },
    ],
    features: [
      {
        icon: "🐾",
        title: "Fișa medicală per animal",
        body: "Istoric complet: vaccinări, intervenții, alergii, medicamente curente. Acces criptat, share cu alți medici la nevoie.",
      },
      {
        icon: "💉",
        title: "Reminder vaccinare automat",
        body: "Calculează data scadență per vaccin, trimite email cu 30 zile înainte + opțiune programare directă.",
      },
      {
        icon: "🩺",
        title: "Multi-medic + multi-specializare",
        body: "Câini, pisici, exotice, mari animale. Fiecare medic cu propriul calendar și specializare.",
      },
      {
        icon: "🆔",
        title: "Microcip + pașaport",
        body: "Evidență microcip + emitere pașaport pentru călătorii în UE conform reglementărilor.",
      },
      {
        icon: "💬",
        title: "Comunicare cu părintele",
        body: "Rezultate analize, instrucțiuni post-intervenție, fotografii control — toate în portalul clientului.",
      },
      {
        icon: "🛒",
        title: "Vânzare produse",
        body: "Hrană, accesorii, medicamente OTC — POS integrat. Stoc + bon fiscal conform legii.",
      },
    ],
    testimonialSnippet: {
      who: "Cabinet Veterinar Dr. Andra — Iași",
      quote:
        "Reminder-urile pentru vaccinări au crescut prezența anuală cu 60%. Părinții pet-urilor sunt recunoscători că nu mai uită.",
    },
    faq: [
      {
        q: "Funcționează cu carnet de identificare ANSVSA?",
        a: "Da. Fișa pet-ului include câmpuri pentru număr microcip + carnet ANSVSA. Export în formatul cerut pentru raportări oficiale.",
      },
      {
        q: "Pot oferi servicii de grooming + cabinet medical în același cont?",
        a: "Da. Configurezi două tipuri de servicii (medicale și grooming) cu calendare separate sau combinate, după preferință.",
      },
      {
        q: "Cum gestionez urgențele în afara programului?",
        a: "Setezi telefon de urgență vizibil pe site + linie dedicată în orele non-program. Programări de rutină rămân doar online.",
      },
    ],
  },

  "atelier-auto": {
    slug: "atelier-auto",
    title: "Site pentru atelier auto / service mecanic — Programări online | OpenPortal",
    description:
      "Site pentru ateliere auto, service mecanic, vulcanizări. Programări revizii + ITP, deviz transparent, istoric mașină per client. €25/lună.",
    ogTitle: "OpenPortal pentru ateliere auto și service",
    heroBadge: "🚗 Pentru ateliere auto și service",
    heroTitle: "Atelierul tău auto,",
    heroHighlight: "cu deviz clar și fără surprize",
    heroSubtitle:
      "Site cu rezervări online pentru revizii + ITP, deviz transparent înainte de începere, istoric mașină per client. Clienții vin pentru profesionalism, rămân pentru încredere.",
    accentHex: "#475569",
    painPoints: [
      {
        problem: "Clienții te sună să întrebe de preț — pierzi 30 min/apel",
        solution: "Prețuri orientative vizibile pe site + deviz exact după diagnoză. Apelurile se reduc cu 80%.",
      },
      {
        problem: "Mașinile aduse fără programare aglomerează atelierul",
        solution: "Programări online cu slot-uri planificate. Clienții vin la timpul lor, atelierul lucrează ordonat.",
      },
      {
        problem: "Devizele Word + facturi separate sunt birocrație inutilă",
        solution: "Deviz → factură cu un click, e-Factura ANAF automat. Plată Stripe sau cash la ridicare.",
      },
      {
        problem: "Istoricul mașinilor în carnețele care se pierd",
        solution: "Istoric digital per mașină (după număr înmatriculare): intervenții, kilometraj, piese schimbate.",
      },
    ],
    features: [
      {
        icon: "🔧",
        title: "Programări tipuri lucrări",
        body: "Revizie, ITP, schimb ulei, diagnoză — fiecare cu timp estimativ. Atelierul se umple inteligent.",
      },
      {
        icon: "💵",
        title: "Deviz transparent",
        body: "Listă piese + manoperă + total, semnat digital de client înainte de începere. Zero dispute.",
      },
      {
        icon: "📋",
        title: "Istoric per mașină",
        body: "Toate intervențiile pe acea mașină, kilometraj la fiecare vizită, recomandări viitoare.",
      },
      {
        icon: "🛡️",
        title: "Garanție lucrări",
        body: "Tracking automat al garanției per intervenție (12 luni / 20.000 km). Clienții știu exact când expiră.",
      },
      {
        icon: "📷",
        title: "Foto înainte/după",
        body: "Atașează poze la deviz pentru evidență. Reduce disputele despre starea inițială a mașinii.",
      },
      {
        icon: "🇷🇴",
        title: "ANAF e-Factura",
        body: "Facturi pentru firme cu deduceri TVA + bonuri fiscale pentru persoane fizice. Conform legii.",
      },
    ],
    testimonialSnippet: {
      who: "Auto Service Pro — Cluj",
      quote:
        "Devizele transparente au eliminat 100% din certurile cu clienții. Toți știu de la început ce vor plăti și ce vor primi.",
    },
    faq: [
      {
        q: "Pot scana plăcuța mașinii și pre-completa fișa?",
        a: "În roadmap pentru Q3 2026 prin integrare OCR. Pentru moment introduci manual numărul + marca. Sistemul caută istoricul.",
      },
      {
        q: "Cum gestionez piesele comandate și sosirea lor?",
        a: "Adaugi piesa la deviz cu status «comandată». Sistemul te notifică să programezi continuarea când piesa ajunge.",
      },
      {
        q: "Funcționează pentru atelier cu 5 mecanici?",
        a: "Pe planul Solo Pro €50/lună ai resurse nelimitate. Fiecare mecanic are propriul calendar și specializare (motor, electronică, tinichigerie, etc.).",
      },
    ],
  },

  hoteluri: {
    slug: "hoteluri",
    title: "Site pentru hotel mic / pensiune / B&B — Rezervări directe | OpenPortal",
    description:
      "Site pentru pensiuni, hoteluri boutique, B&B-uri. Rezervări directe fără comisioane Booking, gestiune camere, plăți online. €25/lună.",
    ogTitle: "OpenPortal pentru hoteluri mici și pensiuni",
    heroBadge: "🏨 Pentru pensiuni, hoteluri mici, B&B",
    heroTitle: "Pensiunea ta,",
    heroHighlight: "fără 15% comision Booking",
    heroSubtitle:
      "Site cu galerie camere, rezervări directe cu plată online, gestiune disponibilitate, integrare canal Booking opțional. Recâștigi marja pe care o pierdeai la OTA-uri.",
    accentHex: "#7A9F7A",
    painPoints: [
      {
        problem: "15-20% comision la Booking + Airbnb pentru fiecare rezervare",
        solution: "Site propriu cu rezervări directe. 0% comision pe rezervările prin site-ul tău.",
      },
      {
        problem: "Disponibilitate de update-at pe 3 platforme separat — chaos",
        solution: "Channel manager: blochezi camera o singură dată, se sincronizează automat pe Booking + Airbnb + site.",
      },
      {
        problem: "Comunicare cu clienții se face pe WhatsApp și se pierd mesaje",
        solution: "Inbox unificat per rezervare: WhatsApp + email + chat site, totul lângă rezervarea respectivă.",
      },
      {
        problem: "Plăți pe transfer durează zile și clienții uită",
        solution: "Link Stripe pentru avans la rezervare, restul la check-in. Plăți instant, fără follow-up manual.",
      },
    ],
    features: [
      {
        icon: "🛏️",
        title: "Catalog camere cu galerie",
        body: "Fiecare cameră cu poze, descriere, dotări, preț per sezon. Vedere ca-n revistele de turism.",
      },
      {
        icon: "📅",
        title: "Calendar disponibilitate",
        body: "Vizibil pe site. Clienții văd când e liber, nu sună să întrebe.",
      },
      {
        icon: "💳",
        title: "Plăți Stripe directe",
        body: "Avans 30% la rezervare, restul la check-in. Cancel-window-uri configurabile per cameră.",
      },
      {
        icon: "📋",
        title: "Lista oaspeților",
        body: "Detalii contact, preferințe, alergii, ocazii speciale. Personalizare la nivel de Ritz-Carlton.",
      },
      {
        icon: "🔄",
        title: "Channel manager",
        body: "Sincronizare Booking + Airbnb + Vrbo. Niciun overbooking, niciun dublu update.",
      },
      {
        icon: "🌟",
        title: "Review-uri colectate auto",
        body: "Email automat la check-out cu rugămintea de review. Direct pe site + redirect Google.",
      },
    ],
    testimonialSnippet: {
      who: "Pensiunea Munților — Bran",
      quote:
        "Rezervările directe prin site reprezintă acum 60% din total. Am recuperat marja de 18% comision la Booking. Bani serioși.",
    },
    faq: [
      {
        q: "Cum funcționează channel manager-ul cu Booking?",
        a: "Conectezi conturile o singură dată. Când blochezi o cameră în OpenPortal, se blochează automat pe Booking în max 2 minute. Și invers.",
      },
      {
        q: "Pot oferi tarife dinamice (weekend mai scump, low-season redus)?",
        a: "Da. Setezi tarife per zi a săptămânii, sezon, durată sejur (3+ nopți reducere). Sistemul calculează automat.",
      },
      {
        q: "Există integrare cu casa de marcat / PMS?",
        a: "Export complet în format compatibil PMS-uri populare (Opera, Mews, Cloudbeds). Integrare directă cu Mews în roadmap.",
      },
    ],
  },

  cursuri: {
    slug: "cursuri",
    title: "Site pentru cursuri / training / școală meserii — Înscriere online | OpenPortal",
    description:
      "Site pentru traineri, școli de meserii, cursuri online. Înscriere cu plată, capacitate per grupă, materiale curs, comunitate alumni. €25/lună.",
    ogTitle: "OpenPortal pentru cursuri și training",
    heroBadge: "🎓 Pentru cursuri, training, școli de meserii",
    heroTitle: "Școala ta,",
    heroHighlight: "fără Google Forms și plăți manuale",
    heroSubtitle:
      "Site cu catalog cursuri, înscriere online cu plată automată Stripe, capacitate per grupă, materiale și certificat. Construiești o comunitate alumni, nu doar predai.",
    accentHex: "#7C3AED",
    painPoints: [
      {
        problem: "Google Forms + transfer bancar = înscrieri pierdute",
        solution: "Pagina curs cu CTA «Înscrie-te + plătește» direct. Conversie de 3x mai mare.",
      },
      {
        problem: "Tracking cine a plătit și cine nu durează ore",
        solution: "Toți cu plată reușită apar în lista cursanților confirmați automat. Restul se șterg după 24h.",
      },
      {
        problem: "Materialele curs trimise pe email se pierd, repeti aceleași emailuri",
        solution: "Portal cursant cu toate materialele + lecții + certificate. Acces după curs cât vrei.",
      },
      {
        problem: "După curs cursanții dispar, nu poți face up-sell la cursuri avansate",
        solution: "Alumni list cu segmentare. Lansezi curs avansat, primii notificați sunt absolvenții.",
      },
    ],
    features: [
      {
        icon: "📚",
        title: "Catalog cursuri",
        body: "Fiecare curs cu programă, durată, preț, prerequisite, certificat. Pagină dedicată cu testimoniale.",
      },
      {
        icon: "👥",
        title: "Capacitate per grupă",
        body: "Maxim 15 cursanți per modul? Sistemul închide înscrierile automat când e plin.",
      },
      {
        icon: "💳",
        title: "Plată Stripe + plată în rate",
        body: "Curs 2500 lei cash sau 3x839 lei. Stripe Installments configurabil per curs.",
      },
      {
        icon: "📂",
        title: "Portal cursant",
        body: "Materiale, înregistrări lecții, teme, certificat la finalizare. Acces lifetime sau limitat.",
      },
      {
        icon: "🏆",
        title: "Certificate digitale",
        body: "Certificat PDF generat automat cu numele cursantului + cod verificare unic. Verificabil online.",
      },
      {
        icon: "💬",
        title: "Comunitate alumni",
        body: "Forum privat sau grupul cursanților fiecărui curs. Networking + suport peer-to-peer.",
      },
    ],
    testimonialSnippet: {
      who: "Andrei T. — Trainer Marketing Digital",
      quote:
        "Conversia s-a triplat după ce am pus checkout-ul direct pe site. Plus, alumni list mi-a permis să lansez cursul avansat cu 80% pre-comanda din list.",
    },
    faq: [
      {
        q: "Pot organiza cursuri online + on-site simultan?",
        a: "Da. Setezi două variante per curs: online (link Zoom auto-generat) și on-site (locație + capacitate fizică). Cursanții aleg formatul.",
      },
      {
        q: "Cum gestionez cursuri recurente (ex. luna 1, luna 2, etc.)?",
        a: "Creezi un program cu sesiuni multiple. Cursantul se înscrie o singură dată, primește acces la toate sesiunile din program.",
      },
      {
        q: "Funcționează cu cursuri acreditate ANC?",
        a: "Da. Câmpuri dedicate pentru cod ocupație + raportare ANC. Exportul lunar e conform cerințelor.",
      },
    ],
  },

  tatuaje: {
    slug: "tatuaje",
    title: "Site pentru studio tatuaj / piercing — Programări + portofoliu | OpenPortal",
    description:
      "Site bold pentru studiouri tatuaj și piercing. Portofoliu artiști, consultații gratuite, avans rezervare, instrucțiuni aftercare. €25/lună.",
    ogTitle: "OpenPortal pentru studiouri tatuaj și piercing",
    heroBadge: "✒️ Pentru studiouri tatuaj și piercing",
    heroTitle: "Studio-ul tău de body art,",
    heroHighlight: "cu portofoliu care convinge",
    heroSubtitle:
      "Site cu galerie spectaculoasă per artist, programări consultații + avans Stripe, instrucțiuni aftercare automate. Clienții vin gata convinși, plătesc avans, vin la timp.",
    accentHex: "#0F172A",
    painPoints: [
      {
        problem: "Negociere pe Instagram DM durează 3 zile pentru o consultație de 30 min",
        solution: "Site cu prețuri orientative + buton rezervare consultație gratuită. Cure-i ce au bani vin direct.",
      },
      {
        problem: "Clienții nu vin la programare, pierzi ședințe de 3-5 ore",
        solution: "Avans Stripe la rezervare (200-500 lei). No-show = îți rămâne avansul. Reduce dispariții cu 90%.",
      },
      {
        problem: "Aftercare instructions trimise pe WhatsApp și clienții uită",
        solution: "Email automat la 1h, 24h, 7 zile, 30 zile cu instrucțiuni pas-cu-pas + fotografii ce e normal.",
      },
      {
        problem: "Portofoliu pe Instagram cu hashtag random nu convinge clienții serioși",
        solution: "Galerie pe site organizată pe stil (realism, dotwork, traditional). Clienții văd ce vor.",
      },
    ],
    features: [
      {
        icon: "🎨",
        title: "Portofoliu per artist",
        body: "Fiecare artist cu galerie proprie, organizată pe stil. Clienții aleg artistul după estetică.",
      },
      {
        icon: "💳",
        title: "Avans la rezervare",
        body: "Stripe Link pentru avans 200-500 lei la consultație + restul la ședință. Fără no-show.",
      },
      {
        icon: "📋",
        title: "Acord informat digital",
        body: "Formular obligatoriu pre-tatuaj (alergii, medicamente, condiții) semnat digital, salvat pe fișa client.",
      },
      {
        icon: "📲",
        title: "Aftercare automatizat",
        body: "Email-uri programate la 1h, 24h, 7 zile, 30 zile cu instrucțiuni + ce e normal vs ce e îngrijorător.",
      },
      {
        icon: "📅",
        title: "Multi-ședință pentru tatuaje mari",
        body: "Tatuaj 20+ ore? Programezi 4-5 ședințe consecutive, le legi în același proiect.",
      },
      {
        icon: "🌟",
        title: "Galerie social proof",
        body: "Clienții uploadează poze finale cu drepturi de utilizare. Construiești portofoliu organic.",
      },
    ],
    testimonialSnippet: {
      who: "Studio Black Ink — București",
      quote:
        "Avansul Stripe a redus no-show-urile la zero. Plus, portofoliul curat pe site ne aduce clienți cu așteptări realiste, nu vânători de prețuri.",
    },
    faq: [
      {
        q: "Cum gestionez tatuaje mari care necesită multe ședințe?",
        a: "Creezi un proiect cu ședințe multiple. Plata e per ședință sau forfait pentru întregul proiect. Tracking timp total per proiect.",
      },
      {
        q: "Pot oferi consultații video pentru clienți din alte orașe?",
        a: "Da. Setezi consultații online cu link Zoom auto-generat. Util pentru clienți care vor să se programeze din alt oraș/țară.",
      },
      {
        q: "Funcționează cu acord informat pentru minori (16-18 ani)?",
        a: "Da. Formular cu câmp dedicat pentru tutorele legal, semnătură electronică ambii, conform legii române (piercing 16+, tatuaj 18+).",
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
