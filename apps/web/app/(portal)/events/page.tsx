"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface EventItem { id: string; title: string; status: string; eventType: string; startDate: string; endDate: string; location: string | null; isVirtual: boolean; registrationCount: number; sessionCount: number; maxAttendees: number | null; ticketPrice: number; }

const STATUS: Record<string, { label: string; color: string }> = { draft: { label: "Ciornă", color: "#71717A" }, published: { label: "Publicat", color: "#10B981" }, live: { label: "Live", color: "#EF4444" }, completed: { label: "Finalizat", color: "#6366F1" }, cancelled: { label: "Anulat", color: "#A1A1AA" } };

export default function EventsPage() {
  const [eventList, setEventList] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", eventType: "conference", startDate: "", endDate: "", location: "", isVirtual: false });

  useEffect(() => { loadEvents(); }, []);
  async function loadEvents() { setLoading(true); const res = await api("/api/v1/events"); if (res.success) setEventList(res.data || []); setLoading(false); }

  async function handleCreate() {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    await api("/api/v1/events", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false); setForm({ title: "", eventType: "conference", startDate: "", endDate: "", location: "", isVirtual: false }); await loadEvents();
  }

  async function handlePublish(id: string) { await api(`/api/v1/events/${id}/publish`, { method: "POST" }); await loadEvents(); }
  async function handleDelete(id: string) { await api(`/api/v1/events/${id}`, { method: "DELETE" }); await loadEvents(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Evenimente</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Conferințe, workshop-uri și training-uri</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Eveniment nou</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
              <input className="input" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip</label>
              <select className="input" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                <option value="conference">Conferință</option><option value="workshop">Workshop</option><option value="webinar">Webinar</option><option value="meetup">Meetup</option><option value="training">Training</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Data start</label>
              <input className="input" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Data final</label>
              <input className="input" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Locație</label>
              <input className="input" placeholder="Sala / Online" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={form.isVirtual} onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })} /> Eveniment virtual
          </label>
          <div className="flex gap-2"><button className="btn-primary" onClick={handleCreate}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
        </div>
      )}

      <div className="space-y-3">
        {eventList.map((evt) => {
          const st = STATUS[evt.status] || STATUS.draft;
          const dateStr = `${new Date(evt.startDate).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}`;
          return (
            <div key={evt.id} className="panel px-5 py-4 flex items-center gap-5 transition-all"
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: "var(--page-bg)" }}>
                <span className="text-[18px] font-semibold leading-none" style={{ color: "var(--text)" }}>{new Date(evt.startDate).getDate()}</span>
                <span className="text-[10px] uppercase" style={{ color: "var(--text-tertiary)" }}>{new Date(evt.startDate).toLocaleDateString("ro-RO", { month: "short" })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{evt.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                  <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                  <span>{evt.isVirtual ? "🌐 Virtual" : `📍 ${evt.location || "TBD"}`}</span>
                  <span>{evt.registrationCount} înscriși</span>
                  <span>{evt.sessionCount} sesiuni</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {evt.status === "draft" && (
                  <button onClick={() => handlePublish(evt.id)} className="border-0 bg-transparent cursor-pointer text-[11px] font-medium px-2 py-1 rounded"
                    style={{ color: "#10B981" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#10B98110")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Publică</button>
                )}
                <button onClick={() => handleDelete(evt.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          );
        })}
      </div>
      {eventList.length === 0 && !loading && <div className="text-center py-20 text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun eveniment. Apasă "Eveniment nou" pentru a crea unul.</div>}
    </div>
  );
}
