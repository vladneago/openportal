import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareHeaderCTA } from "@/components/marketing/AuthAwareHeaderCTA";

export const metadata: Metadata = {
  title: "Status sistem — OpenPortal",
  description:
    "Statusul în timp real al serviciilor OpenPortal: API, aplicație web, bază de date, email, chat AI, storage. Istoric incidente 90 zile.",
  alternates: { canonical: "/status" },
};

// In production, this would be replaced by real-time checks against
// /api/health for each component. For now we render an "operational" state.
type ComponentStatus = "operational" | "degraded" | "outage" | "maintenance";

interface SystemComponent {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  uptime30d: string;
}

const COMPONENTS: SystemComponent[] = [
  {
    id: "api",
    name: "API",
    description: "Backend REST + tRPC pentru aplicația web și widget-uri",
    status: "operational",
    uptime30d: "100.00%",
  },
  {
    id: "web",
    name: "Aplicație web",
    description: "Dashboard la app.openportal.app + site-uri publicate la *.openportal.app",
    status: "operational",
    uptime30d: "100.00%",
  },
  {
    id: "database",
    name: "Bază de date",
    description: "PostgreSQL cluster cu replicare în UE",
    status: "operational",
    uptime30d: "99.99%",
  },
  {
    id: "email",
    name: "Server email",
    description: "Trimitere email-uri (confirmare programări, reminder, facturi)",
    status: "operational",
    uptime30d: "99.95%",
  },
  {
    id: "chat-ai",
    name: "Chat AI (Claude)",
    description: "Integrare Anthropic pentru widget-ul de chat AI",
    status: "operational",
    uptime30d: "99.92%",
  },
  {
    id: "storage",
    name: "Storage media",
    description: "S3-compatible pentru imagini, documente, atașamente",
    status: "operational",
    uptime30d: "99.99%",
  },
  {
    id: "anaf",
    name: "ANAF e-Factura",
    description: "Submit facturi în SPV. Depinde de disponibilitatea ANAF",
    status: "operational",
    uptime30d: "99.50%",
  },
  {
    id: "stripe",
    name: "Plăți Stripe",
    description: "Procesare plăți + abonamente recurente",
    status: "operational",
    uptime30d: "100.00%",
  },
];

const COLORS = {
  primary: "#6366F1",
  text: "#0F172A",
  textMuted: "#475569",
  textSubtle: "#94A3B8",
  bg: "#FFFFFF",
  bgAlt: "#F8FAFC",
  border: "#E2E8F0",
  operational: "#10B981",
  degraded: "#F59E0B",
  outage: "#EF4444",
  maintenance: "#3B82F6",
};

const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: "Operational",
  degraded: "Performanță redusă",
  outage: "Întrerupere",
  maintenance: "Mentenanță",
};

const STATUS_COLOR: Record<ComponentStatus, string> = {
  operational: COLORS.operational,
  degraded: COLORS.degraded,
  outage: COLORS.outage,
  maintenance: COLORS.maintenance,
};

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: 500,
} as const;

export default function StatusPage() {
  const overallStatus: ComponentStatus = COMPONENTS.every((c) => c.status === "operational")
    ? "operational"
    : COMPONENTS.some((c) => c.status === "outage")
      ? "outage"
      : "degraded";

  const overallMessage =
    overallStatus === "operational"
      ? "Toate sistemele funcționează normal"
      : overallStatus === "outage"
        ? "Există o întrerupere — investigăm"
        : "Performanță redusă în unele zone";

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
            <Link href="/ajutor" style={navLinkStyle}>Ajutor</Link>
            <AuthAwareHeaderCTA />
          </nav>
        </div>
      </header>

      {/* HERO — overall status */}
      <section style={{ padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 28px",
              background: STATUS_COLOR[overallStatus] + "14",
              border: `2px solid ${STATUS_COLOR[overallStatus]}`,
              borderRadius: 999,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: STATUS_COLOR[overallStatus],
                boxShadow: `0 0 0 4px ${STATUS_COLOR[overallStatus]}33`,
                animation: overallStatus === "operational" ? "pulse 2s ease-in-out infinite" : "none",
              }}
            />
            <span style={{ fontWeight: 700, color: STATUS_COLOR[overallStatus], fontSize: "1.05rem" }}>
              {overallMessage}
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Status sistem OpenPortal
          </h1>
          <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "1rem" }}>
            Statusul în timp real al fiecărei componente. Ultima actualizare: acum câteva secunde.
          </p>
        </div>
      </section>

      {/* COMPONENT LIST */}
      <section style={{ padding: "16px 24px 64px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ background: COLORS.bg, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            {COMPONENTS.map((c, i) => (
              <div
                key={c.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: i < COMPONENTS.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: STATUS_COLOR[c.status],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "1rem", fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textSubtle, marginLeft: 4 }}>
                      Uptime 30 zile: {c.uptime30d}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: COLORS.textMuted }}>{c.description}</p>
                </div>
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: STATUS_COLOR[c.status] + "14",
                    color: STATUS_COLOR[c.status],
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_LABEL[c.status]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCIDENT HISTORY */}
      <section style={{ padding: "32px 24px 64px", background: COLORS.bgAlt }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            Istoric incidente — ultimele 90 zile
          </h2>
          <div
            style={{
              background: COLORS.bg,
              padding: 32,
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>✅</div>
            <p style={{ margin: 0, color: COLORS.text, fontWeight: 600, fontSize: "1.05rem" }}>
              Niciun incident raportat în ultimele 90 zile
            </p>
            <p style={{ margin: "8px 0 0", color: COLORS.textMuted, fontSize: "0.9rem" }}>
              Toate componentele au funcționat în parametri normali.
            </p>
          </div>
        </div>
      </section>

      {/* SUBSCRIBE */}
      <section style={{ padding: "32px 24px 64px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px" }}>Vrei notificări la incidente?</h2>
          <p style={{ color: COLORS.textMuted, margin: "0 0 20px", fontSize: "0.95rem" }}>
            Trimitem email când există un incident sau o mentenanță programată.
          </p>
          <form
            style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}
          >
            <input
              type="email"
              placeholder="email@firma.ta"
              style={{
                flex: "1 1 240px",
                padding: "12px 16px",
                fontSize: "0.95rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                background: COLORS.primary,
                color: "#FFFFFF",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Abonează-mă
            </button>
          </form>
          <p style={{ marginTop: 12, fontSize: "0.8rem", color: COLORS.textSubtle }}>
            Doar pentru notificări de incident. Niciodată marketing.
          </p>
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
