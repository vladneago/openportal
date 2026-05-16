import Link from "next/link";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";
import type { IndustryLandingData } from "./industry-data";

const COLORS = {
  text: "#0F172A",
  textMuted: "#475569",
  textSubtle: "#94A3B8",
  bg: "#FFFFFF",
  bgAlt: "#F8FAFC",
  border: "#E2E8F0",
  accentDark: "#4338CA",
};

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

export function IndustryLandingPage({ data }: { data: IndustryLandingData }) {
  const accent = data.accentHex;
  // Build a soft tint for backgrounds — append 14 (alpha 0x14)
  const accentSoft = accent + "14";
  const accentLight = accent + "22";

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
            <span style={{ color: accent }}>Open</span>Portal
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/#features" className="nav-link" style={navLinkStyle}>
              Funcționalități
            </Link>
            <Link href="/#pricing" className="nav-link" style={navLinkStyle}>
              Preț
            </Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 96px",
          background: `linear-gradient(180deg, ${accentSoft} 0%, ${COLORS.bg} 100%)`,
        }}
      >
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              background: accentLight,
              color: accent,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            {data.heroBadge}
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
            {data.heroTitle}{" "}
            <span style={{ color: accent }}>{data.heroHighlight}</span>
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
            {data.heroSubtitle}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                background: accent,
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "14px 28px",
                borderRadius: 10,
                boxShadow: `0 4px 14px ${accent}66`,
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
              Vezi cum te ajută →
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: "0.85rem", color: COLORS.textSubtle }}>
            Fără card. Anulezi oricând. €25/lună după trial.
          </p>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Recunoști aceste probleme?
            </h2>
            <p style={{ fontSize: "1.1rem", color: COLORS.textMuted, maxWidth: 640, margin: "0 auto" }}>
              Le-am auzit de la zeci de antreprenori din domeniul tău. Așa le rezolvăm.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {data.painPoints.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: 28,
                  background: COLORS.bgAlt,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>😩</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Problema
                    </div>
                    <p style={{ fontSize: "1rem", margin: 0, color: COLORS.text, lineHeight: 1.5 }}>{p.problem}</p>
                  </div>
                </div>
                <div style={{ height: 1, background: COLORS.border }} />
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>✅</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Cu OpenPortal
                    </div>
                    <p style={{ fontSize: "1rem", margin: 0, color: COLORS.text, lineHeight: 1.5 }}>{p.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Tot ce ai nevoie, într-un loc
            </h2>
            <p style={{ fontSize: "1.1rem", color: COLORS.textMuted, maxWidth: 640, margin: "0 auto" }}>
              Funcționalitățile sunt aceleași pentru toate planurile. Plata pleacă de la €25/lună.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {data.features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: COLORS.bg,
                  padding: 28,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
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

      {/* ── TESTIMONIAL ──────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>“</div>
          <blockquote
            style={{
              fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
              fontWeight: 600,
              lineHeight: 1.5,
              margin: "0 0 24px",
              color: COLORS.text,
              letterSpacing: "-0.01em",
            }}
          >
            {data.testimonialSnippet.quote}
          </blockquote>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: 999,
              background: accentSoft,
              color: accent,
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: accent, display: "inline-block" }} />
            {data.testimonialSnippet.who}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Întrebări frecvente
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.faq.map((item) => (
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
            background: `linear-gradient(135deg, ${accent} 0%, ${COLORS.accentDark} 100%)`,
            color: "#FFFFFF",
            padding: "64px 32px",
            borderRadius: 24,
          }}
        >
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Gata să-ți digitalizezi business-ul?
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.95, maxWidth: 560, margin: "0 auto 32px" }}>
            14 zile gratuit. Fără card. Te ghidează un wizard în 6 pași.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              background: "#FFFFFF",
              color: accent,
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
                Soluții
              </h4>
              <ul style={footerListStyle}>
                <li><Link href="/saloane" style={footerLinkStyle}>Saloane</Link></li>
                <li><Link href="/frizerii" style={footerLinkStyle}>Frizerii</Link></li>
                <li><Link href="/spa-wellness" style={footerLinkStyle}>SPA & wellness</Link></li>
                <li><Link href="/yoga" style={footerLinkStyle}>Yoga / pilates</Link></li>
                <li><Link href="/fitness" style={footerLinkStyle}>Fitness / PT</Link></li>
                <li><Link href="/cabinete-medicale" style={footerLinkStyle}>Cabinete medicale</Link></li>
                <li><Link href="/stomatologi" style={footerLinkStyle}>Stomatologi</Link></li>
                <li><Link href="/psihologi" style={footerLinkStyle}>Psihologi</Link></li>
                <li><Link href="/avocati" style={footerLinkStyle}>Avocați / notari</Link></li>
                <li><Link href="/contabili" style={footerLinkStyle}>Contabili</Link></li>
                <li><Link href="/consultanti" style={footerLinkStyle}>Consultanți</Link></li>
                <li><Link href="/fotografie" style={footerLinkStyle}>Fotografi</Link></li>
                <li><Link href="/cofetarii" style={footerLinkStyle}>Cofetării</Link></li>
                <li><Link href="/florarii" style={footerLinkStyle}>Florării</Link></li>
                <li><Link href="/restaurante" style={footerLinkStyle}>Restaurante</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Produs
              </h4>
              <ul style={footerListStyle}>
                <li><Link href="/#features" style={footerLinkStyle}>Funcționalități</Link></li>
                <li><Link href="/preturi" style={footerLinkStyle}>Prețuri</Link></li>
                <li><Link href="/vs/booksy" style={footerLinkStyle}>vs Booksy</Link></li>
                <li><Link href="/vs/wix" style={footerLinkStyle}>vs Wix</Link></li>
                <li><Link href="/ajutor" style={footerLinkStyle}>Ajutor</Link></li>
                <li><Link href="/status" style={footerLinkStyle}>Status</Link></li>
                <li><Link href="/login" style={footerLinkStyle}>Conectează-te</Link></li>
                <li><Link href="/register" style={footerLinkStyle}>Începe gratuit</Link></li>
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
