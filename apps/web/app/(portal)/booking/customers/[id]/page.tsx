"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /booking/customers/[id] — customer profile with lifetime stats,
// appointment history, invoice history.
// ─────────────────────────────────────────────

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  language: string;
  notes: string | null;
  tags: string[];
  marketingConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  createdAt: string;
}

interface FavoriteService {
  id: string;
  name: string;
  color: string;
  count: number;
  revenue: number;
}

interface Stats {
  totalAppointments: number;
  completed: number;
  upcoming: number;
  cancelled: number;
  noShows: number;
  noShowRate: number;
  totalSpent: string;
  lifetimeValue: string;
  avgSpend: string;
  avgDaysBetweenVisits: number | null;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  favoriteServices: FavoriteService[];
  outstandingInvoiced: string;
}

interface AppointmentRow {
  id: string;
  bookingCode: string;
  startAt: string;
  endAt: string;
  status: string;
  channel: string;
  priceSnapshot: string;
  currencySnapshot: string;
  paymentStatus: string;
  serviceId: string;
  serviceName: string;
  serviceColor: string | null;
  serviceDuration: number;
  resourceId: string;
  resourceName: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

interface InvoiceRow {
  id: string;
  documentNumber: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: string;
  totalPaid: string;
  amountDue: string;
  currency: string;
  type: string;
}

interface ProfileResponse {
  customer: Customer;
  stats: Stats;
  appointments: AppointmentRow[];
  invoices: InvoiceRow[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmat",
  checked_in: "Check-in",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
  no_show: "No-show",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  checked_in: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#52525B",
  cancelled: "#EF4444",
  no_show: "#EF4444",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  issued: "Emisă",
  sent: "Trimisă",
  viewed: "Vizualizată",
  partially_paid: "Plătită parțial",
  paid: "Plătită",
  overdue: "Restantă",
  cancelled: "Anulată",
  void: "Stornată",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(value: string | number, currency = "RON"): string {
  const n = Number(value);
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await api<ProfileResponse>(`/api/v1/booking/customers/${id}/profile`);
    if (res.success && res.data) {
      setProfile(res.data);
      setNoteDraft(res.data.customer.notes ?? "");
    } else {
      setError(res.error?.message ?? "Eroare la încărcare");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveNote() {
    if (!id) return;
    setSavingNote(true);
    await api(`/api/v1/booking/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes: noteDraft || null }),
    });
    setSavingNote(false);
    await load();
  }

  if (!id) return null;
  if (loading) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  }
  if (error || !profile) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        {error || "Client inexistent"}.{" "}
        <Link href="/booking/customers" style={{ color: "var(--accent, #6366F1)" }}>
          Înapoi la listă
        </Link>
      </div>
    );
  }

  const { customer, stats, appointments, invoices } = profile;
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/booking/customers" className="text-xs no-underline" style={{ color: "var(--text-tertiary)" }}>
          ← Înapoi la clienți
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            {fullName}
          </h1>
          <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.email && <span>✉️ {customer.email}</span>}
            <span>Client din {fmtDate(customer.createdAt)}</span>
          </div>
          {customer.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {customer.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/booking?customerId=${customer.id}`}
            className="btn-primary text-sm no-underline"
          >
            + Programare nouă
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden mb-6"
        style={{ background: "var(--border-hover)" }}
      >
        <Metric label="Vizite finalizate" value={String(stats.completed)} sub={`${stats.upcoming} viitoare`} />
        <Metric label="Total cheltuit" value={fmtMoney(stats.totalSpent)} sub={`Medie: ${fmtMoney(stats.avgSpend)}`} />
        <Metric
          label="Frecvență"
          value={stats.avgDaysBetweenVisits != null ? `~${stats.avgDaysBetweenVisits} zile` : "—"}
          sub={stats.lastVisitAt ? `Ultima: ${fmtDate(stats.lastVisitAt)}` : "Niciuna încă"}
        />
        <Metric
          label="No-show rate"
          value={`${Math.round(stats.noShowRate * 100)}%`}
          sub={`${stats.noShows} din ${stats.totalAppointments}`}
          accent={stats.noShowRate > 0.1 ? "#DC2626" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Notes */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
            Note interne
          </h2>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
            Vizibile doar ție. Bun pentru alergii, preferințe, observații.
          </p>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={5}
            className="input w-full text-sm"
            placeholder="Ex: Preferă cafeaua fără zahăr. Alergie la parfum."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {(noteDraft || "").length}/2000
            </span>
            <button
              onClick={saveNote}
              disabled={savingNote || noteDraft === (customer.notes ?? "")}
              className="btn-secondary text-xs"
              style={{ opacity: savingNote || noteDraft === (customer.notes ?? "") ? 0.5 : 1 }}
            >
              {savingNote ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </div>

        {/* Favorite services */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Servicii preferate
          </h2>
          {stats.favoriteServices.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Niciun serviciu finalizat încă.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.favoriteServices.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0 text-sm" style={{ color: "var(--text)" }}>
                    {s.name}
                  </div>
                  <div className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {s.count}× · {fmtMoney(s.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consents + billing */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Comunicare & financiar
          </h2>
          <div className="space-y-2 text-xs">
            <ConsentRow label="Reminder SMS" enabled={customer.smsConsent} />
            <ConsentRow label="Reminder email" enabled={customer.emailConsent} />
            <ConsentRow label="Marketing" enabled={customer.marketingConsent} />
          </div>
          {Number(stats.outstandingInvoiced) > 0 && (
            <div
              className="rounded-md p-2 mt-3 text-xs"
              style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              Datorează: <strong>{fmtMoney(stats.outstandingInvoiced)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Appointment history */}
      <div className="rounded-lg overflow-hidden mb-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Istoric programări ({appointments.length})
          </h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio programare încă.
          </div>
        ) : (
          appointments.slice(0, 50).map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 flex items-center gap-3 flex-wrap"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: a.serviceColor ?? "#6366F1",
                  flexShrink: 0,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {a.serviceName} · {a.resourceName}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmtDateTime(a.startAt)} · {a.serviceDuration} min · cod {a.bookingCode}
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={{
                  background: (STATUS_COLORS[a.status] || "#71717A") + "22",
                  color: STATUS_COLORS[a.status] || "#71717A",
                }}
              >
                {STATUS_LABELS[a.status] || a.status}
              </span>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {fmtMoney(a.priceSnapshot, a.currencySnapshot)}
                </div>
                {a.paymentStatus !== "fully_paid" && a.paymentStatus !== "unpaid" && (
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {a.paymentStatus}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice history */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Facturi ({invoices.length})
          </h2>
          <Link href="/billing" className="text-xs no-underline" style={{ color: "var(--text-tertiary)" }}>
            Toate facturile →
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio factură emisă către acest client.
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-mono" style={{ color: "var(--text)" }}>
                  {inv.documentNumber}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmtDate(inv.issueDate)}
                  {inv.dueDate ? ` · scadență ${fmtDate(inv.dueDate)}` : ""}
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded"
                style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
              >
                {INVOICE_STATUS_LABELS[inv.status] || inv.status}
              </span>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {fmtMoney(inv.totalAmount, inv.currency)}
                </div>
                {Number(inv.amountDue) > 0 && (
                  <div className="text-[10px]" style={{ color: "#DC2626" }}>
                    Rest: {fmtMoney(inv.amountDue, inv.currency)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="p-4" style={{ background: "var(--bg-surface)" }}>
      <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-xl font-semibold" style={{ color: accent ?? "var(--text)" }}>
        {value}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
        {sub}
      </div>
    </div>
  );
}

function ConsentRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--text)" }}>{label}</span>
      <span
        className="text-[10px] px-2 py-0.5 rounded"
        style={{
          background: enabled ? "#D1FAE5" : "#FEE2E2",
          color: enabled ? "#065F46" : "#991B1B",
        }}
      >
        {enabled ? "DA" : "NU"}
      </span>
    </div>
  );
}
