import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";

export const metadata: Metadata = {
  title: "Prețuri OpenPortal — €25 sau €50/lună, fără surprize",
  description:
    "Solo €25/lună sau Solo Pro €50/lună. 14 zile gratuit, fără card. Fără comisioane pe rezervări. Anulezi oricând. Vezi exact ce primești în fiecare plan.",
  openGraph: {
    title: "Prețuri OpenPortal — transparente, fără surprize",
    description: "Solo €25/lună sau Solo Pro €50/lună. 14 zile gratuit.",
    type: "website",
  },
  alternates: { canonical: "/preturi" },
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

interface PlanLine {
  label: string;
  solo: string | boolean;
  pro: string | boolean;
  group?: string;
}

const COMPARISON: PlanLine[] = [
  // Site & branding
  { label: "Site web cu subdomeniu *.openportal.app", solo: true, pro: true, group: "Site web" },
  { label: "Domeniu propriu (yourshop.ro)", solo: false, pro: true },
  { label: "Editare vizuală site (no-code)", solo: true, pro: true },
  { label: "40+ template-uri industrie", solo: true, pro: true },
  { label: "Galerie media (imagini, video)", solo: "1 GB", pro: "10 GB" },
  { label: "Înlăturare branding OpenPortal", solo: false, pro: true },

  // Booking
  { label: "Programări online nelimitate", solo: true, pro: true, group: "Programări" },
  { label: "Personal / resurse", solo: "Max 3", pro: "Nelimitat" },
  { label: "Calendar per resursă cu sincronizare", solo: true, pro: true },
  { label: "Reminder automat 24h + 2h", solo: true, pro: true },
  { label: "Self-cancel + reschedule pentru clienți", solo: true, pro: true },
  { label: "SMS reminder", solo: false, pro: "În roadmap Q2" },

  // Billing
  { label: "Facturare nelimitată", solo: true, pro: true, group: "Facturare" },
  { label: "e-Factura ANAF SPV", solo: "100/lună", pro: "Nelimitat" },
  { label: "Link Stripe pe factură", solo: true, pro: true },
  { label: "Track plăți + aging report", solo: true, pro: true },
  { label: "Recurring billing (retainer)", solo: false, pro: true },

  // Chat AI
  { label: "Chat AI cu Claude (Anthropic)", solo: "500 mesaje/lună", pro: "5000 mesaje/lună", group: "Chat AI" },
  { label: "Antrenat pe knowledge base-ul tău", solo: true, pro: true },
  { label: "Function calling (book, escalate)", solo: false, pro: true },

  // POS
  { label: "POS terminal cu stoc", solo: "100 produse", pro: "Nelimitat", group: "POS / Magazin" },
  { label: "Z-Report zilnic", solo: true, pro: true },
  { label: "Multiple locații", solo: false, pro: true },

  // Email
  { label: "Email server cu DKIM/SPF/DMARC", solo: "5 cutii", pro: "20 cutii", group: "Email" },
  { label: "Webmail UI", solo: true, pro: true },

  // Support & extras
  { label: "Suport pe email", solo: "48h răspuns", pro: "4h răspuns", group: "Suport" },
  { label: "Suport prioritar pe chat", solo: false, pro: true },
  { label: "Onboarding personalizat 1-la-1", solo: false, pro: true },
  { label: "Import gratuit din Booksy/Wix/Excel", solo: true, pro: true },
  { label: "Export complet date (CSV)", solo: true, pro: true },
];

const FAQ = [
  {
    q: "Pot schimba planul oricând?",
    a: "Da. Upgrade instant, downgrade la următorul ciclu de facturare. Nu te penalizăm cu fee-uri pentru schimbare.",
  },
  {
    q: "Ce se întâmplă după trial de 14 zile?",
    a: "Dacă nu adaugi metodă de plată, contul tău intră în mod read-only — datele sunt salvate 60 zile, poți reveni oricând. Dacă alegi plan, abonamentul pornește automat.",
  },
  {
    q: "Plătesc TVA?",
    a: "Da, prețurile sunt fără TVA. Pentru clienții persoane fizice din UE se aplică TVA conform legii. Pentru firme cu VAT ID valid în UE se aplică reverse-charge.",
  },
  {
    q: "Există discount pentru plata anuală?",
    a: "Da, 20% reducere pe plata anuală: Solo €240/an (vs €300), Solo Pro €480/an (vs €600).",
  },
  {
    q: "Ce înseamnă „nelimitat”?",
    a: "Nelimitat înseamnă fără cap soft (poți emite 10.000 facturi/lună). Există fair-use anti-abuse documentat în ToS. Nu ai cum să ne supraîncarci în practică.",
  },
  {
    q: "Pot folosi gratuit dacă sunt ONG / educație?",
    a: "Da. Trimite-ne un email la nonprofit@openportal.app cu actele de înființare ONG sau acreditare educație. Răspundem în 48h cu plan gratuit personalizat.",
  },
  {
    q: "Ce primesc gratuit dacă mă recomandă un prieten?",
    a: "Ambii primiți o lună gratuită (you + your friend) când prietenul ajunge la primul ciclu plătit. Codul unic se generează din dashboard.",
  },
  {
    q: "Există cost de setup sau onboarding?",
    a: "Zero. Wizard-ul de onboarding (6 pași) e inclus. Migrare din alte sisteme = gratuită, asistată de echipa noastră.",
  },
];

function renderCell(v: string | boolean): React.ReactNode {
  if (v === true) return <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: "1.1rem" }}>✓</span>;
  if (v === false) return <span style={{ color: COLORS.textSubtle, fontSize: "1.1rem" }}>—</span>;
  return <span style={{ color: COLORS.text, fontSize: "0.9rem" }}>{v}</span>;
}

export default function PreturiPage() {
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
            <Link href="/preturi" style={{ ...navLinkStyle, color: COLORS.primary, fontWeight: 600 }}>Preț</Link>
            <Link href="/#faq" style={navLinkStyle}>FAQ</Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: "64px 24px 48px", background: `linear-gradient(180deg, ${COLORS.bgAlt} 0%, ${COLORS.bg} 100%)`, textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Preț simplu, <span style={{ color: COLORS.primary }}>fără surprize</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
            Plătești unul, primești tot. Fără setup fee, fără comisioane pe rezervări, fără upgrade-uri ascunse. 14 zile gratuit pentru orice plan.
          </p>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section style={{ padding: "32px 24px 64px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {/* Solo */}
          <div style={{ background: COLORS.bg, padding: 32, borderRadius: 20, border: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px" }}>Solo</h3>
            <p style={{ fontSize: "0.95rem", color: COLORS.textMuted, margin: "0 0 24px" }}>Pentru solo entrepreneurs care încep</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: "3rem", fontWeight: 800 }}>€25</span>
              <span style={{ fontSize: "1rem", color: COLORS.textMuted }}>/lună</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: COLORS.textSubtle, margin: "0 0 24px" }}>sau €240/an — economisești €60</p>
            <Link href="/register" style={{ display: "block", background: COLORS.primary, color: "#fff", textDecoration: "none", padding: "14px 24px", borderRadius: 10, textAlign: "center", fontWeight: 600 }}>
              Start gratuit 14 zile →
            </Link>
            <p style={{ fontSize: "0.8rem", color: COLORS.textSubtle, marginTop: 12, textAlign: "center" }}>Fără card de credit</p>
          </div>

          {/* Solo Pro */}
          <div style={{ background: COLORS.primary, color: "#fff", padding: 32, borderRadius: 20, boxShadow: "0 12px 32px rgba(99,102,241,0.3)", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, right: 24, background: COLORS.accent, color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Cel mai popular
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px" }}>Solo Pro</h3>
            <p style={{ fontSize: "0.95rem", opacity: 0.9, margin: "0 0 24px" }}>Pentru afaceri în creștere</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: "3rem", fontWeight: 800 }}>€50</span>
              <span style={{ fontSize: "1rem", opacity: 0.9 }}>/lună</span>
            </div>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0 0 24px" }}>sau €480/an — economisești €120</p>
            <Link href="/register" style={{ display: "block", background: "#fff", color: COLORS.primary, textDecoration: "none", padding: "14px 24px", borderRadius: 10, textAlign: "center", fontWeight: 700 }}>
              Start gratuit 14 zile →
            </Link>
            <p style={{ fontSize: "0.8rem", opacity: 0.85, marginTop: 12, textAlign: "center" }}>Fără card de credit</p>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ padding: "64px 24px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Ce primești în fiecare plan
            </h2>
            <p style={{ fontSize: "1rem", color: COLORS.textMuted, margin: 0 }}>
              Toate funcționalitățile importante sunt incluse în ambele planuri. Diferențele țin de volum.
            </p>
          </div>
          <div style={{ background: COLORS.bg, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: COLORS.bgAlt, padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.textMuted }}>Funcționalitate</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }}>Solo</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", color: COLORS.primary }}>Solo Pro</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i}>
                {row.group && (
                  <div style={{ padding: "16px 24px 8px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.textSubtle, background: COLORS.bgAlt }}>
                    {row.group}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", padding: "12px 24px", borderBottom: i < COMPARISON.length - 1 ? `1px solid ${COLORS.border}` : "none", alignItems: "center", fontSize: "0.95rem" }}>
                  <div style={{ color: COLORS.text }}>{row.label}</div>
                  <div style={{ textAlign: "center" }}>{renderCell(row.solo)}</div>
                  <div style={{ textAlign: "center" }}>{renderCell(row.pro)}</div>
                </div>
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
              Întrebări despre facturare
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item) => (
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
            Ai întrebări care nu au răspuns aici?
          </h2>
          <p style={{ fontSize: "1.05rem", opacity: 0.95, margin: "0 0 24px" }}>
            Scrie-ne la <a href="mailto:hello@openportal.app" style={{ color: "#fff", textDecoration: "underline" }}>hello@openportal.app</a> sau pornește un trial — îți răspundem din dashboard.
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
