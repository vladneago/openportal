"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// ─────────────────────────────────────────────
// /r/[token] — public review submission page
//
// No auth required; the token IS the auth. One-shot:
//   - GET to verify the token + show what's being reviewed
//   - POST to submit rating + comment
//
// After submit, show a thank-you screen.
// ─────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ReviewInfo {
  review: {
    id: string;
    status: string;
    rating: number | null;
    comment: string | null;
    customerName: string | null;
    serviceName: string | null;
    resourceName: string | null;
    submittedAt: string | null;
  };
  tenant: { name: string; primaryColor: string | null } | null;
  alreadySubmitted: boolean;
}

export default function ReviewSubmitPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/reviews/by-token/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Link invalid sau expirat");
      } else {
        setInfo(data.data);
        if (data.data.alreadySubmitted) setSubmitted(true);
        if (data.data.review.rating) setRating(data.data.review.rating);
        if (data.data.review.comment) setComment(data.data.review.comment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!token || rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/reviews/by-token/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Eroare la trimitere");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const color = info?.tenant?.primaryColor || "#6366F1";
  const businessName = info?.tenant?.name || "afacere";

  if (loading) {
    return (
      <Wrapper color={color}>
        <p style={{ color: "#64748B", textAlign: "center" }}>Se încarcă…</p>
      </Wrapper>
    );
  }

  if (error && !info) {
    return (
      <Wrapper color={color}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Link invalid</h1>
        <p style={{ color: "#64748B", marginBottom: 0 }}>{error}</p>
      </Wrapper>
    );
  }

  if (submitted) {
    return (
      <Wrapper color={color}>
        <div style={{ fontSize: 56, textAlign: "center", marginBottom: 12 }}>✨</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Mulțumim!</h1>
        <p style={{ color: "#475569", textAlign: "center", marginBottom: 12, lineHeight: 1.55 }}>
          Recenzia ta a ajuns la {businessName}. Ne ajută enorm să ne îmbunătățim.
        </p>
        {info?.review.rating && (
          <p style={{ textAlign: "center", fontSize: 28, letterSpacing: 2 }}>{"★".repeat(info.review.rating)}{"☆".repeat(5 - info.review.rating)}</p>
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper color={color}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cum a fost?</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Vizita ta la <strong style={{ color: "#0F172A" }}>{businessName}</strong>
        {info?.review.serviceName ? ` pentru ${info.review.serviceName}` : ""}
        {info?.review.resourceName ? ` cu ${info.review.resourceName}` : ""}.
      </p>

      {/* Star rating */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = (hoverRating || rating) >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} stele`}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: 44,
                color: filled ? "#F59E0B" : "#CBD5E1",
                lineHeight: 1,
                transition: "transform 0.1s ease",
                transform: filled ? "scale(1.02)" : "scale(1)",
              }}
            >
              ★
            </button>
          );
        })}
      </div>

      {/* Comment */}
      <label
        htmlFor="comment"
        style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}
      >
        Ce ți-a plăcut? Ce am putea îmbunătăți?
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Opțional — scrie câteva cuvinte despre experiența ta."
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #CBD5E1",
          borderRadius: 8,
          fontSize: 14,
          resize: "vertical",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "right" }}>{comment.length}/2000</div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#FEF2F2",
            color: "#991B1B",
            border: "1px solid #FECACA",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={rating < 1 || submitting}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "13px 16px",
          background: rating < 1 || submitting ? "#CBD5E1" : color,
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: rating < 1 || submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Se trimite…" : "Trimite recenzia"}
      </button>

      <p style={{ marginTop: 16, fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
        Recenzia poate fi afișată public pe site-ul {businessName} după aprobare.
      </p>
    </Wrapper>
  );
}

function Wrapper({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(140deg, #F8FAFC 0%, #FFFFFF 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: color,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          marginBottom: 18,
          boxShadow: `0 8px 22px ${color}40`,
        }}
      >
        ★
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
          border: "1px solid #E2E8F0",
        }}
      >
        {children}
      </div>
      <p style={{ marginTop: 20, fontSize: 11, color: "#94A3B8" }}>Powered by OpenPortal</p>
    </div>
  );
}
