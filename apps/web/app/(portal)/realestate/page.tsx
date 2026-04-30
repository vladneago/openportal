"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Property { id: string; title: string; propertyType: string; listingType: string; status: string; price: number; currency: string; rentPrice: number; city: string | null; zone: string | null; area: number | null; rooms: number | null; viewingCount: number; }

const STATUS: Record<string, { label: string; color: string }> = { available: { label: "Disponibil", color: "#10B981" }, reserved: { label: "Rezervat", color: "#F59E0B" }, sold: { label: "Vândut", color: "#6366F1" }, rented: { label: "Închiriat", color: "#3B82F6" }, unavailable: { label: "Indisponibil", color: "#71717A" } };
const TYPES: Record<string, string> = { apartment: "Apartament", house: "Casă", commercial: "Comercial", land: "Teren", office: "Birou", warehouse: "Depozit" };

export default function RealEstatePage() {
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", propertyType: "apartment", listingType: "sale", price: 0, city: "", rooms: 0, area: 0 });

  useEffect(() => { loadData(); }, []);
  async function loadData() { setLoading(true); const res = await api("/api/v1/realestate/properties"); if (res.success) setProps(res.data || []); setLoading(false); }

  async function handleCreate() {
    if (!form.title.trim()) return;
    await api("/api/v1/realestate/properties", { method: "POST", body: JSON.stringify({ ...form, price: form.price * 100 }) });
    setShowCreate(false); setForm({ title: "", propertyType: "apartment", listingType: "sale", price: 0, city: "", rooms: 0, area: 0 }); await loadData();
  }

  async function handleDelete(id: string) { await api(`/api/v1/realestate/properties/${id}`, { method: "DELETE" }); await loadData(); }
  async function handleStatus(id: string, status: string) { await api(`/api/v1/realestate/properties/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }

  const formatPrice = (v: number, c: string) => `${new Intl.NumberFormat("ro-RO").format(v / 100)} ${c}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Imobiliar</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Proprietăți, vizionări și administrare</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Proprietate nouă</button>
      </div>

      {showCreate && (
        <div className="panel p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
              <input className="input" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip proprietate</label>
              <select className="input" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tip anunț</label>
              <select className="input" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value })}>
                <option value="sale">Vânzare</option><option value="rent">Închiriere</option><option value="both">Ambele</option></select></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Preț (EUR)</label>
              <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Oraș</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Camere</label>
              <input className="input" type="number" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: Number(e.target.value) })} /></div>
            <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Suprafață (mp)</label>
              <input className="input" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} /></div>
          </div>
          <div className="flex gap-2"><button className="btn-primary" onClick={handleCreate}>Creează</button><button className="btn-secondary" onClick={() => setShowCreate(false)}>Anulează</button></div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {props.map((p) => {
          const st = STATUS[p.status] || STATUS.available;
          return (
            <div key={p.id} className="panel overflow-hidden transition-all" onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)")} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              <div className="h-28 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F108, #0EA5E908)" }}><span className="text-3xl">🏠</span></div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                  <button onClick={() => handleDelete(p.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text)" }}>{p.title}</p>
                <p className="text-[16px] font-semibold mb-2" style={{ color: "var(--accent)" }}>{formatPrice(p.price, p.currency)}</p>
                <div className="flex items-center gap-2 text-[10.5px] flex-wrap" style={{ color: "var(--text-tertiary)" }}>
                  <span>{TYPES[p.propertyType]}</span>
                  {p.city && <span>· {p.city}</span>}
                  {p.rooms && <span>· {p.rooms} camere</span>}
                  {p.area && <span>· {p.area} mp</span>}
                  <span>· {p.viewingCount} vizionări</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {props.length === 0 && !loading && <div className="text-center py-20 text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio proprietate. Apasă "Proprietate nouă" pentru a adăuga.</div>}
    </div>
  );
}
