"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface BookingDetail {
  bookingCode: string;
  startAt: string;
  endAt: string;
  status: string;
  serviceName: string;
  resourceName: string;
  durationMinutes: number;
  price: string;
  currency: string;
  customerFirstName: string;
  customerLastName: string | null;
  cancellationReason: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  checked_in: "Check-in făcut",
  in_progress: "În desfășurare",
  completed: "Finalizată",
  cancelled: "Anulată",
  no_show: "Neprezentare",
  rescheduled: "Reprogramată",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  checked_in: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#52525B",
  cancelled: "#EF4444",
  no_show: "#EF4444",
  rescheduled: "#06B6D4",
};

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const MONTH_NAMES = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

function formatDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface RescheduleSlot {
  startAt: string;
  endAt: string;
}

function toDateInputValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookingLookupPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Reschedule state
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>(toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  useEffect(() => {
    if (!code) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/booking/lookup?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBooking(json.data);
        setError(null);
      } else {
        setError(json.error?.message || "Programarea nu a fost găsită");
      }
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    }
    setLoading(false);
  }

  async function confirmCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/booking/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason: cancelReason || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCancelDialog(false);
        setCancelSuccess(true);
        await load();
      } else {
        alert(json.error?.message || "Eroare la anulare");
      }
    } catch {
      alert("Eroare de rețea. Te rugăm încearcă din nou.");
    }
    setCancelling(false);
  }

  async function loadRescheduleSlots(date: string) {
    setRescheduleSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/public/booking/reschedule-slots?code=${encodeURIComponent(code)}&date=${encodeURIComponent(date)}`,
      );
      const json = await res.json();
      setRescheduleSlots(json.success && Array.isArray(json.data) ? json.data : []);
    } catch {
      setRescheduleSlots([]);
    }
    setRescheduleSlotsLoading(false);
  }

  function openReschedule() {
    setShowRescheduleDialog(true);
    setSelectedSlot(null);
    setRescheduleSuccess(false);
    void loadRescheduleSlots(rescheduleDate);
  }

  async function confirmReschedule() {
    if (!selectedSlot) return;
    setRescheduling(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/booking/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newStartAt: selectedSlot }),
      });
      const json = await res.json();
      if (json.success) {
        setShowRescheduleDialog(false);
        setRescheduleSuccess(true);
        await load();
      } else {
        alert(json.error?.message || "Eroare la reprogramare");
      }
    } catch {
      alert("Eroare de rețea. Te rugăm încearcă din nou.");
    }
    setRescheduling(false);
  }

  if (loading) {
    return (
      <PageShell>
        <p style={{ textAlign: "center", color: "#64748B", padding: 32 }}>Se încarcă…</p>
      </PageShell>
    );
  }

  if (error || !booking) {
    return (
      <PageShell>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>
            Programare negăsită
          </h1>
          <p style={{ color: "#64748B", marginBottom: 16 }}>{error || "Verifică codul introdus."}</p>
          <p style={{ fontSize: "0.8rem", color: "#64748B" }}>
            Codul de programare are 8 caractere (litere și cifre).
          </p>
        </div>
      </PageShell>
    );
  }

  const startAt = new Date(booking.startAt);
  const isPast = startAt.getTime() < Date.now();
  const canCancel = ["pending", "confirmed"].includes(booking.status) && !isPast;
  const hoursBefore = (startAt.getTime() - Date.now()) / (60 * 60 * 1000);
  const cancelTooLate = hoursBefore < 2 && hoursBefore > 0;

  return (
    <PageShell>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 6,
            background: (STATUS_COLORS[booking.status] || "#71717A") + "22",
            color: STATUS_COLORS[booking.status] || "#71717A",
            fontSize: "0.75rem",
            fontWeight: 600,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {STATUS_LABELS[booking.status] || booking.status}
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            color: "#0F172A",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Salut, {booking.customerFirstName}!
        </h1>
        <p style={{ color: "#64748B", marginTop: 4 }}>
          {booking.status === "cancelled"
            ? "Programarea ta a fost anulată."
            : isPast && booking.status === "completed"
              ? "Mulțumim că ne-ai vizitat!"
              : isPast
                ? "Programarea ta s-a încheiat."
                : "Detaliile programării tale"}
        </p>
      </div>

      {cancelSuccess && (
        <div
          style={{
            background: "#D1FAE5",
            color: "#065F46",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          ✓ Programarea a fost anulată. Vei primi un email de confirmare.
        </div>
      )}

      {rescheduleSuccess && (
        <div
          style={{
            background: "#DBEAFE",
            color: "#1E40AF",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          ✓ Programarea a fost reprogramată. Vei primi un email cu noua dată și oră.
        </div>
      )}

      <div
        style={{
          background: "#F8FAFC",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <DetailRow label="Cod">
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem" }}>
            {booking.bookingCode}
          </span>
        </DetailRow>
        <DetailRow label="Serviciu">{booking.serviceName}</DetailRow>
        <DetailRow label="Personal">{booking.resourceName}</DetailRow>
        <DetailRow label="Data">{formatDate(startAt)}</DetailRow>
        <DetailRow label="Ora">
          {formatTime(startAt)} – {formatTime(new Date(booking.endAt))}
        </DetailRow>
        <DetailRow label="Durată">{booking.durationMinutes} minute</DetailRow>
        <DetailRow label="Preț" last>
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {Number(booking.price).toFixed(2)} {booking.currency}
          </span>
        </DetailRow>
      </div>

      {booking.cancellationReason && booking.status === "cancelled" && (
        <div
          style={{
            background: "#FEF3C7",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: "0.85rem",
            color: "#92400E",
          }}
        >
          <strong>Motiv anulare:</strong> {booking.cancellationReason}
        </div>
      )}

      {canCancel && !cancelTooLate && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={openReschedule}
            style={{
              width: "100%",
              padding: 14,
              background: "#6366F1",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reprogramează
          </button>
          <button
            onClick={() => setShowCancelDialog(true)}
            style={{
              width: "100%",
              padding: 14,
              background: "transparent",
              color: "#EF4444",
              border: "1px solid #EF4444",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Anulează programarea
          </button>
        </div>
      )}

      {canCancel && cancelTooLate && (
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.8rem" }}>
          Anularea sau reprogramarea online se face cu min. 2h înainte. Sună-ne direct.
        </p>
      )}

      {showRescheduleDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 100,
          }}
          onClick={() => setShowRescheduleDialog(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: 24,
              borderRadius: 12,
              maxWidth: 480,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              fontFamily: "system-ui, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>
              Reprogramează
            </h2>
            <p style={{ color: "#64748B", marginBottom: 16, fontSize: "0.9rem" }}>
              {booking.serviceName} cu {booking.resourceName}. Alege o altă dată și oră.
            </p>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "#0F172A" }}>
                Data
              </span>
              <input
                type="date"
                value={rescheduleDate}
                min={toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  void loadRescheduleSlots(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                }}
              />
            </label>

            <div style={{ marginBottom: 16 }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, color: "#0F172A" }}>
                Ore disponibile
              </span>
              {rescheduleSlotsLoading ? (
                <p style={{ color: "#94A3B8", fontSize: "0.85rem", textAlign: "center", padding: 16 }}>Se încarcă…</p>
              ) : rescheduleSlots.length === 0 ? (
                <p style={{ color: "#94A3B8", fontSize: "0.85rem", textAlign: "center", padding: 16 }}>
                  Nu sunt ore disponibile în această zi. Încearcă altă dată.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: 8,
                  }}
                >
                  {rescheduleSlots.map((slot) => {
                    const time = formatTime(new Date(slot.startAt));
                    const isSelected = selectedSlot === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startAt)}
                        style={{
                          padding: "10px 8px",
                          border: isSelected ? "2px solid #6366F1" : "1px solid #CBD5E1",
                          background: isSelected ? "#EEF2FF" : "#FFFFFF",
                          color: isSelected ? "#3730A3" : "#0F172A",
                          borderRadius: 8,
                          fontFamily: "inherit",
                          fontSize: "0.85rem",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRescheduleDialog(false)}
                disabled={rescheduling}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Înapoi
              </button>
              <button
                onClick={confirmReschedule}
                disabled={rescheduling || !selectedSlot}
                style={{
                  padding: "10px 16px",
                  background: "#6366F1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: rescheduling || !selectedSlot ? "not-allowed" : "pointer",
                  opacity: rescheduling || !selectedSlot ? 0.5 : 1,
                }}
              >
                {rescheduling ? "Se reprogramează…" : "Confirmă reprogramarea"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 100,
          }}
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: 24,
              borderRadius: 12,
              maxWidth: 440,
              width: "100%",
              fontFamily: "system-ui, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>
              Anulezi programarea?
            </h2>
            <p style={{ color: "#64748B", marginBottom: 16, fontSize: "0.9rem" }}>
              {booking.serviceName} pe {formatDate(startAt)} la {formatTime(startAt)} va fi anulată.
            </p>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "#0F172A" }}>
                Motiv (opțional)
              </span>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="ex. apariție urgență..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  resize: "vertical",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Înapoi
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                style={{
                  padding: "10px 16px",
                  background: "#EF4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "Se anulează…" : "Da, anulează"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F5F9",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "32px 16px",
        color: "#0F172A",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {children}
        </div>
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "0.75rem",
            marginTop: 16,
          }}
        >
          Powered by <strong>OpenPortal</strong>
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: last ? "none" : "1px solid #E2E8F0",
        fontSize: "0.9rem",
      }}
    >
      <span style={{ color: "#64748B" }}>{label}</span>
      <span style={{ color: "#0F172A", fontWeight: 500 }}>{children}</span>
    </div>
  );
}
