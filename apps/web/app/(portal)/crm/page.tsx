"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Deal { id: string; title: string; value: number; currency: string; stage: string; companyName: string | null; probability: number; expectedCloseDate: string | null; }
interface Contact { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; jobTitle: string | null; companyName: string | null; }

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_LABELS: Record<string, string> = { lead: "Lead", qualified: "Calificat", proposal: "Propunere", negotiation: "Negociere", won: "Câștigat", lost: "Pierdut" };
const STAGE_COLORS: Record<string, string> = { lead: "#71717A", qualified: "#3B82F6", proposal: "#8B5CF6", negotiation: "#F59E0B", won: "#10B981", lost: "#EF4444" };

export default function CRMPage() {
  const [tab, setTab] = useState<"deals" | "contacts">("deals");
  const [dealList, setDealList] = useState<Deal[]>([]);
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [dealForm, setDealForm] = useState({ title: "", value: 0, stage: "lead" });
  const [contactForm, setContactForm] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [dealsRes, contactsRes] = await Promise.all([api("/api/v1/crm/deals"), api("/api/v1/crm/contacts")]);
    if (dealsRes.success) setDealList(dealsRes.data || []);
    if (contactsRes.success) setContactList(contactsRes.data || []);
    setLoading(false);
  }

  async function handleCreateDeal() {
    if (!dealForm.title.trim()) return;
    await api("/api/v1/crm/deals", { method: "POST", body: JSON.stringify({ ...dealForm, value: dealForm.value * 100 }) });
    setShowCreateDeal(false); setDealForm({ title: "", value: 0, stage: "lead" }); await loadData();
  }

  async function handleCreateContact() {
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) return;
    await api("/api/v1/crm/contacts", { method: "POST", body: JSON.stringify(contactForm) });
    setShowCreateContact(false); setContactForm({ firstName: "", lastName: "", email: "", jobTitle: "" }); await loadData();
  }

  async function moveDeal(id: string, stage: string) {
    await api(`/api/v1/crm/deals/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    await loadData();
  }

  async function deleteDeal(id: string) { await api(`/api/v1/crm/deals/${id}`, { method: "DELETE" }); await loadData(); }
  async function deleteContact(id: string) { await api(`/api/v1/crm/contacts/${id}`, { method: "DELETE" }); await loadData(); }

  const formatValue = (v: number) => new Intl.NumberFormat("ro-RO").format(v / 100);

  const grouped: Record<string, Deal[]> = {};
  STAGES.forEach((s) => { grouped[s] = []; });
  dealList.forEach((d) => { if (grouped[d.stage]) grouped[d.stage].push(d); });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>CRM</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Gestionează relațiile cu clienții</p>
        </div>
        <div className="flex gap-2">
          {tab === "deals" && <button className="btn-primary" onClick={() => setShowCreateDeal(true)}>Deal nou</button>}
          {tab === "contacts" && <button className="btn-primary" onClick={() => setShowCreateContact(true)}>Contact nou</button>}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[{ id: "deals" as const, label: `Pipeline (${dealList.length})` }, { id: "contacts" as const, label: `Contacte (${contactList.length})` }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {tab === "deals" ? (
        <>
          {showCreateDeal && (
            <div className="panel p-4 mb-4 flex items-end gap-3">
              <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu deal</label>
                <input className="input" autoFocus placeholder="ex: Contract hosting anual" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreateDeal(); }} /></div>
              <div className="w-32"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Valoare (RON)</label>
                <input className="input" type="number" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })} /></div>
              <button className="btn-primary shrink-0" onClick={handleCreateDeal}>Creează</button>
              <button className="btn-secondary shrink-0" onClick={() => setShowCreateDeal(false)}>Anulează</button>
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage} className="shrink-0" style={{ width: 240 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                    <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{STAGE_LABELS[stage]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text-tertiary)" }}>{grouped[stage].length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {grouped[stage].map((deal) => (
                    <div key={deal.id} className="group panel p-3 transition-all"
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{deal.title}</p>
                        <button onClick={() => deleteDeal(deal.id)} className="border-0 bg-transparent cursor-pointer p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                      </div>
                      <p className="text-[14px] font-semibold mb-1.5" style={{ color: STAGE_COLORS[stage] }}>{formatValue(deal.value)} {deal.currency}</p>
                      {deal.companyName && <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>{deal.companyName}</p>}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                        {STAGES.filter((s) => s !== stage && s !== "won" && s !== "lost").map((s) => (
                          <button key={s} onClick={() => moveDeal(deal.id, s)} className="border-0 bg-transparent cursor-pointer text-[8px] px-1 py-0.5 rounded transition-colors"
                            style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>→ {STAGE_LABELS[s]}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {showCreateContact && (
            <div className="panel p-4 mb-4 flex items-end gap-3">
              <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Prenume</label>
                <input className="input" autoFocus placeholder="Ion" value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} /></div>
              <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nume</label>
                <input className="input" placeholder="Popescu" value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreateContact(); }} /></div>
              <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input className="input" placeholder="ion@email.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
              <button className="btn-primary shrink-0" onClick={handleCreateContact}>Creează</button>
              <button className="btn-secondary shrink-0" onClick={() => setShowCreateContact(false)}>Anulează</button>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 1fr 120px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Nume</span><span>Email</span><span>Companie</span><span></span>
            </div>
            {contactList.map((c) => (
              <div key={c.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 1fr 120px 80px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div><p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</p>
                  {c.jobTitle && <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{c.jobTitle}</p>}</div>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</span>
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{c.companyName || "—"}</span>
                <button onClick={() => deleteContact(c.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded" style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            ))}
            {contactList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Niciun contact.</div>}
          </div>
        </>
      )}
    </div>
  );
}
