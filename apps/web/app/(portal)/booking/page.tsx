"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Appointment {
  appointment: {
    id: string;
    bookingCode: string;
    startAt: string;
    endAt: string;
    status: string;
    channel: string;
    priceSnapshot: string;
    currencySnapshot: string;
    paymentStatus: string;
    customerNote: string | null;
    internalNote: string | null;
  };
  customer: { id: string; firstName: string; lastName: string | null; email: string | null; phone: string | null };
  service: { id: string; name: string; durationMinutes: number; color: string };
  resource: { id: string; name: string; color: string };
}

interface Resource { id: string; name: string; type: string; color: string; isActive: boolean }
interface Service { id: string; name: string; durationMinutes: number; price: string; color: string; isActive: boolean }
interface Customer { id: string; firstName: string; lastName: string | null; email: string | null; phone: string | null }

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmat",
  checked_in: "Check-in",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
  no_show: "No-show",
  rescheduled: "Reprogramat",
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

function dateRange(scope: "today" | "tomorrow" | "week" | "month") {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (scope === "today") {
    end.setDate(end.getDate() + 1);
  } else if (scope === "tomorrow") {
    start.setDate(start.getDate() + 1);
    end.setDate(start.getDate() + 1);
  } else if (scope === "week") {
    end.setDate(end.getDate() + 7);
  } else if (scope === "month") {
    end.setMonth(end.getMonth() + 1);
  }

  return { from: start.toISOString(), to: end.toISOString() };
}

function formatRomanian(date: Date) {
  return date.toLocaleString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingPage() {
  const [scope, setScope] = useState<"today" | "tomorrow" | "week" | "month">("today");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    resourceId: "",
    serviceId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    note: "",
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, statusFilter]);

  async function load() {
    setLoading(true);
    const { from, to } = dateRange(scope);
    const params = new URLSearchParams({ from, to, limit: "100" });
    if (statusFilter) params.append("status", statusFilter);

    const [apptRes, resourceRes, serviceRes, customerRes] = await Promise.all([
      api(`/api/v1/booking/appointments?${params}`),
      api(`/api/v1/booking/resources?active=true`),
      api(`/api/v1/booking/services?active=true`),
      api(`/api/v1/booking/customers?limit=200`),
    ]);

    if (apptRes.success) setAppointments(apptRes.data || []);
    if (resourceRes.success) setResources(resourceRes.data || []);
    if (serviceRes.success) setServices(serviceRes.data || []);
    if (customerRes.success) setCustomers(customerRes.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.customerId || !form.resourceId || !form.serviceId) return;

    const startAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    const res = await api("/api/v1/booking/appointments", {
      method: "POST",
      body: JSON.stringify({
        customerId: form.customerId,
        resourceId: form.resourceId,
        serviceId: form.serviceId,
        startAt,
        status: "confirmed",
        channel: "admin",
        customerNote: form.note || undefined,
      }),
    });

    if (res.success) {
      setShowCreate(false);
      setForm({
        customerId: "",
        resourceId: "",
        serviceId: "",
        date: new Date().toISOString().slice(0, 10),
        time: "10:00",
        note: "",
      });
      await load();
    } else {
      alert(res.error?.message || "Eroare la creare programare");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await api(`/api/v1/booking/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi această programare?")) return;
    await api(`/api/v1/booking/appointments/${id}`, { method: "DELETE" });
    await load();
  }

  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.appointment.status === "confirmed").length;
    const pending = appointments.filter((a) => a.appointment.status === "pending").length;
    const revenue = appointments
      .filter((a) => ["confirmed", "checked_in", "in_progress", "completed"].includes(a.appointment.status))
      .reduce((acc, a) => acc + Number(a.appointment.priceSnapshot), 0);
    return { total, confirmed, pending, revenue };
  }, [appointments]);

  const emptyState = resources.length === 0 || services.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Programări
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Gestionează programările, serviciile și clienții pentru afacerea ta.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
          disabled={emptyState}
          style={{ opacity: emptyState ? 0.5 : 1 }}
        >
          + Programare nouă
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { href: "/booking", label: "Programări" },
          { href: "/booking/calendar", label: "Calendar" },
          { href: "/booking/services", label: "Servicii" },
          { href: "/booking/resources", label: "Personal & Spații" },
          { href: "/booking/availability", label: "Program" },
          { href: "/booking/customers", label: "Clienți" },
          { href: "/booking/reviews", label: "Recenzii" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md transition-colors no-underline"
            style={{
              color: tab.href === "/booking" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {emptyState && (
        <div
          className="rounded-lg p-8 mb-6 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-base font-medium mb-2" style={{ color: "var(--text)" }}>
            Începe configurarea
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Pentru a crea programări, configurează mai întâi cel puțin un membru de personal și un serviciu.
          </p>
          <div className="flex items-center justify-center gap-2">
            {resources.length === 0 && (
              <Link href="/booking/resources" className="btn-secondary text-xs no-underline">
                Adaugă personal
              </Link>
            )}
            {services.length === 0 && (
              <Link href="/booking/services" className="btn-secondary text-xs no-underline">
                Adaugă serviciu
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {!emptyState && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Programări" value={String(stats.total)} hint={`în ${scope === "today" ? "azi" : scope === "tomorrow" ? "mâine" : scope === "week" ? "săptămâna asta" : "luna asta"}`} />
          <StatCard label="Confirmate" value={String(stats.confirmed)} accent="#10B981" />
          <StatCard label="În așteptare" value={String(stats.pending)} accent="#F59E0B" />
          <StatCard label="Estimat încasări" value={`${stats.revenue.toFixed(2)} RON`} accent="#6366F1" />
        </div>
      )}

      {/* Filters */}
      {!emptyState && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--bg-surface)" }}>
            {[
              { v: "today", label: "Azi" },
              { v: "tomorrow", label: "Mâine" },
              { v: "week", label: "Săptămâna" },
              { v: "month", label: "Luna" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setScope(opt.v as "today" | "tomorrow" | "week" | "month")}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{
                  color: scope === opt.v ? "var(--text)" : "var(--text-tertiary)",
                  background: scope === opt.v ? "var(--bg)" : "transparent",
                  fontWeight: scope === opt.v ? 500 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs"
            style={{ width: 160 }}
          >
            <option value="">Toate statusurile</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Appointments list */}
      {!emptyState && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              Se încarcă…
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              Nu sunt programări în intervalul selectat.
            </div>
          ) : (
            <div>
              {appointments.map(({ appointment, customer, service, resource }) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div
                    className="w-1 h-12 rounded-full shrink-0"
                    style={{ background: service.color || resource.color || "#6366F1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                        {customer.firstName}
                        {customer.lastName ? ` ${customer.lastName}` : ""}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          background: (STATUS_COLORS[appointment.status] || "#71717A") + "22",
                          color: STATUS_COLORS[appointment.status] || "#71717A",
                        }}
                      >
                        {STATUS_LABELS[appointment.status]}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                      >
                        {appointment.bookingCode}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {service.name} · {service.durationMinutes} min · {resource.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {formatRomanian(new Date(appointment.startAt))}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      {Number(appointment.priceSnapshot).toFixed(2)} {appointment.currencySnapshot}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {appointment.channel}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {appointment.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange(appointment.id, "confirmed")}
                        className="btn-secondary text-xs"
                      >
                        Confirmă
                      </button>
                    )}
                    {appointment.status === "confirmed" && (
                      <button
                        onClick={() => handleStatusChange(appointment.id, "completed")}
                        className="btn-secondary text-xs"
                      >
                        Finalizează
                      </button>
                    )}
                    {!["cancelled", "completed", "no_show"].includes(appointment.status) && (
                      <button
                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Anulează
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="text-xs p-1.5 rounded transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      title="Șterge"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Programare nouă
            </h2>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                  Client
                </span>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">Alege client…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName}
                      {c.lastName ? ` ${c.lastName}` : ""}
                      {c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                  Serviciu
                </span>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">Alege serviciu…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min) — {Number(s.price).toFixed(2)} RON
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                  Personal / Resursă
                </span>
                <select
                  value={form.resourceId}
                  onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">Alege personal…</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                    Data
                  </span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input w-full text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                    Ora
                  </span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="input w-full text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
                  Notă (opțional)
                </span>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.customerId || !form.serviceId || !form.resourceId}
                className="btn-primary text-sm"
                style={{
                  opacity: !form.customerId || !form.serviceId || !form.resourceId ? 0.5 : 1,
                }}
              >
                Programează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
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
      {hint && (
        <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
