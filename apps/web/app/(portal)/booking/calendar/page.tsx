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
const SNAP_MINUTES = 15;
const DRAG_THRESHOLD_PX = 4;

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

interface DragState {
  apptId: string;
  originalStartMs: number;
  durationMin: number;
  originalDayIdx: number;
  pointerStartX: number;
  pointerStartY: number;
  currentDeltaX: number;
  currentDeltaY: number;
  passedThreshold: boolean;
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const columnWidthRef = useRef<number>(0);

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

  // ─────────────────────────────────────────────
  // Drag-to-reschedule
  //
  // Mouse-driven. Pointer position is captured globally during a drag,
  // mapped back to a target (dayIdx, minutesFromStartHour) snapped to a
  // 15-min grid. On release, PATCH /appointments/:id with the new
  // startAt. UI updates optimistically; a 409 (conflict) rolls back.
  // ─────────────────────────────────────────────

  function computeTargetFromDrag(d: DragState): { newStart: Date; dayIdx: number } | null {
    if (!d.passedThreshold) return null;
    const columnWidth = columnWidthRef.current || 1;
    const dayDelta = Math.round(d.currentDeltaX / columnWidth);
    const minutesDelta = Math.round((d.currentDeltaY / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;

    const targetDayIdx = Math.max(0, Math.min(days.length - 1, d.originalDayIdx + dayDelta));
    const dayDeltaActual = targetDayIdx - d.originalDayIdx;

    const newStart = new Date(d.originalStartMs);
    newStart.setDate(newStart.getDate() + dayDeltaActual);
    newStart.setMinutes(newStart.getMinutes() + minutesDelta);

    // Clamp into business hours
    const hours = newStart.getHours() + newStart.getMinutes() / 60;
    if (hours < START_HOUR) {
      newStart.setHours(START_HOUR, 0, 0, 0);
    } else if (hours + d.durationMin / 60 > END_HOUR) {
      newStart.setHours(END_HOUR - Math.ceil(d.durationMin / 60), 0, 0, 0);
    }

    return { newStart, dayIdx: targetDayIdx };
  }

  // Ref kept in sync with dragState, so the global mouseup handler can
  // read the latest snapshot even if React batches the state update.
  const dragStateRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  function onApptMouseDown(e: React.MouseEvent, a: Appointment) {
    // Skip drag for terminal states
    if (
      a.appointment.status === "cancelled" ||
      a.appointment.status === "completed" ||
      a.appointment.status === "no_show"
    )
      return;
    if (e.button !== 0) return;
    e.preventDefault();
    const start = new Date(a.appointment.startAt);
    const end = new Date(a.appointment.endAt);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60_000);
    const dayKey = start.toISOString().slice(0, 10);
    const originalDayIdx = days.findIndex((dd) => dd.toISOString().slice(0, 10) === dayKey);
    if (originalDayIdx < 0) return;

    setDragError(null);
    setDragState({
      apptId: a.appointment.id,
      originalStartMs: start.getTime(),
      durationMin,
      originalDayIdx,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      currentDeltaX: 0,
      currentDeltaY: 0,
      passedThreshold: false,
    });
  }

  useEffect(() => {
    if (!dragState) return;

    function onMove(e: MouseEvent) {
      setDragState((prev) => {
        if (!prev) return prev;
        const dx = e.clientX - prev.pointerStartX;
        const dy = e.clientY - prev.pointerStartY;
        const dist = Math.hypot(dx, dy);
        return {
          ...prev,
          currentDeltaX: dx,
          currentDeltaY: dy,
          passedThreshold: prev.passedThreshold || dist > DRAG_THRESHOLD_PX,
        };
      });
    }

    async function onUp() {
      const d = dragStateRef.current;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
      if (!d) return setDragState(null);
      // Click without movement → fall through to onClick which opens modal
      if (!d.passedThreshold) {
        setDragState(null);
        return;
      }
      const target = computeTargetFromDrag(d);
      setDragState(null);
      if (!target) return;
      const newStartMs = target.newStart.getTime();
      // No-op if the snapped time matches the original
      if (newStartMs === d.originalStartMs) return;

      // Optimistic update
      const previous = appointments;
      const newEnd = new Date(newStartMs + d.durationMin * 60_000);
      setAppointments((list) =>
        list.map((a) =>
          a.appointment.id === d.apptId
            ? {
                ...a,
                appointment: {
                  ...a.appointment,
                  startAt: target.newStart.toISOString(),
                  endAt: newEnd.toISOString(),
                },
              }
            : a,
        ),
      );

      const res = await api(`/api/v1/booking/appointments/${d.apptId}`, {
        method: "PATCH",
        body: JSON.stringify({ startAt: target.newStart.toISOString() }),
      });
      if (!res.success) {
        setDragError(res.error?.message ?? "Mutarea nu a putut fi salvată");
        setAppointments(previous);
        setTimeout(() => setDragError(null), 4000);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKey);
        setDragState(null);
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState?.apptId]);

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
          {days.map((d, dayIdx) => {
            const key = d.toISOString().slice(0, 10);
            const dayAppts = apptsByDay.get(key) || [];

            // Where the ghost should appear if currently dragging
            let ghostTop: number | null = null;
            let ghostHeight = 0;
            let ghostInvalid = false;
            if (dragState && dragState.passedThreshold) {
              const target = computeTargetFromDrag(dragState);
              if (target && target.dayIdx === dayIdx) {
                const t = target.newStart;
                const minutesFromStart = (t.getHours() - START_HOUR) * 60 + t.getMinutes();
                ghostTop = (minutesFromStart / 60) * HOUR_HEIGHT;
                ghostHeight = (dragState.durationMin / 60) * HOUR_HEIGHT - 2;
                // Naive validity preview: check overlap against other appts on this day
                ghostInvalid = dayAppts.some((other) => {
                  if (other.appointment.id === dragState.apptId) return false;
                  if (["cancelled", "no_show"].includes(other.appointment.status)) return false;
                  const oS = new Date(other.appointment.startAt).getTime();
                  const oE = new Date(other.appointment.endAt).getTime();
                  const tStart = t.getTime();
                  const tEnd = tStart + dragState.durationMin * 60_000;
                  return tStart < oE && tEnd > oS;
                });
              }
            }

            return (
              <div
                key={d.toISOString()}
                ref={(el) => {
                  if (el && dayIdx === 0) {
                    columnWidthRef.current = el.getBoundingClientRect().width;
                  }
                }}
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

                {/* Drag ghost */}
                {ghostTop !== null && (
                  <div
                    className="absolute left-1 right-1 rounded pointer-events-none"
                    style={{
                      top: ghostTop,
                      height: Math.max(20, ghostHeight),
                      background: ghostInvalid ? "#EF444433" : "#10B98133",
                      border: `2px dashed ${ghostInvalid ? "#EF4444" : "#10B981"}`,
                      zIndex: 30,
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold p-1"
                      style={{ color: ghostInvalid ? "#991B1B" : "#065F46" }}
                    >
                      {ghostInvalid ? "Conflict" : "Mută aici"}
                    </div>
                  </div>
                )}

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
                  const isTerminal =
                    isCancelled || a.appointment.status === "completed";
                  const isDraggingThis = dragState?.apptId === a.appointment.id && dragState.passedThreshold;

                  return (
                    <div
                      key={a.appointment.id}
                      onMouseDown={(e) => onApptMouseDown(e, a)}
                      onClick={(e) => {
                        // If a drag just ended, the global mouseup ran first and
                        // cleared dragState. We only consider this a click when
                        // no movement occurred (threshold never passed).
                        if (dragState && dragState.passedThreshold) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedAppt(a);
                      }}
                      className="absolute left-1 right-1 rounded text-left p-1.5 transition-shadow hover:shadow-md select-none"
                      style={{
                        top,
                        height,
                        background: color + "22",
                        borderLeft: `3px solid ${color}`,
                        opacity: isCancelled ? 0.55 : isDraggingThis ? 0.4 : 1,
                        textDecoration: isCancelled ? "line-through" : "none",
                        cursor: isTerminal ? "pointer" : "grab",
                        overflow: "hidden",
                      }}
                      title={isTerminal ? undefined : "Trage pentru a reprograma"}
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
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {dragError && (
        <div
          className="fixed bottom-6 right-6 rounded-md px-4 py-3 text-sm z-[60] shadow-lg"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          {dragError}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
        <span>Trage o programare pentru a o reprograma · </span>
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
