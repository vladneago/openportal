"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
    customerNote: string | null;
    internalNote: string | null;
    resourceId: string;
    serviceId: string;
  };
  customer: { id: string; firstName: string; lastName: string | null; phone: string | null; email: string | null };
  service: { id: string; name: string; durationMinutes: number; color: string };
  resource: { id: string; name: string; color: string };
}

interface Resource {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

const TABS = [
  { href: "/booking", label: "Programări" },
  { href: "/booking/calendar", label: "Calendar" },
  { href: "/booking/services", label: "Servicii" },
  { href: "/booking/resources", label: "Personal & Spații" },
  { href: "/booking/availability", label: "Program" },
  { href: "/booking/customers", label: "Clienți" },
  { href: "/booking/reviews", label: "Recenzii" },
];

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

const DAYS_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const DAYS_SHORT = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7;
const END_HOUR = 22;

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  // Make Monday = day 0
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type ViewMode = "week" | "day";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const days = useMemo(() => {
    if (viewMode === "day") return [new Date(currentDate)];
    const monday = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [currentDate, viewMode]);

  const rangeStart = days[0];
  const rangeEnd = useMemo(() => {
    const d = new Date(days[days.length - 1]);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [days]);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime(), resourceFilter]);

  async function loadResources() {
    const res = await api(`/api/v1/booking/resources?active=true`);
    if (res.success) setResources((res.data as Resource[]) || []);
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
      limit: "500",
    });
    if (resourceFilter) params.append("resourceId", resourceFilter);
    const res = await api(`/api/v1/booking/appointments?${params}`);
    if (res.success) setAppointments((res.data as Appointment[]) || []);
    setLoading(false);
  }

  function prev() {
    const next = new Date(currentDate);
    if (viewMode === "week") next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  }

  function next() {
    const n = new Date(currentDate);
    if (viewMode === "week") n.setDate(n.getDate() + 7);
    else n.setDate(n.getDate() + 1);
    setCurrentDate(n);
  }

  function today() {
    setCurrentDate(new Date());
  }

  async function setStatus(id: string, status: string) {
    await api(`/api/v1/booking/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setSelectedAppt(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi această programare?")) return;
    await api(`/api/v1/booking/appointments/${id}`, { method: "DELETE" });
    setSelectedAppt(null);
    await load();
  }

  // Group appointments by day for rendering
  const apptsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const start = new Date(a.appointment.startAt);
      const key = start.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [appointments]);

  const totalHours = END_HOUR - START_HOUR;

  // Scroll initially to 8:00
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = HOUR_HEIGHT * 1; // 8:00 (one hour after START_HOUR=7)
    }
  }, []);

  const rangeLabel = useMemo(() => {
    if (viewMode === "day") {
      return rangeStart.toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const last = days[days.length - 1];
    if (rangeStart.getMonth() === last.getMonth()) {
      return `${rangeStart.getDate()} – ${last.getDate()} ${rangeStart.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}`;
    }
    return `${rangeStart.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} – ${last.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [rangeStart, days, viewMode]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Calendar
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Vedere săptămânală sau zilnică a programărilor.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/booking/calendar" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/calendar" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/calendar" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={prev} className="btn-secondary text-xs px-2 py-1.5" title="Înapoi">
          ←
        </button>
        <button onClick={today} className="btn-secondary text-xs">
          Azi
        </button>
        <button onClick={next} className="btn-secondary text-xs px-2 py-1.5" title="Înainte">
          →
        </button>
        <div className="font-medium text-sm ml-2" style={{ color: "var(--text)" }}>
          {rangeLabel}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--bg-surface)" }}>
            <button
              onClick={() => setViewMode("week")}
              className="text-xs px-3 py-1 rounded"
              style={{
                color: viewMode === "week" ? "var(--text)" : "var(--text-tertiary)",
                background: viewMode === "week" ? "var(--bg)" : "transparent",
                fontWeight: viewMode === "week" ? 500 : 400,
              }}
            >
              Săptămână
            </button>
            <button
              onClick={() => setViewMode("day")}
              className="text-xs px-3 py-1 rounded"
              style={{
                color: viewMode === "day" ? "var(--text)" : "var(--text-tertiary)",
                background: viewMode === "day" ? "var(--bg)" : "transparent",
                fontWeight: viewMode === "day" ? 500 : 400,
              }}
            >
              Zi
            </button>
          </div>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="input text-xs"
            style={{ width: 200 }}
          >
            <option value="">Toate resursele</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Day headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `60px repeat(${days.length}, 1fr)`,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div /> {/* spacer for time column */}
          {days.map((d) => {
            const isToday = sameDay(d, new Date());
            return (
              <div
                key={d.toISOString()}
                className="px-2 py-2 text-center"
                style={{
                  borderLeft: "1px solid var(--border)",
                  background: isToday ? "var(--bg-hover)" : "transparent",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {DAYS_SHORT[d.getDay()]}
                </div>
                <div
                  className="text-base font-semibold"
                  style={{
                    color: isToday ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body — scrollable hour slots */}
        <div
          ref={gridRef}
          className="grid relative"
          style={{
            gridTemplateColumns: `60px repeat(${days.length}, 1fr)`,
            maxHeight: 700,
            overflowY: "auto",
          }}
        >
          {/* Time column */}
          <div className="relative" style={{ height: totalHours * HOUR_HEIGHT }}>
            {Array.from({ length: totalHours + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute right-1 text-[10px]"
                style={{
                  top: i * HOUR_HEIGHT - 6,
                  color: "var(--text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(START_HOUR + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const dayAppts = apptsByDay.get(key) || [];
            return (
              <div
                key={d.toISOString()}
                className="relative"
                style={{
                  height: totalHours * HOUR_HEIGHT,
                  borderLeft: "1px solid var(--border)",
                }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: totalHours + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0"
                    style={{
                      top: i * HOUR_HEIGHT,
                      borderTop: "1px solid var(--border)",
                      opacity: 0.5,
                    }}
                  />
                ))}

                {/* Appointments */}
                {dayAppts.map((a) => {
                  const start = new Date(a.appointment.startAt);
                  const end = new Date(a.appointment.endAt);
                  const startMinutes =
                    (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                  const durationMinutes =
                    (end.getTime() - start.getTime()) / 60_000;
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT - 2);

                  if (top + height < 0 || top > totalHours * HOUR_HEIGHT) return null;

                  const color = a.service.color || a.resource.color || "#6366F1";
                  const isCancelled = a.appointment.status === "cancelled" || a.appointment.status === "no_show";

                  return (
                    <button
                      key={a.appointment.id}
                      onClick={() => setSelectedAppt(a)}
                      className="absolute left-1 right-1 rounded text-left p-1.5 transition-shadow hover:shadow-md"
                      style={{
                        top,
                        height,
                        background: color + "22",
                        borderLeft: `3px solid ${color}`,
                        opacity: isCancelled ? 0.55 : 1,
                        textDecoration: isCancelled ? "line-through" : "none",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="text-[10px] font-medium leading-tight"
                        style={{ color: "var(--text)" }}
                      >
                        {formatTime(start)}
                      </div>
                      <div
                        className="text-[11px] font-semibold leading-tight"
                        style={{ color: "var(--text)" }}
                      >
                        {a.customer.firstName}
                        {a.customer.lastName ? ` ${a.customer.lastName[0]}.` : ""}
                      </div>
                      {height > 38 && (
                        <div
                          className="text-[10px] leading-tight mt-0.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {a.service.name}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
        <span>Status:</span>
        {Object.entries(STATUS_LABELS).slice(0, 6).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: STATUS_COLORS[k] }}
            />
            {v}
          </span>
        ))}
        {loading && <span style={{ marginLeft: "auto", color: "var(--text-tertiary)" }}>Se încarcă…</span>}
      </div>

      {/* Appointment detail modal */}
      {selectedAppt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedAppt(null)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-mono mb-1" style={{ color: "var(--text-tertiary)" }}>
                  {selectedAppt.appointment.bookingCode}
                </div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {selectedAppt.customer.firstName}
                  {selectedAppt.customer.lastName ? ` ${selectedAppt.customer.lastName}` : ""}
                </h2>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: (STATUS_COLORS[selectedAppt.appointment.status] || "#71717A") + "22",
                  color: STATUS_COLORS[selectedAppt.appointment.status] || "#71717A",
                }}
              >
                {STATUS_LABELS[selectedAppt.appointment.status]}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Serviciu</span>
                <span style={{ color: "var(--text)" }}>{selectedAppt.service.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Personal</span>
                <span style={{ color: "var(--text)" }}>{selectedAppt.resource.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Când</span>
                <span style={{ color: "var(--text)" }}>
                  {new Date(selectedAppt.appointment.startAt).toLocaleString("ro-RO", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Durată</span>
                <span style={{ color: "var(--text)" }}>{selectedAppt.service.durationMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Preț</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>
                  {Number(selectedAppt.appointment.priceSnapshot).toFixed(2)} {selectedAppt.appointment.currencySnapshot}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Sursă</span>
                <span style={{ color: "var(--text)" }}>{selectedAppt.appointment.channel}</span>
              </div>
              {selectedAppt.customer.phone && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-tertiary)" }}>Telefon</span>
                  <a
                    href={`tel:${selectedAppt.customer.phone}`}
                    style={{ color: "var(--accent)" }}
                  >
                    {selectedAppt.customer.phone}
                  </a>
                </div>
              )}
              {selectedAppt.appointment.customerNote && (
                <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                    Notă client
                  </div>
                  <div style={{ color: "var(--text)" }}>{selectedAppt.appointment.customerNote}</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {selectedAppt.appointment.status === "pending" && (
                <button
                  onClick={() => setStatus(selectedAppt.appointment.id, "confirmed")}
                  className="btn-primary text-xs"
                >
                  Confirmă
                </button>
              )}
              {selectedAppt.appointment.status === "confirmed" && (
                <button
                  onClick={() => setStatus(selectedAppt.appointment.id, "checked_in")}
                  className="btn-secondary text-xs"
                >
                  Check-in
                </button>
              )}
              {selectedAppt.appointment.status === "checked_in" && (
                <button
                  onClick={() => setStatus(selectedAppt.appointment.id, "in_progress")}
                  className="btn-secondary text-xs"
                >
                  Start serviciu
                </button>
              )}
              {selectedAppt.appointment.status === "in_progress" && (
                <button
                  onClick={() => setStatus(selectedAppt.appointment.id, "completed")}
                  className="btn-primary text-xs"
                >
                  Finalizează
                </button>
              )}
              {!["cancelled", "completed", "no_show"].includes(selectedAppt.appointment.status) && (
                <>
                  <button
                    onClick={() => setStatus(selectedAppt.appointment.id, "cancelled")}
                    className="text-xs px-3 py-1.5 rounded-md"
                    style={{ color: "#EF4444" }}
                  >
                    Anulează
                  </button>
                  <button
                    onClick={() => setStatus(selectedAppt.appointment.id, "no_show")}
                    className="text-xs px-3 py-1.5 rounded-md"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    No-show
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(selectedAppt.appointment.id)}
                className="text-xs px-2 py-1.5 rounded-md ml-auto"
                style={{ color: "var(--text-tertiary)" }}
                title="Șterge"
              >
                ✕
              </button>
              <button
                onClick={() => setSelectedAppt(null)}
                className="btn-secondary text-xs"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
