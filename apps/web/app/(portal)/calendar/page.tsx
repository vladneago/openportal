"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";

interface CalEvent { id: string; title: string; startAt: string; endAt: string; color: string; allDay: boolean; type: string; location: string | null; }

const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
const MONTHS = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
const TYPE_COLORS: Record<string, string> = { meeting: "#6366F1", task: "#F59E0B", reminder: "#EC4899", event: "#10B981", out_of_office: "#71717A" };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ title: "", type: "event", startTime: "09:00", endTime: "10:00", location: "" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadEvents(); }, [year, month]);

  async function loadEvents() {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const res = await api(`/api/v1/calendar/events?start=${start}&end=${end}`);
    if (res.success) setEvents(res.data || []);
  }

  async function handleCreate() {
    if (!form.title.trim() || !selectedDate) return;
    const startAt = new Date(selectedDate);
    const [sh, sm] = form.startTime.split(":").map(Number);
    startAt.setHours(sh, sm, 0);
    const endAt = new Date(selectedDate);
    const [eh, em] = form.endTime.split(":").map(Number);
    endAt.setHours(eh, em, 0);

    await api("/api/v1/calendar/events", {
      method: "POST",
      body: JSON.stringify({
        title: form.title.trim(), type: form.type, color: TYPE_COLORS[form.type] || "#6366F1",
        startAt: startAt.toISOString(), endAt: endAt.toISOString(),
        location: form.location || undefined,
      }),
    });
    setShowCreate(false);
    setForm({ title: "", type: "event", startTime: "09:00", endTime: "10:00", location: "" });
    await loadEvents();
  }

  async function handleDelete(id: string) {
    await api(`/api/v1/calendar/events/${id}`, { method: "DELETE" });
    await loadEvents();
  }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.startAt.split("T")[0] === dateStr);
  };

  const today = new Date();
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  // Selected date events
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Calendar</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Evenimente și programări</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedDate(new Date()); setShowCreate(true); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Eveniment nou
        </button>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Calendar grid */}
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium" style={{ color: "var(--text)" }}>{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentDate(new Date())} className="border-0 cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                style={{ color: "var(--text-secondary)", background: "var(--surface)", boxShadow: "0 0 0 1px var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}>
                Azi
              </button>
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="border-0 cursor-pointer p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="border-0 cursor-pointer p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="panel">
            <div className="grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="text-center py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, isCurrentMonth }, i) => {
                const dayEvents = getEventsForDate(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                return (
                  <div key={i} onClick={() => { setSelectedDate(date); setShowCreate(false); }}
                    className="relative cursor-pointer transition-colors"
                    style={{
                      minHeight: 80, padding: "4px 6px",
                      borderBottom: i < 35 ? "1px solid var(--border)" : "none",
                      borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : "none",
                      background: isSelected ? "var(--accent)" + "08" : "transparent",
                      opacity: isCurrentMonth ? 1 : 0.35,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--page-bg)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <span className="text-[11px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full"
                      style={{
                        color: isToday(date) ? "#fff" : "var(--text-secondary)",
                        background: isToday(date) ? "var(--text)" : "transparent",
                      }}>
                      {date.getDate()}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div key={evt.id} className="text-[9px] px-1.5 py-0.5 rounded truncate" style={{ background: evt.color + "20", color: evt.color }}>
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[9px] px-1.5" style={{ color: "var(--text-tertiary)" }}>+{dayEvents.length - 3} alte</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          {showCreate && selectedDate ? (
            <div className="panel p-4">
              <h3 className="text-[13px] font-medium mb-4" style={{ color: "var(--text)" }}>
                Eveniment nou — {selectedDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
                  <input className="input" autoFocus placeholder="ex: Ședință echipă..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="meeting">Meeting</option><option value="task">Task</option><option value="reminder">Reminder</option><option value="event">Eveniment</option><option value="out_of_office">Out of Office</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ora start</label>
                    <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ora final</label>
                    <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Locație (opțional)</label>
                  <input className="input" placeholder="Sala A3 / Zoom link..." value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="btn-primary flex-1" onClick={handleCreate}>Creează</button>
                  <button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button>
                </div>
              </div>
            </div>
          ) : selectedDate ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  {selectedDate.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <button onClick={() => setShowCreate(true)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-10 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Niciun eveniment.<br />
                  <button onClick={() => setShowCreate(true)} className="border-0 bg-transparent cursor-pointer font-medium mt-2" style={{ color: "var(--accent)" }}>Creează unul</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((evt) => (
                    <div key={evt.id} className="group panel p-3 flex items-start gap-3">
                      <div className="w-1 h-full min-h-[32px] rounded-full shrink-0" style={{ background: evt.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{evt.title}</p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {new Date(evt.startAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} — {new Date(evt.endAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                          {evt.location && ` · ${evt.location}`}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(evt.id)}
                        className="border-0 bg-transparent cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-[12px]" style={{ color: "var(--text-tertiary)" }}>Click pe o zi pentru a vedea evenimentele</div>
          )}
        </div>
      </div>
    </div>
  );
}
