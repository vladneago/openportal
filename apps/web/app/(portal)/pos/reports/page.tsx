"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface DailyReport {
  date: string;
  summary: {
    transactions: number;
    grossRevenue: string;
    totalVat: string;
    totalDiscount: string;
    totalRefunded: string;
    tips: string;
  };
  byPaymentMethod: Array<{
    method: string | null;
    transactions: number;
    amount: string;
  }>;
}

const TABS = [
  { href: "/pos", label: "Terminal" },
  { href: "/pos/products", label: "Produse" },
  { href: "/pos/reports", label: "Rapoarte" },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  voucher: "Voucher",
  bank_transfer: "Transfer",
  house_account: "Cont casă",
  split: "Mixt",
};

export default function PosReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/pos/reports/daily?date=${date}`);
    if (res.success) setReport(res.data);
    setLoading(false);
  }

  const summary = report?.summary;
  const gross = Number(summary?.grossRevenue || 0);
  const refunded = Number(summary?.totalRefunded || 0);
  const net = gross - refunded;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Raport zilnic (Z-Report)
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sumar vânzări, TVA, reduceri și storno-uri pentru data selectată.
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input text-sm"
          style={{ width: 180 }}
        />
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/pos/reports" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/pos/reports" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/pos/reports" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
        >
          Se încarcă raportul…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <StatCard label="Tranzacții" value={String(summary?.transactions || 0)} />
            <StatCard
              label="Vânzări brute"
              value={`${gross.toFixed(2)} RON`}
              accent="#10B981"
            />
            <StatCard
              label="Storno-uri"
              value={`${refunded.toFixed(2)} RON`}
              accent={refunded > 0 ? "#EF4444" : "var(--text)"}
            />
            <StatCard label="Net" value={`${net.toFixed(2)} RON`} accent="#6366F1" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="TVA total" value={`${Number(summary?.totalVat || 0).toFixed(2)} RON`} />
            <StatCard label="Reduceri" value={`${Number(summary?.totalDiscount || 0).toFixed(2)} RON`} />
            <StatCard label="Bacșișuri" value={`${Number(summary?.tips || 0).toFixed(2)} RON`} />
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="font-medium text-sm" style={{ color: "var(--text)" }}>
                Defalcare pe metoda de plată
              </h2>
            </div>
            {!report?.byPaymentMethod || report.byPaymentMethod.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Nicio tranzacție în această zi.
              </div>
            ) : (
              report.byPaymentMethod.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {row.method ? METHOD_LABELS[row.method] || row.method : "Nedefinită"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {row.transactions} tranzacții
                    </div>
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {Number(row.amount).toFixed(2)} RON
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-xl font-semibold" style={{ color: accent || "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
