import Link from "next/link";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";
import type { ComparisonData } from "./comparison-data";

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
  competitorDim: "#94A3B8",
};

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: 500,
} as const;

function renderCell(v: string | boolean, isOpen: boolean): React.ReactNode {
  if (v === true) {
    return <span style={{ color: isOpen ? COLORS.accent : COLORS.competitorDim, fontWeight: 700, fontSize: "1.2rem" }}>✓</span>;
  }
  if (v === false) {
    return <span style={{ color: "#EF4444", fontSize: "1.2rem", fontWeight: 700 }}>✕</span>;
  }
  return <span style={{ color: isOpen ? COLORS.text : COLORS.textMuted, fontSize: "0.85rem" }}>{v}</span>;
}

export function ComparisonPage({ data }: { data: ComparisonData }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
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
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ textDecoration: "none", color: COLORS.text, fontWeight: 700, fontSize: "1.25rem" }}>
            <span style={{ color: COLORS.primary }}>Open</span>Portal
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/#features" style={navLinkStyle}>Funcționalități</Link>
            <Link href="/preturi" style={navLinkStyle}>Preț</Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: "80px 24px 64px", background: `linear-gradient(180deg, ${COLORS.bgAlt} 0%, ${COLORS.bg} 100%)` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "#EEF2FF", color: COLORS.primaryDark, padding: "6px 14px", borderRadius: 999, fontSize: "0.85rem", fontWeight: 600, marginBottom: 24 }}>
            OpenPortal vs {data.competitor}
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: 1.15, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
            {data.heroTitle}
          </h1>
          <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", color: COLORS.textMuted, maxWidth: 760, margin: "0 auto 32px", lineHeight: 1.6 }}>
            {data.heroSubtitle}
          </p>

          {/* Pricing teaser */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, maxWidth: 640, margin: "0 auto 32px" }}>
            <div style={{ background: COLORS.bg, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: "0.85rem", color: COLORS.textSubtle, fontWeight: 600, marginBottom: 4 }}>{data.competitor}</div>
              <div style={{ fontSize: "1.05rem", color: COLORS.text }}>{data.competitorPriceHint}</div>
            </div>
            <div style={{ background: "#EEF2FF", padding: 20, borderRadius: 12, border: `2px solid ${COLORS.primary}` }}>
              <div style={{ fontSize: "0.85rem", color: COLORS.primary, fontWeight: 600, marginBottom: 4 }}>OpenPortal</div>
              <div style={{ fontSize: "1.05rem", color: COLORS.text, fontWeight: 600 }}>{data.openPortalPriceHint}</div>
            </div>
          </div>

          <Link href="/register" style={{ background: COLORS.primary, color: "#FFFFFF", textDecoration: "none", fontSize: "1rem", fontWeight: 600, padding: "14px 28px", borderRadius: 10, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
            Start gratuit 14 zile →
          </Link>
          <p style={{ marginTop: 16, fontSize: "0.85rem", color: COLORS.textSubtle }}>
            Migrare gratuită din {data.competitor}. Fără card. Anulezi oricând.
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Comparație detaliată
            </h2>
            <p style={{ fontSize: "1rem", color: COLORS.textMuted, margin: 0 }}>
              Funcționalitate cu funcționalitate. Fără marketing speak.
            </p>
          </div>

          <div style={{ background: COLORS.bg, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", background: COLORS.bgAlt, padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.textMuted }}>Funcționalitate</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", color: COLORS.primary }}>OpenPortal</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", color: COLORS.textMuted }}>
                {data.competitorLogo && <span style={{ marginRight: 4 }}>{data.competitorLogo}</span>}
                {data.competitor}
              </div>
            </div>
            {data.rows.map((row, i) => (
              <div key={i}>
                {row.group && (
                  <div style={{ padding: "16px 24px 8px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.textSubtle, background: COLORS.bgAlt }}>
                    {row.group}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", padding: "12px 24px", borderBottom: i < data.rows.length - 1 ? `1px solid ${COLORS.border}` : "none", alignItems: "center", fontSize: "0.95rem" }}>
                  <div style={{ color: COLORS.text }}>{row.label}</div>
                  <div style={{ textAlign: "center" }}>{renderCell(row.openPortal, true)}</div>
                  <div style={{ textAlign: "center" }}>{renderCell(row.competitor, false)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY SWITCH */}
      <section style={{ padding: "64px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              De ce să schimbi
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {data.whySwitch.map((item) => (
              <div key={item.title} style={{ background: COLORS.bg, padding: 28, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 12px", color: COLORS.text }}>{item.title}</h3>
                <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Întrebări despre migrare
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.faq.map((item) => (
              <details key={item.q} style={{ background: COLORS.bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${COLORS.border}` }}>
                <summary style={{ fontWeight: 600, fontSize: "1rem", cursor: "pointer", color: COLORS.text, listStyle: "none" }}>
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

      {/* FINAL CTA */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: "#fff", padding: "56px 32px", borderRadius: 24 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Pornește migrarea din {data.competitor}
          </h2>
          <p style={{ fontSize: "1.05rem", opacity: 0.95, margin: "0 0 24px" }}>
            14 zile gratuit. Echipa noastră face migrarea în 48h. Fără riscuri.
          </p>
          <Link href="/register" style={{ display: "inline-block", background: "#fff", color: COLORS.primary, textDecoration: "none", fontSize: "1.05rem", fontWeight: 700, padding: "16px 36px", borderRadius: 10 }}>
            Start gratuit 14 zile →
          </Link>
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
