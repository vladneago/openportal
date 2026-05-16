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
