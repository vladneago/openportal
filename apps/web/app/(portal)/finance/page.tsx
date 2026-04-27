"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Invoice { id: string; number: string; clientName: string; status: string; total: number; currency: string; issueDate: string; dueDate: string | null; paidAt: string | null; }
interface Expense { id: string; title: string; amount: number; currency: string; category: string | null; date: string; status: string; }

const INV_STATUS: Record<string, { label: string; color: string }> = { draft: { label: "Ciornă", color: "#71717A" }, sent: { label: "Trimisă", color: "#3B82F6" }, paid: { label: "Plătită", color: "#10B981" }, overdue: { label: "Depășită", color: "#EF4444" }, cancelled: { label: "Anulată", color: "#A1A1AA" } };
const EXP_STATUS: Record<string, { label: string; color: string }> = { pending: { label: "În așteptare", color: "#F59E0B" }, approved: { label: "Aprobată", color: "#10B981" }, rejected: { label: "Respinsă", color: "#EF4444" }, reimbursed: { label: "Rambursată", color: "#6366F1" } };

export default function FinancePage() {
  const [tab, setTab] = useState<"invoices" | "expenses">("invoices");
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInv, setShowCreateInv] = useState(false);
  const [showCreateExp, setShowCreateExp] = useState(false);
  const [invForm, setInvForm] = useState({ clientName: "", items: [{ description: "Serviciu", quantity: 1, unitPrice: 0, total: 0 }] });
  const [expForm, setExpForm] = useState({ title: "", amount: 0, category: "office" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [invRes, expRes] = await Promise.all([api("/api/v1/finance/invoices"), api("/api/v1/finance/expenses")]);
    if (invRes.success) setInvoiceList(invRes.data || []);
    if (expRes.success) setExpenseList(expRes.data || []);
    setLoading(false);
  }

  async function handleCreateInvoice() {
    if (!invForm.clientName.trim()) return;
    const items = invForm.items.map((i) => ({ ...i, total: i.quantity * i.unitPrice * 100 }));
    await api("/api/v1/finance/invoices", { method: "POST", body: JSON.stringify({ clientName: invForm.clientName, items, taxRate: 0.19 }) });
    setShowCreateInv(false); setInvForm({ clientName: "", items: [{ description: "Serviciu", quantity: 1, unitPrice: 0, total: 0 }] }); await loadData();
  }

  async function handleCreateExpense() {
    if (!expForm.title.trim()) return;
    await api("/api/v1/finance/expenses", { method: "POST", body: JSON.stringify({ ...expForm, amount: expForm.amount * 100 }) });
    setShowCreateExp(false); setExpForm({ title: "", amount: 0, category: "office" }); await loadData();
  }

  async function handleInvStatus(id: string, status: string) { await api(`/api/v1/finance/invoices/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); }
  async function handleApproveExp(id: string) { await api(`/api/v1/finance/expenses/${id}/approve`, { method: "POST" }); await loadData(); }

  const formatMoney = (v: number, c: string = "RON") => `${new Intl.NumberFormat("ro-RO").format(v / 100)} ${c}`;

  const totalInvoiced = invoiceList.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoiceList.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Finanțe</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Facturi și cheltuieli</p>
        </div>
        <div className="flex gap-2">
          {tab === "invoices" && <button className="btn-primary" onClick={() => setShowCreateInv(true)}>Factură nouă</button>}
          {tab === "expenses" && <button className="btn-primary" onClick={() => setShowCreateExp(true)}>Cheltuială</button>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-px rounded-[10px] overflow-hidden mb-6" style={{ background: "var(--border-hover)" }}>
        <div className="px-5 py-4" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Total facturat</p>
          <p className="text-xl font-medium" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>{formatMoney(totalInvoiced)}</p>
        </div>
        <div className="px-5 py-4" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Încasat</p>
          <p className="text-xl font-medium" style={{ color: "#10B981", letterSpacing: "-0.03em" }}>{formatMoney(totalPaid)}</p>
        </div>
        <div className="px-5 py-4" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Cheltuieli</p>
          <p className="text-xl font-medium" style={{ color: "#EF4444", letterSpacing: "-0.03em" }}>{formatMoney(totalExpenses)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-5">
        {[{ id: "invoices" as const, label: `Facturi (${invoiceList.length})` }, { id: "expenses" as const, label: `Cheltuieli (${expenseList.length})` }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: tab === t.id ? "var(--text)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>{t.label}</button>
        ))}
      </div>

      {tab === "invoices" ? (
        <>
          {showCreateInv && (
            <div className="panel p-4 mb-4 space-y-3">
              <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Client</label>
                <input className="input" autoFocus placeholder="Nume client..." value={invForm.clientName} onChange={(e) => setInvForm({ ...invForm, clientName: e.target.value })} /></div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Descriere</label>
                  <input className="input" value={invForm.items[0].description} onChange={(e) => setInvForm({ ...invForm, items: [{ ...invForm.items[0], description: e.target.value }] })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Cantitate</label>
                  <input className="input" type="number" value={invForm.items[0].quantity} onChange={(e) => setInvForm({ ...invForm, items: [{ ...invForm.items[0], quantity: Number(e.target.value) }] })} /></div>
                <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Preț unitar (RON)</label>
                  <input className="input" type="number" value={invForm.items[0].unitPrice} onChange={(e) => setInvForm({ ...invForm, items: [{ ...invForm.items[0], unitPrice: Number(e.target.value) }] })} /></div>
              </div>
              <div className="flex gap-2"><button className="btn-primary" onClick={handleCreateInvoice}>Creează</button><button className="btn-secondary" onClick={() => setShowCreateInv(false)}>Anulează</button></div>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "80px 1fr 120px 100px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Nr.</span><span>Client</span><span>Total</span><span>Status</span><span></span>
            </div>
            {invoiceList.map((inv) => {
              const st = INV_STATUS[inv.status] || INV_STATUS.draft;
              return (
                <div key={inv.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "80px 1fr 120px 100px 100px", borderBottom: "1px solid var(--page-bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{inv.number.slice(0, 12)}</span>
                  <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{inv.clientName}</span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{formatMoney(inv.total, inv.currency)}</span>
                  <select className="border-0 bg-transparent text-[10.5px] font-medium cursor-pointer outline-none" style={{ color: st.color }}
                    value={inv.status} onChange={(e) => handleInvStatus(inv.id, e.target.value)}>
                    {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(inv.issueDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}</span>
                </div>);
            })}
            {invoiceList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio factură.</div>}
          </div>
        </>
      ) : (
        <>
          {showCreateExp && (
            <div className="panel p-4 mb-4 flex items-end gap-3">
              <div className="flex-1"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Titlu</label>
                <input className="input" autoFocus placeholder="Licență software, Călătorie..." value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleCreateExpense(); }} /></div>
              <div className="w-32"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Sumă (RON)</label>
                <input className="input" type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} /></div>
              <div className="w-36"><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Categorie</label>
                <select className="input" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                  <option value="office">Birou</option><option value="travel">Călătorii</option><option value="software">Software</option><option value="marketing">Marketing</option><option value="other">Altele</option>
                </select></div>
              <button className="btn-primary shrink-0" onClick={handleCreateExpense}>Creează</button>
              <button className="btn-secondary shrink-0" onClick={() => setShowCreateExp(false)}>Anulează</button>
            </div>
          )}
          <div className="panel">
            <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ gridTemplateColumns: "1fr 100px 120px 100px 80px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <span>Cheltuială</span><span>Categorie</span><span>Sumă</span><span>Status</span><span></span>
            </div>
            {expenseList.map((exp) => {
              const st = EXP_STATUS[exp.status] || EXP_STATUS.pending;
              return (
                <div key={exp.id} className="grid gap-4 items-center px-4 py-3 transition-colors" style={{ gridTemplateColumns: "1fr 100px 120px 100px 80px", borderBottom: "1px solid var(--page-bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{exp.title}</span>
                  <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{exp.category || "—"}</span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{formatMoney(exp.amount, exp.currency)}</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: st.color + "15", color: st.color }}>{st.label}</span>
                  {exp.status === "pending" && (
                    <button onClick={() => handleApproveExp(exp.id)} className="border-0 bg-transparent cursor-pointer text-[10px] font-medium px-2 py-1 rounded" style={{ color: "#10B981" }}>Aprobă</button>
                  )}
                </div>);
            })}
            {expenseList.length === 0 && <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio cheltuială.</div>}
          </div>
        </>
      )}
    </div>
  );
}
