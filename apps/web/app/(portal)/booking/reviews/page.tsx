"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /booking/reviews — admin moderation
//
// Lists reviews filtered by status (default: submitted).
// Actions per row: publish | hide | spam | feature toggle | reply.
// Shows aggregate stats on top (avg rating, distribution).
// ─────────────────────────────────────────────

interface Review {
  id: string;
  appointmentId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  serviceName: string | null;
  resourceName: string | null;
  rating: number | null;
  comment: string | null;
  status: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  isFeatured: boolean;
  showOnPublicSite: boolean;
  publishedAt: string | null;
  submittedAt: string | null;
  requestSentAt: string | null;
  createdAt: string;
}

interface Summary {
  total: number;
  submittedCount: number;
  publishedCount: number;
  pendingCount: number;
  avgRating: string;
  ratingCount: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Așteaptă răspuns",
  submitted: "De moderat",
  published: "Publicată",
  hidden: "Ascunsă",
  spam: "Spam",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94A3B8",
  submitted: "#F59E0B",
  published: "#10B981",
  hidden: "#71717A",
  spam: "#EF4444",
};

const TABS = [
  { href: "/booking", label: "Programări" },
  { href: "/booking/calendar", label: "Calendar" },
  { href: "/booking/services", label: "Servicii" },
  { href: "/booking/resources", label: "Personal & Spații" },
  { href: "/booking/availability", label: "Program" },
  { href: "/booking/customers", label: "Clienți" },
  { href: "/booking/reviews", label: "Recenzii" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ color: "#94A3B8", fontSize: 13 }}>—</span>;
  return (
    <span style={{ color: "#F59E0B", letterSpacing: 1, fontSize: 14 }}>
      {"★".repeat(rating)}
      <span style={{ color: "#CBD5E1" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("submitted");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter) params.append("status", statusFilter);
    const [listRes, summaryRes] = await Promise.all([
      api<Review[]>(`/api/v1/booking/reviews?${params}`),
      api<Summary>(`/api/v1/booking/reviews/summary`),
    ]);
    if (listRes.success) setReviews(listRes.data || []);
    if (summaryRes.success) setSummary(summaryRes.data || null);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await api(`/api/v1/booking/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.success) alert(res.error?.message || "Eroare");
    await load();
  }

  function startReply(r: Review) {
    setReplyingId(r.id);
    setReplyDraft(r.ownerReply || "");
  }

  async function saveReply(id: string) {
    await patch(id, { ownerReply: replyDraft || null });
    setReplyingId(null);
    setReplyDraft("");
  }

  const avg = summary ? Number(summary.avgRating) : 0;
  const totalRated = summary?.ratingCount || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Recenzii
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Mediază feedback-ul clienților și alege ce afișezi pe site.
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
              color: tab.href === "/booking/reviews" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/reviews" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/reviews" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Summary card */}
      {summary && (
        <div
          className="rounded-lg p-5 mb-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
                Rating mediu
              </div>
              <div className="text-3xl font-semibold" style={{ color: "#F59E0B" }}>
                {avg.toFixed(1)}
                <span style={{ fontSize: 16, color: "#94A3B8", fontWeight: 400 }}>/5</span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                din {totalRated} recenzii
              </div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
                De moderat
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#F59E0B" }}>
                {summary.submittedCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
                Publicate pe site
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#10B981" }}>
                {summary.publishedCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
                Distribuție
              </div>
              <div className="space-y-1 mt-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = (summary[`${["", "oneStar", "twoStars", "threeStars", "fourStars", "fiveStars"][stars]}` as keyof Summary] as number) || 0;
                  const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-[11px]">
                      <span style={{ width: 30, color: "var(--text-tertiary)" }}>{stars} ★</span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "var(--border)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ width: `${pct}%`, height: "100%", background: "#F59E0B" }} />
                      </div>
                      <span style={{ width: 24, textAlign: "right", color: "var(--text-tertiary)" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className="text-xs px-3 py-1.5 rounded-md"
            style={{
              background: statusFilter === k ? "var(--bg-hover)" : "transparent",
              color: statusFilter === k ? "var(--text)" : "var(--text-tertiary)",
              border: "1px solid",
              borderColor: statusFilter === k ? "var(--border)" : "transparent",
              fontWeight: statusFilter === k ? 500 : 400,
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setStatusFilter("")}
          className="text-xs px-3 py-1.5 rounded-md"
          style={{
            background: statusFilter === "" ? "var(--bg-hover)" : "transparent",
            color: statusFilter === "" ? "var(--text)" : "var(--text-tertiary)",
            fontWeight: statusFilter === "" ? 500 : 400,
            cursor: "pointer",
          }}
        >
          Toate
        </button>
      </div>

      {/* Reviews list */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio recenzie cu acest filtru.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="p-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3 mb-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                      {r.customerName || "Client anonim"}
                    </span>
                    <StarRow rating={r.rating} />
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium"
                      style={{
                        background: (STATUS_COLORS[r.status] || "#71717A") + "22",
                        color: STATUS_COLORS[r.status] || "#71717A",
                      }}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                    {r.isFeatured && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-medium"
                        style={{ background: "#FCD34D", color: "#92400E" }}
                      >
                        ★ Recomandat
                      </span>
                    )}
                  </div>
                  <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                    {r.serviceName ? `${r.serviceName} · ` : ""}
                    {r.resourceName ? `${r.resourceName} · ` : ""}
                    {r.submittedAt ? `trimisă ${fmtDate(r.submittedAt)}` : `solicitată ${fmtDate(r.requestSentAt)}`}
                  </div>
                </div>
              </div>

              {r.comment && (
                <p className="text-sm mb-3" style={{ color: "var(--text)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  „{r.comment}"
                </p>
              )}

              {/* Owner reply */}
              {r.ownerReply && replyingId !== r.id && (
                <div
                  className="rounded-md p-3 mb-3"
                  style={{ background: "var(--bg-hover)", borderLeft: "3px solid #6366F1" }}
                >
                  <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--text-tertiary)" }}>
                    Răspunsul tău
                  </div>
                  <p className="text-sm" style={{ color: "var(--text)", whiteSpace: "pre-wrap" }}>
                    {r.ownerReply}
                  </p>
                </div>
              )}

              {replyingId === r.id && (
                <div className="mb-3">
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Răspunsul tău (vizibil public pe site sub recenzie)"
                    className="input w-full text-sm"
                    style={{ resize: "vertical" }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => void saveReply(r.id)} className="btn-primary text-xs">
                      Salvează răspuns
                    </button>
                    <button
                      onClick={() => {
                        setReplyingId(null);
                        setReplyDraft("");
                      }}
                      className="btn-secondary text-xs"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {r.status === "submitted" && (
                  <button onClick={() => patch(r.id, { status: "published" })} className="btn-secondary text-xs" style={{ color: "#10B981" }}>
                    Publică
                  </button>
                )}
                {r.status === "published" && (
                  <button onClick={() => patch(r.id, { status: "hidden" })} className="btn-secondary text-xs">
                    Retrage
                  </button>
                )}
                {r.status === "hidden" && (
                  <button onClick={() => patch(r.id, { status: "published" })} className="btn-secondary text-xs" style={{ color: "#10B981" }}>
                    Publică
                  </button>
                )}
                {(r.status === "submitted" || r.status === "published") && (
                  <button
                    onClick={() => patch(r.id, { isFeatured: !r.isFeatured })}
                    className="btn-secondary text-xs"
                    style={{ color: r.isFeatured ? "#92400E" : undefined }}
                  >
                    {r.isFeatured ? "Scoate din recomandate" : "Recomandă"}
                  </button>
                )}
                {replyingId !== r.id && (
                  <button onClick={() => startReply(r)} className="btn-secondary text-xs">
                    {r.ownerReply ? "Editează răspuns" : "Răspunde"}
                  </button>
                )}
                {r.status !== "spam" && (
                  <button
                    onClick={() => patch(r.id, { status: "spam" })}
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ color: "#DC2626" }}
                  >
                    Marchează spam
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
