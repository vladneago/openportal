"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /marketing — campaigns list + summary
// ─────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  targetType: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  createdAt: string;
}

interface Summary {
  drafts: number;
  scheduled: number;
  sent: number;
  sentThisMonth: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  sending: "Se trimite",
  sent: "Trimisă",
  paused: "Pauzată",
  failed: "Eșuată",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  scheduled: "#06B6D4",
  sending: "#F59E0B",
  sent: "#10B981",
  paused: "#94A3B8",
  failed: "#EF4444",
};

const TARGET_LABELS: Record<string, string> = {
  all_with_consent: "Toți clienții cu consimțământ",
  segment_recent: "Clienți recenți",
  segment_dormant: "Clienți inactivi",
  segment_top_spenders: "Top cheltuitori",
  segment_tag: "Cu etichetă",
  manual: "Listă manuală",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MarketingListPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [listRes, summaryRes] = await Promise.all([
      api<Campaign[]>(`/api/v1/marketing/campaigns?limit=100`),
      api<Summary>(`/api/v1/marketing/campaigns/summary`),
    ]);
    if (listRes.success) setCampaigns(listRes.data || []);
    if (summaryRes.success) setSummary(summaryRes.data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteCampaign(id: string) {
    if (!confirm("Ștergi această campanie? Acțiunea nu poate fi anulată.")) return;
    const res = await api(`/api/v1/marketing/campaigns/${id}`, { method: "DELETE" });
    if (!res.success) {
      alert(res.error?.message || "Eroare");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Marketing
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Trimite newsletter-uri, promo-uri și mesaje de revenire către baza ta de clienți.
          </p>
        </div>
        <Link href="/marketing/new" className="btn-primary text-sm no-underline">
          + Campanie nouă
        </Link>
      </div>

      {summary && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden mb-6"
          style={{ background: "var(--border-hover)" }}
        >
          <KpiCard label="Ciorne" value={summary.drafts} />
          <KpiCard label="Programate" value={summary.scheduled} accent="#06B6D4" />
          <KpiCard label="Trimise" value={summary.sent} accent="#10B981" />
          <KpiCard label="Email-uri luna aceasta" value={summary.sentThisMonth} accent="#F59E0B" />
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio campanie încă.{" "}
            <Link href="/marketing/new" style={{ color: "var(--accent, #6366F1)" }}>
              Creează prima campanie →
            </Link>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="px-4 py-3 flex items-center gap-3 flex-wrap"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Link
                href={`/marketing/${c.id}`}
                className="flex-1 min-w-0 no-underline"
                style={{ color: "inherit" }}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    {c.name}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                    style={{
                      background: (STATUS_COLORS[c.status] || "#71717A") + "22",
                      color: STATUS_COLORS[c.status] || "#71717A",
                    }}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
                <div className="text-xs mb-1" style={{ color: "var(--text)", opacity: 0.85 }}>
                  {c.subject}
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {TARGET_LABELS[c.targetType] || c.targetType} ·{" "}
                  {c.status === "sent" || c.status === "sending"
                    ? `${c.totalSent}/${c.totalRecipients} trimise${c.totalFailed > 0 ? ` · ${c.totalFailed} eșuate` : ""}`
                    : c.status === "scheduled"
                      ? `Programată ${fmtDate(c.scheduledFor)}`
                      : `Creată ${fmtDate(c.createdAt)}`}
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/marketing/${c.id}`} className="btn-secondary text-xs no-underline">
                  {c.status === "draft" || c.status === "scheduled" ? "Editează" : "Vezi detalii"}
                </Link>
                {(c.status === "draft" || c.status === "scheduled" || c.status === "failed") && (
                  <button
                    onClick={() => deleteCampaign(c.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "#DC2626" }}
                    title="Șterge"
                  >
                    Șterge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="p-4" style={{ background: "var(--bg-surface)" }}>
      <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color: accent ?? "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
