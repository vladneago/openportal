import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "14px 24px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#0F172A", fontWeight: 700, fontSize: "1.15rem" }}>
            <span style={{ color: "#6366F1" }}>Open</span>Portal
          </Link>
          <Link href="/" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Înapoi la site
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <article
          style={{
            background: "#FFFFFF",
            padding: "48px 40px",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            lineHeight: 1.7,
          }}
        >
          {children}
        </article>
      </main>
    </div>
  );
}
