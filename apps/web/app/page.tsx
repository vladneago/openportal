import Link from "next/link";
import type { Metadata } from "next";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";

export const metadata: Metadata = {
  title: "OpenPortal — Site web + programări online + facturare pentru solo entrepreneurs",
  description:
    "Platforma all-in-one pentru saloane, frizerii, cofetării, cabinete medicale, consultanți și PFA. Site web în 60 secunde, programări online, facturare e-Factura, chat AI și POS — totul într-un loc.",
  openGraph: {
    title: "OpenPortal — Tot ce-ți trebuie pentru business-ul tău solo",
    description:
      "Site web, programări online, facturare e-Factura, POS și chat AI. €25/lună. 14 zile gratis.",
    type: "website",
  },
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

const FEATURES = [
  {
    icon: "🌐",
    title: "Site web profesional",
    body:
      "Alege dintre 40+ template-uri pentru saloane, frizerii, cofetării, cabinete, consultanți. Editor drag-and-drop, fără cod. Publishing instant pe subdomeniu sau domeniu propriu.",
  },
  {
    icon: "📅",
    title: "Programări online 24/7",
    body:
      "Clienții rezervă singuri de pe site sau Instagram. Confirmare automată pe email, reminder cu 24h și 2h înainte. Reduce no-show-urile cu 50%.",
  },
  {
    icon: "🧾",
    title: "Facturare + e-Factura ANAF",
    body:
      "Emite facturi în 10 secunde. Trimite automat în SPV (ANAF e-Factura). Track plăți, aging report, integrare Stripe pentru link de plată.",
  },
  {
    icon: "💬",
    title: "Chat AI cu Claude",
    body:
      "Asistent virtual pe site care răspunde la întrebări frecvente, ajută cu rezervări și escaladează la tine când e nevoie. Antrenat pe business-ul tău.",
  },
  {
    icon: "🛒",
    title: "POS + Stoc",
    body:
      "Casa de marcat touch-friendly. Vinzi produse, batem bon, gestionezi stocuri și primești Z-Report zilnic. Plată cash, card, transfer sau voucher.",
  },
  {
    icon: "🔒",
    title: "GDPR + Securitate",
    body:
      "Banner cookies, consents granulare, izolare multi-tenant cu RLS PostgreSQL. Date stocate în UE. Suntem open-source, deci poți audita codul.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Răspunzi la 6 întrebări",
    body: "Industria ta, serviciile, programul, personalul. Durează 2 minute.",
  },
  {
    n: "2",
    title: "OpenPortal creează totul",
    body: "Site, calendar, listă servicii, fișier clienți, serii facturi — auto-generat.",
  },
  {
    n: "3",
    title: "Primești primul client online",
    body: "Distribui linkul, instalezi widgetul pe Instagram, scanezi QR-code. Gata.",
  },
];

const PLANS = [
  {
    name: "Solo",
    price: "€25",
    pricePeriod: "/lună",
    tagline: "Pentru solo entrepreneurs",
    cta: "Start gratuit 14 zile",
    highlight: false,
    features: [
      "Site web cu subdomeniu *.openportal.app",
      "Programări online nelimitate",
      "Pana la 3 angajați / resurse",
      "Facturare + 100 e-Factura/lună",
      "Chat AI cu 500 mesaje/lună",
      "Email server cu 5 cutii",
      "Suport email",
    ],
  },
  {
    name: "Solo Pro",
    price: "€50",
    pricePeriod: "/lună",
    tagline: "Pentru afaceri în creștere",
    cta: "Start gratuit 14 zile",
    highlight: true,
    features: [
      "Tot din Solo, plus:",
      "Domeniu propriu (yourshop.ro)",
      "Personal/resurse nelimitate",
      "e-Factura nelimitat",
      "Chat AI 5000 mesaje/lună",
      "POS + stoc nelimitat",
      "Email server cu 20 cutii",
      "Suport prioritar (4h răspuns)",
    ],
  },
];

const FAQ = [
  {
    q: "Pot folosi domeniul meu existent?",
    a: "Da, pe planul Solo Pro. Te ghidează un wizard să-l configurezi în 2 minute. Pe plan Solo primești un subdomeniu de tipul saloanima.openportal.app.",
  },
  {
    q: "Funcționează e-Factura cu ANAF real?",
    a: "Da. Conectezi contul tău ANAF SPV, iar OpenPortal trimite automat XML-ul UBL 2.1 CIUS-RO. Primești status acceptat/respins direct în dashboard.",
  },
  {
    q: "Am nevoie de cunoștințe tehnice?",
    a: "Nu. Onboarding-ul te conduce pas cu pas în 6 ecrane. Dacă te blochezi, suportul răspunde pe email sau chat.",
  },
  {
    q: "Pot să anulez oricând?",
    a: "Da. Abonament lunar, fără contract. Exporți datele tale (clienți, facturi, programări) oricând în format CSV.",
  },
  {
    q: "Care e diferența față de Booksy sau Wix?",
    a: "OpenPortal combină site builder + programări + facturare + POS într-un singur produs românesc, integrat cu ANAF e-Factura. La un preț de 2-3x mai mic decât suma celor 3-4 tool-uri pe care le-ai folosi separat.",
  },
  {
    q: "Pot să-mi văd codul sursă?",
    a: "Da — OpenPortal este open-source (AGPLv3). Codul e pe GitHub, poți audita, contribui sau găzdui chiar tu instanța ta.",
  },
];

const TARGET_BUSINESSES: Array<{ label: string; href?: string }> = [
  { label: "💇 Saloane înfrumusețare", href: "/saloane" },
  { label: "💈 Frizerii / barbershop", href: "/frizerii" },
  { label: "🧁 Cofetării / patiserii", href: "/cofetarii" },
  { label: "💐 Florării", href: "/florarii" },
  { label: "🩺 Cabinete medicale", href: "/cabinete-medicale" },
  { label: "🧖 Spa / wellness" },
  { label: "🦷 Stomatologi" },
  { label: "💼 Consultanți / coach" },
  { label: "🐶 Veterinari" },
  { label: "📸 Fotografi" },
  { label: "🧘 Yoga / fitness" },
];

export default function LandingPage() {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* ── HEADER ───────────────────────────── */}
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
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link href="/" style={{ textDecoration: "none", color: COLORS.text, fontWeight: 700, fontSize: "1.25rem" }}>
            <span style={{ color: COLORS.primary }}>Open</span>Portal
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="#features" className="nav-link" style={navLinkStyle}>
              Funcționalități
            </Link>
            <Link href="#pricing" className="nav-link" style={navLinkStyle}>
              Preț
            </Link>
            <Link href="#faq" className="nav-link" style={navLinkStyle}>
              FAQ
            </Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 96px",
          background: `linear-gradient(180deg, ${COLORS.bgAlt} 0%, ${COLORS.bg} 100%)`,
        }}
      >
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              background: "#EEF2FF",
              color: COLORS.primaryDark,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            🇷🇴 Construit în România pentru solo entrepreneurs
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.1,
              fontWeight: 800,
              margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}
          >
            Site web, programări online și facturare —{" "}
            <span style={{ color: COLORS.primary }}>într-un singur loc.</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
              color: COLORS.textMuted,
              maxWidth: 680,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            Pentru saloane, frizerii, cofetării, consultanți și PFA. Lansezi în 60 de secunde,
            începi să primești clienți astăzi. Integrat cu ANAF e-Factura.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                background: COLORS.primary,
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "14px 28px",
                borderRadius: 10,
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}
            >
              Start gratuit — 14 zile
            </Link>
            <Link
              href="#features"
              style={{
                background: "transparent",
                color: COLORS.text,
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "14px 28px",
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              Vezi cum funcționează →
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: "0.85rem", color: COLORS.textSubtle }}>
            Fără card de credit. Anulezi oricând.
          </p>
        </div>
      </section>

      {/* ── TARGET BUSINESSES ────────────────── */}
      <section style={{ padding: "32px 24px", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: 16, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Construit pentru
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            {TARGET_BUSINESSES.map((b) => {
              const style = {
                background: COLORS.bg,
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${COLORS.border}`,
                fontSize: "0.9rem",
                color: COLORS.text,
                textDecoration: "none" as const,
                display: "inline-block" as const,
              };
              return b.href ? (
                <Link key={b.label} href={b.href} style={{ ...style, fontWeight: 600 }}>
                  {b.label} →
                </Link>
              ) : (
                <span key={b.label} style={style}>
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Tot ce-ți trebuie pentru a vinde online
            </h2>
            <p style={{ fontSize: "1.1rem", color: COLORS.textMuted, maxWidth: 640, margin: "0 auto" }}>
              Înlocuiește 5 tool-uri scumpe cu unul singur. Toate datele într-un loc, toate integrate.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: COLORS.bg,
                  padding: 28,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ color: COLORS.textMuted, fontSize: "0.95rem", margin: 0, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section style={{ padding: "96px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              De la 0 la primul client în 60 de secunde
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
            }}
          >
            {STEPS.map((s) => (
              <div key={s.n} style={{ position: "relative" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: COLORS.primary,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    marginBottom: 16,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ color: COLORS.textMuted, fontSize: "0.95rem", margin: 0, lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Preț simplu, fără surprize
            </h2>
            <p style={{ fontSize: "1.1rem", color: COLORS.textMuted, maxWidth: 580, margin: "0 auto" }}>
              Fără setup fee, fără comisioane pe rezervări. Anulezi oricând.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
              maxWidth: 880,
              margin: "0 auto",
            }}
          >
            {PLANS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: p.highlight ? COLORS.primary : COLORS.bg,
                  color: p.highlight ? "#FFFFFF" : COLORS.text,
                  padding: 32,
                  borderRadius: 20,
                  border: p.highlight ? "none" : `1px solid ${COLORS.border}`,
                  boxShadow: p.highlight ? "0 12px 32px rgba(99,102,241,0.3)" : "none",
                  position: "relative",
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      right: 24,
                      background: COLORS.accent,
                      color: "#FFFFFF",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Cel mai popular
                  </div>
                )}
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px" }}>{p.name}</h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: "0 0 20px" }}>{p.tagline}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>{p.price}</span>
                  <span style={{ fontSize: "1rem", opacity: 0.8 }}>{p.pricePeriod}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
                  {p.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        padding: "8px 0",
                        fontSize: "0.95rem",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: p.highlight ? "#FFFFFF" : COLORS.accent, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  style={{
                    display: "block",
                    background: p.highlight ? "#FFFFFF" : COLORS.primary,
                    color: p.highlight ? COLORS.primary : "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    padding: "14px 24px",
                    borderRadius: 10,
                    textAlign: "center",
                  }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section id="faq" style={{ padding: "96px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Întrebări frecvente
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                style={{
                  background: COLORS.bg,
                  borderRadius: 12,
                  padding: "16px 20px",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    color: COLORS.text,
                    listStyle: "none",
                  }}
                >
                  {item.q}
                </summary>
                <p style={{ color: COLORS.textMuted, margin: "12px 0 0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            textAlign: "center",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            color: "#FFFFFF",
            padding: "64px 32px",
            borderRadius: 24,
          }}
        >
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Gata să-ți lansezi business-ul online?
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.95, maxWidth: 560, margin: "0 auto 32px" }}>
            14 zile gratuit. Fără card. Fără riscuri.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              background: "#FFFFFF",
              color: COLORS.primary,
              textDecoration: "none",
              fontSize: "1.05rem",
              fontWeight: 700,
              padding: "16px 36px",
              borderRadius: 10,
            }}
          >
            Începe acum →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer
        style={{
          padding: "48px 24px 32px",
          background: COLORS.text,
          color: "#CBD5E1",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 32,
              marginBottom: 32,
            }}
          >
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 12 }}>
                <span style={{ color: "#A5B4FC" }}>Open</span>Portal
              </div>
              <p style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.6 }}>
                Platforma all-in-one pentru solo entrepreneurs din România.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Produs
              </h4>
              <ul style={footerListStyle}>
                <li><Link href="#features" style={footerLinkStyle}>Funcționalități</Link></li>
                <li><Link href="#pricing" style={footerLinkStyle}>Prețuri</Link></li>
                <li><Link href="#faq" style={footerLinkStyle}>FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Companie
              </h4>
              <ul style={footerListStyle}>
                <li><Link href="/login" style={footerLinkStyle}>Conectează-te</Link></li>
                <li><Link href="/register" style={footerLinkStyle}>Începe gratuit</Link></li>
                <li><a href="https://github.com/openportal" style={footerLinkStyle} rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Legal
              </h4>
              <ul style={footerListStyle}>
                <li><Link href="/legal/terms" style={footerLinkStyle}>Termeni</Link></li>
                <li><Link href="/legal/privacy" style={footerLinkStyle}>Confidențialitate</Link></li>
                <li><Link href="/legal/dpa" style={footerLinkStyle}>DPA</Link></li>
              </ul>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: "0.85rem",
            }}
          >
            <div>© {new Date().getFullYear()} OpenPortal. Open-source AGPLv3.</div>
            <div>Făcut cu ❤️ în România.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: 500,
} as const;

const footerListStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: "0.85rem",
} as const;

const footerLinkStyle = {
  color: "#CBD5E1",
  textDecoration: "none",
} as const;
