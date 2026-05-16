"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /billing/reports — aging report + accountant CSV export
// ─────────────────────────────────────────────

interface AgingInvoice {
  id: string;
  documentNumber: string;
  customerName: string;
  customerEmail: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: string;
  amountDue: string;
  currency: string;
}

interface Bucket {
  label: string;
  total: number;
  count: number;
  invoices: AgingInvoice[];
}

interface AgingReport {
  asOf: string;
  grandTotal: number;
  grandCount: number;
  buckets: Record<string, Bucket>;
}

const TABS = [
  { href: "/billing", label: "Facturi" },
  { href: "/billing/reports", label: "Rapoarte" },
  { href: "/billing/series", label: "Serii" },
];

const BUCKET_ORDER: Array<{ key: string; color: string }> = [
  { key: "notDue", color: "#10B981" },
  { key: "1_30", color: "#F59E0B" },
  { key: "31_60", color: "#F97316" },
  { key: "61_90", color: "#EF4444" },
  { key: "90_plus", color: "#7F1D1D" },
];

function fmtMoney(n: number, currency = "RON"): string {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export default function BillingReportsPage() {
  const [report, setReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<AgingReport>("/api/v1/billing/aging");
    if (res.success && res.data) setReport(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleBucket(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function downloadCsv() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const url = `${API_URL}/api/v1/billing/export.csv?from=${exportFrom}&to=${exportTo}`;
    // Use a fetch + blob since we need to send Authorization header
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `facturi_${exportFrom}_${exportTo}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error("CSV download failed", err));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Rapoarte facturare
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Aging încasări + export pentru contabil.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/billing/reports" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/billing/reports" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/billing/reports" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Aging report */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              Aging încasări
            </h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {report ? `La data de ${report.asOf} · ${report.grandCount} facturi neîncasate · ${fmtMoney(report.grandTotal)}` : "Se încarcă…"}
            </p>
          </div>
          <button onClick={() => void load()} className="btn-secondary text-xs">
            Reîmprospătează
          </button>
        </div>

        {loading || !report ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : report.grandCount === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio factură neîncasată. 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {BUCKET_ORDER.map(({ key, color }) => {
              const bucket = report.buckets[key];
              if (!bucket) return null;
              const isOpen = expanded[key] === true;
              return (
                <div key={key} style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
                  <button
                    onClick={() => toggleBucket(key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: "transparent" }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {bucket.label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {bucket.count} facturi · {fmtMoney(bucket.total)}
                      </div>
                    </div>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {isOpen && bucket.invoices.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <table style={{ width: "100%", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "var(--bg-hover)" }}>
                            <th style={cellStyle}>Document</th>
                            <th style={cellStyle}>Client</th>
                            <th style={cellStyle}>Emisă</th>
                            <th style={cellStyle}>Scadență</th>
                            <th style={{ ...cellStyle, textAlign: "right" }}>De plată</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bucket.invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={cellStyle}>{inv.documentNumber}</td>
                              <td style={cellStyle}>{inv.customerName}</td>
                              <td style={cellStyle}>{inv.issueDate}</td>
                              <td style={cellStyle}>{inv.dueDate ?? "—"}</td>
                              <td style={{ ...cellStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                {fmtMoney(Number(inv.amountDue), inv.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV export */}
      <div
        className="rounded-lg p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          Export contabilitate
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
          Descarcă toate facturile dintr-un interval în format CSV (separator „;", encoding UTF-8 cu BOM — se deschide
          direct în Excel sau LibreOffice Calc).
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
              De la
            </label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="input text-sm"
              style={{ width: 160 }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
              Până la
            </label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="input text-sm"
              style={{ width: 160 }}
            />
          </div>
          <button onClick={downloadCsv} className="btn-primary text-sm" style={{ marginTop: 22 }}>
            Descarcă CSV
          </button>
        </div>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "8px 16px",
  textAlign: "left",
  color: "var(--text)",
  fontWeight: 400,
};
