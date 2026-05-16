import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";

export const metadata: Metadata = {
  title: "Centru de ajutor — Documentație și ghiduri OpenPortal",
  description:
    "Răspunsuri la întrebări frecvente despre site builder, programări online, facturare e-Factura, POS și chat AI. Tutorial-uri pas-cu-pas în limba română.",
  alternates: { canonical: "/ajutor" },
};

const COLORS = {
  primary: "#6366F1",
  primaryDark: "#4338CA",
  text: "#0F172A",
  textMuted: "#475569",
  textSubtle: "#94A3B8",
  bg: "#FFFFFF",
  bgAlt: "#F8FAFC",
  border: "#E2E8F0",
  accent: "#10B981",
};

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: 500,
} as const;

interface HelpArticle {
  q: string;
  a: string;
}

interface HelpCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

const CATEGORIES: HelpCategory[] = [
  {
    id: "primii-pasi",
    icon: "🚀",
    title: "Primii pași",
    description: "Setare cont, onboarding, primul tău site",
    articles: [
      {
        q: "Cum îmi creez contul?",
        a: "Mergi pe /register, introduci email + parolă, primești email de confirmare. După confirmare ești redirecționat spre wizard-ul de onboarding (6 pași) care îți pre-configurează site + programări + facturare în 2 minute.",
      },
      {
        q: "Wizard-ul de onboarding e obligatoriu?",
        a: "Nu. Există un buton de Skip în colțul de sus al wizard-ului. Configurezi singur ce vrei, când vrei. Wizard-ul doar accelerează start-ul.",
      },
      {
        q: "Pot schimba industria după onboarding?",
        a: "Da. Industria selectată e doar pentru pre-configurare. După aceea poți edita orice serviciu, oră, template fără restricții.",
      },
      {
        q: "Unde văd toate funcționalitățile disponibile?",
        a: "În sidebar-ul stâng al dashboard-ului ai toate modulele: Site Builder, Programări, Clienți, Facturi, POS, Chat Widget. Click pe oricare pentru a începe.",
      },
      {
        q: "Cum aduc datele din vechiul sistem (Booksy, Excel, Wix)?",
        a: "Trimite-ne un email pe migrare@openportal.app cu export-ul tău (CSV, Excel, sau acces invitat la sistemul vechi). Migrăm gratuit în 48h.",
      },
    ],
  },
  {
    id: "site-builder",
    icon: "🌐",
    title: "Site builder",
    description: "Creare site, template-uri, publicare, domeniu propriu",
    articles: [
      {
        q: "Cum creez un site nou?",
        a: "Site Builder → buton Site nou → alegi un template din 40+ disponibile (pe industria ta) + temă de culori. Site-ul se generează cu toate paginile pre-completate.",
      },
      {
        q: "Cum editez o pagină?",
        a: "Click pe pagina respectivă → editor split: stânga lista de blocuri (Hero, Servicii, Galerie, Contact, etc.), dreapta formularul pentru blocul selectat. Modificările se salvează automat la Save Draft.",
      },
      {
        q: "Cum public site-ul?",
        a: "Buton Publică sus în pagina detail site. Site-ul devine vizibil instant la subdomeniul tău (ex. saloanima.openportal.app).",
      },
      {
        q: "Pot conecta un domeniu propriu (ex. saloanima.ro)?",
        a: "Da, pe planul Solo Pro. În Site Builder → Setări → Custom Domain → introduci domeniul + adaugi 2 înregistrări DNS (CNAME). Verificarea durează câteva minute.",
      },
      {
        q: "Cum adaug imagini în galerie?",
        a: "În editor, blocul Hero sau TextImage are câmp Image cu upload direct. Imaginile sunt redimensionate automat pentru performanță web.",
      },
      {
        q: "Site-ul e mobile-friendly?",
        a: "Da. Toate template-urile sunt responsive nativ — testate pe iPhone, Android, desktop, tabletă.",
      },
    ],
  },
  {
    id: "programari",
    icon: "📅",
    title: "Programări",
    description: "Configurare servicii, calendar, widget de rezervări",
    articles: [
      {
        q: "Cum adaug un serviciu nou?",
        a: "Programări → Servicii → buton Adaugă. Setezi nume, durată, preț, culoare, resursele eligibile. Serviciul apare automat pe site la /book/<siteId>.",
      },
      {
        q: "Cum adaug un coleg / staff?",
        a: "Programări → Resurse → buton Adaugă resursă. Tip = staff, opțional culoare în calendar. Apoi setezi orar săptămânal la Programări → Disponibilitate.",
      },
      {
        q: "Cum configurez orarul săptămânal?",
        a: "Programări → Disponibilitate → alegi resursa → editor grid 7 zile cu interval-uri (poți avea 9-13 și 14-18 cu pauză la prânz). Preset rapid Luni-Vineri 9-17.",
      },
      {
        q: "Cum trimit link-ul de rezervări către clienți?",
        a: "URL-ul e openportal.app/book/<siteId-ul-tau>. Îl pui în bio Instagram, pe Google Business Profile, în signature email. Sau folosește widget-ul embed pentru orice site extern.",
      },
      {
        q: "Cum funcționează reminder-ele?",
        a: "Automat: 24h și 2h înainte de programare. Clientul primește email cu posibilitate de cancel/reschedule online. Funcționează doar dacă clientul a dat consent email la rezervare.",
      },
      {
        q: "Pot bloca ore (concediu, pauză)?",
        a: "Da. Programări → Blocked Slots → adaugi un interval. Sistemul nu permite rezervări în acel timp.",
      },
      {
        q: "Cum schimb statusul unei programări?",
        a: "Click pe programare în calendar → modal cu acțiuni: Confirmă / Check-in / În progres / Finalizează / Anulează / No-show. State machine respectă ordinea logică.",
      },
    ],
  },
  {
    id: "facturare",
    icon: "🧾",
    title: "Facturare & e-Factura",
    description: "Emitere facturi, ANAF SPV, plăți, recurring",
    articles: [
      {
        q: "Cum emit o factură?",
        a: "Facturi → buton Factură nouă → selectezi client (sau adaugi unul nou) → adaugi linii (descriere, cantitate, preț, TVA). Total se calculează live. Click Emite → factura e numerotată conform seriei tale și marcată ca issued.",
      },
      {
        q: "Cum configurez seria de facturare?",
        a: "Facturi → Serii → adaugi serie cu prefix (ex. FCT) + număr de pornire. Setezi una ca implicită. Următoarea factură ia automat următorul număr.",
      },
      {
        q: "Cum trimit facturi la ANAF e-Factura?",
        a: "După emitere, click Trimite la ANAF în pagina facturii. Sistemul generează XML UBL 2.1 CIUS-RO și trimite în SPV. Vezi statusul (acceptat/respins) în câteva minute.",
      },
      {
        q: "Cum înregistrez o plată?",
        a: "Pe pagina facturii → buton Adaugă plată → metodă (cash/card/transfer) + sumă + dată. Statusul facturii se actualizează automat la partial-paid sau paid.",
      },
      {
        q: "Pot trimite link de plată Stripe pe factură?",
        a: "Da, dacă ai conectat contul Stripe. La emitere se generează un Stripe Payment Link care apare în email-ul automat trimis clientului.",
      },
      {
        q: "Există rapoarte de încasări?",
        a: "Da. Dashboard → KPI Încasări-azi. Pentru detalii: Facturi → filter status paid + interval. Export CSV oricând.",
      },
    ],
  },
  {
    id: "pos",
    icon: "🛒",
    title: "POS & stoc",
    description: "Casa de marcat digitală, produse, Z-Report",
    articles: [
      {
        q: "Cum adaug produse în catalog?",
        a: "POS → Produse → Adaugă produs. Setezi nume, SKU, preț, TVA, stoc inițial, categorie. Suportă barcode pentru scanare.",
      },
      {
        q: "Cum fac o vânzare la terminal?",
        a: "POS → grid produse → click pe produs ca să-l adaugi în coș. Sau scanezi barcode. Coșul în partea dreaptă cu total + TVA. Plata: cash/card/transfer/voucher.",
      },
      {
        q: "Ce e Z-Report-ul?",
        a: "Raport zilnic conform legii române. POS → Rapoarte → Z-Report Azi. Include: total vânzări brut, TVA pe cote, defalcare pe metode plată, refunduri.",
      },
      {
        q: "Cum gestionez stocurile?",
        a: "Stocul se scade automat la fiecare vânzare. POS → Produse → filter Low-stock pentru produse aproape epuizate. Pentru intrare marfă: POS → Stock Movements → tip purchase.",
      },
      {
        q: "Pot face refund?",
        a: "Da. POS → Tranzacții → găsești tranzacția → buton Refund (parțial sau total). Opțional restorezi stocul.",
      },
    ],
  },
  {
    id: "chat-ai",
    icon: "💬",
    title: "Chat AI cu Claude",
    description: "Configurare widget, knowledge base, takeover",
    articles: [
      {
        q: "Cum activez chat-ul AI pe site?",
        a: "Chat Widget → Widget nou → alegi site asociat + culori + greeting. Copiezi snippet-ul embed și-l pui pe site. Funcționează imediat.",
      },
      {
        q: "Pe ce model AI rulează?",
        a: "Claude Haiku 4.5 by default (rapid + ieftin). Pentru cazuri complexe poți schimba pe Claude Sonnet sau Opus din setări widget.",
      },
      {
        q: "Cum antrenez AI-ul pe business-ul meu?",
        a: "Chat Widget → Knowledge → adaugi surse: FAQ (Q/A format), descrieri servicii, politici, ore, locație. AI-ul folosește acest context la fiecare răspuns.",
      },
      {
        q: "Pot interveni manual în conversații?",
        a: "Da. Chat Widget → Conversații → click pe conversație → Trimite-ca-agent. Status flip pe human_handling și AI-ul se oprește pentru acea conversație.",
      },
      {
        q: "Cât costă chat-ul AI?",
        a: "Inclus în plan: 500 mesaje/lună pe Solo, 5000 pe Solo Pro. Peste limită: €0.005/mesaj (cost real Claude + marjă mică).",
      },
    ],
  },
  {
    id: "cont-facturare",
    icon: "💳",
    title: "Cont & abonament",
    description: "Plan, trial, plată, anulare, ștergere cont",
    articles: [
      {
        q: "Cum schimb planul (Solo → Solo Pro)?",
        a: "Setări → Abonament → click Upgrade la Solo Pro. Plata se face proporțional cu ce a rămas din ciclul curent.",
      },
      {
        q: "Cum anulez abonamentul?",
        a: "Setări → Abonament → Anulează. Contul rămâne activ până la finalul perioadei plătite. Datele tale se păstrează 60 zile în mod read-only după.",
      },
      {
        q: "Cum descarc datele mele?",
        a: "Setări → Date & GDPR → Export complet. Generează un ZIP cu CSV-uri pentru clienți, programări, facturi, plăți, conținut site. Trimis pe email în 10 minute.",
      },
      {
        q: "Cum șterg contul definitiv?",
        a: "Setări → Date & GDPR → Șterge contul. Confirmare în 2 pași. Ștergem toate datele în 7 zile (conform GDPR). Recomandăm export înainte.",
      },
      {
        q: "Pot vedea facturile mele de la OpenPortal?",
        a: "Da. Setări → Abonament → Facturi → toate emise în ultimele 24 luni. Descarci PDF sau retrimit pe email.",
      },
    ],
  },
  {
    id: "gdpr-securitate",
    icon: "🔒",
    title: "GDPR & securitate",
    description: "Consents, criptare, audit, DPA",
    articles: [
      {
        q: "Datele mele sunt stocate în UE?",
        a: "Da, exclusiv în centre de date din UE (Germania + Olanda). Replicare cross-region tot în UE pentru disaster recovery.",
      },
      {
        q: "Pot obține un DPA semnat?",
        a: "Da. Setări → Date & GDPR → Solicită DPA semnat — primești PDF semnat electronic în 24h pentru firma ta (cu CUI inclus).",
      },
      {
        q: "Cum gestionează clienții mei consimțământul?",
        a: "Fiecare formular de rezervare include checkboxuri pentru consent email/SMS/marketing. Stocate per client cu timestamp. Poți filtra clienții care au consent activ.",
      },
      {
        q: "Ce se întâmplă dacă un client îmi cere ștergerea datelor?",
        a: "Clienți → găsești clientul → buton Șterge-GDPR → ștergi datele personale (nume, telefon, email) păstrând doar referințele anonimizate pentru continuitatea contabilă a facturilor.",
      },
      {
        q: "Există log de acces?",
        a: "Da. Pentru utilizatorii contului tău: Setări → Audit Log → vezi cine s-a logat, când, ce a modificat. Stocat 90 zile, exportabil în CSV.",
      },
      {
        q: "Cum protejez parola contului?",
        a: "Setări → Securitate → Activează 2FA (TOTP cu Google Authenticator / 1Password). Recomandăm și pentru subutilizatori.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", minHeight: "100vh" }}>
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "14px 24px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ textDecoration: "none", color: COLORS.text, fontWeight: 700, fontSize: "1.25rem" }}>
            <span style={{ color: COLORS.primary }}>Open</span>Portal
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/#features" style={navLinkStyle}>Funcționalități</Link>
            <Link href="/preturi" style={navLinkStyle}>Preț</Link>
            <Link href="/status" style={navLinkStyle}>Status</Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: "64px 24px 48px", background: `linear-gradient(180deg, ${COLORS.bgAlt} 0%, ${COLORS.bg} 100%)`, textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📚</div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Cum te putem ajuta?
          </h1>
          <p style={{ fontSize: "1.05rem", color: COLORS.textMuted, lineHeight: 1.6, margin: "0 0 32px" }}>
            Răspunsuri rapide la cele mai frecvente întrebări. Dacă nu găsești ce cauți, scrie-ne pe{" "}
            <a href="mailto:support@openportal.app" style={{ color: COLORS.primary, fontWeight: 600 }}>support@openportal.app</a>.
          </p>

          {/* Category jump-links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {CATEGORIES.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  padding: "8px 14px",
                  borderRadius: 999,
                  textDecoration: "none",
                  color: COLORS.text,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{c.icon}</span>
                <span>{c.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: "48px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
          {CATEGORIES.map((cat) => (
            <section key={cat.id} id={cat.id} style={{ scrollMarginTop: 80 }}>
              <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                    {cat.title}
                  </h2>
                  <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.95rem" }}>{cat.description}</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cat.articles.map((article) => (
                  <details
                    key={article.q}
                    style={{
                      background: COLORS.bg,
                      borderRadius: 10,
                      padding: "14px 18px",
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <summary
                      style={{
                        fontWeight: 600,
                        fontSize: "0.98rem",
                        cursor: "pointer",
                        color: COLORS.text,
                        listStyle: "none",
                      }}
                    >
                      {article.q}
                    </summary>
                    <p style={{ color: COLORS.textMuted, margin: "10px 0 0", fontSize: "0.93rem", lineHeight: 1.6 }}>
                      {article.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ padding: "32px 24px 64px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              background: COLORS.bg,
              padding: 32,
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>💬</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px" }}>
              Nu găsești răspunsul?
            </h2>
            <p style={{ color: COLORS.textMuted, margin: "0 0 20px", fontSize: "0.95rem" }}>
              Echipa noastră răspunde pe email în 48h (Solo) sau 4h (Solo Pro). În limba română.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="mailto:support@openportal.app"
                style={{
                  background: COLORS.primary,
                  color: "#FFFFFF",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  padding: "12px 24px",
                  borderRadius: 10,
                }}
              >
                Scrie-ne email
              </a>
              <Link
                href="/status"
                style={{
                  background: "transparent",
                  color: COLORS.text,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                Vezi status sistem
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 24px", background: COLORS.text, color: "#CBD5E1", textAlign: "center", fontSize: "0.85rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>© {new Date().getFullYear()} OpenPortal. Open-source AGPLv3.</div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/legal/terms" style={{ color: "#CBD5E1", textDecoration: "none" }}>Termeni</Link>
            <Link href="/legal/privacy" style={{ color: "#CBD5E1", textDecoration: "none" }}>Confidențialitate</Link>
            <Link href="/legal/dpa" style={{ color: "#CBD5E1", textDecoration: "none" }}>DPA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
