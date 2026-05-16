"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface InvoiceSeries {
  id: string;
  code: string;
  name: string;
  type: string;
  nextNumber: number;
  isDefault: boolean;
  isActive: boolean;
}

interface Invoice {
  id: string;
  documentNumber: string;
  type: string;
  status: string;
  customerName: string;
  customerTaxId: string | null;
  issueDate: string;
  dueDate: string | null;
  totalAmount: string;
  totalPaid: string;
  amountDue: string;
  currency: string;
  efacturaStatus: string;
  createdAt: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

const STATUS_LABELS: Record<string, string> = {
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

const STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  issued: "#3B82F6",
  sent: "#06B6D4",
  viewed: "#06B6D4",
  partially_paid: "#F59E0B",
  paid: "#10B981",
  overdue: "#EF4444",
  cancelled: "#71717A",
  void: "#71717A",
};

const EFACTURA_LABELS: Record<string, string> = {
  not_submitted: "Netrimisă",
  queued: "În coadă",
  submitted: "Trimisă SPV",
  in_processing: "În procesare",
  accepted: "Acceptată ANAF",
  rejected: "Respinsă",
  error: "Eroare",
};

const TABS = [
  { href: "/billing", label: "Facturi" },
  { href: "/billing/reports", label: "Rapoarte" },
  { href: "/billing/series", label: "Serii" },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    seriesId: "",
    customerId: "",
    customerName: "",
    customerIsCompany: false,
    customerTaxId: "",
    customerAddress: "",
    customerCity: "",
    customerEmail: "",
    customerPhone: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    notes: "",
    lines: [{ description: "", quantity: "1", unitPrice: "0", vatRate: "19.00" }],
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter) params.append("status", statusFilter);
    const [invRes, seriesRes, custRes] = await Promise.all([
      api(`/api/v1/billing/invoices?${params}`),
      api(`/api/v1/billing/series`),
      api(`/api/v1/booking/customers?limit=200`),
    ]);
    if (invRes.success) setInvoices(invRes.data || []);
    if (seriesRes.success) setSeries(seriesRes.data || []);
    if (custRes.success) setCustomers(custRes.data || []);
    setLoading(false);
  }

  function totals() {
    let subtotal = 0;
    let vat = 0;
    let total = 0;
    for (const l of form.lines) {
      const q = Number(l.quantity);
      const up = Number(l.unitPrice);
      const vr = Number(l.vatRate);
      const sub = q * up;
      const v = (sub * vr) / 100;
      subtotal += sub;
      vat += v;
      total += sub + v;
    }
    return { subtotal, vat, total };
  }

  function pickCustomer(id: string) {
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setForm({
        ...form,
        customerId: id,
        customerName: `${cust.firstName}${cust.lastName ? " " + cust.lastName : ""}`,
        customerEmail: cust.email ?? "",
        customerPhone: cust.phone ?? "",
      });
    } else {
      setForm({ ...form, customerId: id });
    }
  }

  async function handleCreate() {
    if (!form.customerName.trim() || form.lines.length === 0) return;

    const payload = {
      seriesId: form.seriesId || undefined,
      customerId: form.customerId || undefined,
      customerName: form.customerName,
      customerIsCompany: form.customerIsCompany,
      customerTaxId: form.customerTaxId || undefined,
      customerAddress: form.customerAddress || undefined,
      customerCity: form.customerCity || undefined,
      customerEmail: form.customerEmail || undefined,
      customerPhone: form.customerPhone || undefined,
      issueDate: form.issueDate,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
      lines: form.lines.filter((l) => l.description.trim()).map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
      })),
    };

    const res = await api(`/api/v1/billing/invoices`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setShowCreate(false);
      setForm({
        seriesId: "",
        customerId: "",
        customerName: "",
        customerIsCompany: false,
        customerTaxId: "",
        customerAddress: "",
        customerCity: "",
        customerEmail: "",
        customerPhone: "",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        notes: "",
        lines: [{ description: "", quantity: "1", unitPrice: "0", vatRate: "19.00" }],
      });
      await load();
    } else {
      alert(res.error?.message || "Eroare la creare factură");
    }
  }

  async function markIssued(id: string) {
    await api(`/api/v1/billing/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "issued" }),
    });
    await load();
  }

  async function queueEfactura(id: string) {
    const res = await api(`/api/v1/billing/efactura/queue`, {
      method: "POST",
      body: JSON.stringify({ invoiceId: id }),
    });
    if (!res.success) alert(res.error?.message || "Eroare");
    await load();
  }

  function openPrintPreview(id: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    // We need to pass the bearer token to authenticate the print endpoint.
    // Fetch the HTML and open it in a new tab via a blob URL.
    fetch(`${API_URL}/api/v1/billing/invoices/${id}/print`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          alert(data?.error?.message || "Nu pot deschide previzualizarea");
          return;
        }
        const html = await res.text();
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      })
      .catch((err) => alert("Eroare: " + String(err)));
  }

  async function stornoInvoice(id: string, documentNumber: string) {
    const reason = prompt(`Motiv storno pentru ${documentNumber} (opțional):`);
    if (reason === null) return; // user cancelled
    const res = await api(`/api/v1/billing/invoices/${id}/storno`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || undefined }),
    });
    if (!res.success) {
      alert(res.error?.message || "Eroare la stornare");
      return;
    }
    await load();
  }

  const noSeries = series.length === 0;
  const t = totals();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Facturi
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Emite facturi, încasează plăți și trimite la e-Factura ANAF.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
          disabled={noSeries}
          style={{ opacity: noSeries ? 0.5 : 1 }}
        >
          + Factură nouă
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/billing" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/billing" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/billing" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {noSeries && (
        <div
          className="rounded-lg p-6 mb-6 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>
            Nu ai nicio serie de facturare configurată. Configurează cel puțin o serie pentru a emite facturi.
          </p>
          <Link href="/billing/series" className="btn-primary text-sm no-underline">
            Configurează seria
          </Link>
        </div>
      )}

      {!noSeries && (
        <div className="flex items-center gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs"
            style={{ width: 180 }}
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

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nicio factură încă.
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm font-mono" style={{ color: "var(--text)" }}>
                    {inv.documentNumber}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: (STATUS_COLORS[inv.status] || "#71717A") + "22",
                      color: STATUS_COLORS[inv.status] || "#71717A",
                    }}
                  >
                    {STATUS_LABELS[inv.status]}
                  </span>
                  {inv.efacturaStatus !== "not_submitted" && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                    >
                      ANAF: {EFACTURA_LABELS[inv.efacturaStatus] || inv.efacturaStatus}
                    </span>
                  )}
                </div>
                <div className="text-sm" style={{ color: "var(--text)" }}>
                  {inv.customerName}
                  {inv.customerTaxId ? ` · CUI ${inv.customerTaxId}` : ""}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Emisă: {inv.issueDate}
                  {inv.dueDate ? ` · Scadență: ${inv.dueDate}` : ""}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {Number(inv.totalAmount).toFixed(2)} {inv.currency}
                </div>
                {Number(inv.amountDue) > 0 && Number(inv.amountDue) < Number(inv.totalAmount) && (
                  <div className="text-[10px]" style={{ color: "#F59E0B" }}>
                    Rest: {Number(inv.amountDue).toFixed(2)} {inv.currency}
                  </div>
                )}
                {Number(inv.amountDue) === 0 && (
                  <div className="text-[10px]" style={{ color: "#10B981" }}>
                    Plătită
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openPrintPreview(inv.id)}
                  className="btn-secondary text-xs"
                  title="Previzualizare / Salvează PDF"
                >
                  PDF
                </button>
                {inv.status === "draft" && (
                  <button onClick={() => markIssued(inv.id)} className="btn-secondary text-xs">
                    Emite
                  </button>
                )}
                {inv.status !== "draft" && inv.efacturaStatus === "not_submitted" && (
                  <button onClick={() => queueEfactura(inv.id)} className="btn-secondary text-xs">
                    → ANAF
                  </button>
                )}
                {inv.type !== "credit_note" &&
                  ["issued", "sent", "viewed", "partially_paid", "paid", "overdue"].includes(inv.status) && (
                    <button
                      onClick={() => stornoInvoice(inv.id, inv.documentNumber)}
                      className="btn-secondary text-xs"
                      title="Creează notă de credit (storno)"
                      style={{ color: "#DC2626" }}
                    >
                      Stornează
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-2xl my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Factură nouă
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Serie">
                  <select
                    value={form.seriesId}
                    onChange={(e) => setForm({ ...form, seriesId: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="">Serie implicită</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.name})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Client existent (opțional)">
                  <select
                    value={form.customerId}
                    onChange={(e) => pickCustomer(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="">— Selectează —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName ?? ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Nume client / firmă">
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="CUI / CNP">
                  <input
                    type="text"
                    value={form.customerTaxId}
                    onChange={(e) => setForm({ ...form, customerTaxId: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs col-span-1" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.customerIsCompany}
                    onChange={(e) => setForm({ ...form, customerIsCompany: e.target.checked })}
                  />
                  Persoană juridică
                </label>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Adresă">
                  <input
                    type="text"
                    value={form.customerAddress}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="Localitate">
                  <input
                    type="text"
                    value={form.customerCity}
                    onChange={(e) => setForm({ ...form, customerCity: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Data emiterii">
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="Data scadență">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                    Linii factură
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        lines: [...form.lines, { description: "", quantity: "1", unitPrice: "0", vatRate: "19.00" }],
                      })
                    }
                    className="btn-secondary text-xs"
                  >
                    + Linie
                  </button>
                </div>
                <div className="space-y-2">
                  {form.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => {
                          const newLines = [...form.lines];
                          newLines[idx] = { ...line, description: e.target.value };
                          setForm({ ...form, lines: newLines });
                        }}
                        placeholder="Descriere"
                        className="input text-xs col-span-5"
                      />
                      <input
                        type="text"
                        value={line.quantity}
                        onChange={(e) => {
                          const newLines = [...form.lines];
                          newLines[idx] = { ...line, quantity: e.target.value };
                          setForm({ ...form, lines: newLines });
                        }}
                        placeholder="Cant"
                        className="input text-xs col-span-2"
                      />
                      <input
                        type="text"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const newLines = [...form.lines];
                          newLines[idx] = { ...line, unitPrice: e.target.value };
                          setForm({ ...form, lines: newLines });
                        }}
                        placeholder="Preț"
                        className="input text-xs col-span-2"
                      />
                      <select
                        value={line.vatRate}
                        onChange={(e) => {
                          const newLines = [...form.lines];
                          newLines[idx] = { ...line, vatRate: e.target.value };
                          setForm({ ...form, lines: newLines });
                        }}
                        className="input text-xs col-span-2"
                      >
                        <option value="0.00">0%</option>
                        <option value="5.00">5%</option>
                        <option value="9.00">9%</option>
                        <option value="19.00">19%</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (form.lines.length === 1) return;
                          setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
                        }}
                        className="text-xs col-span-1"
                        style={{ color: "var(--text-tertiary)" }}
                        disabled={form.lines.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded" style={{ background: "var(--bg-hover)" }}>
                <div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    Subtotal
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {t.subtotal.toFixed(2)} RON
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    TVA
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {t.vat.toFixed(2)} RON
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    Total
                  </div>
                  <div className="font-semibold text-base" style={{ color: "#10B981" }}>
                    {t.total.toFixed(2)} RON
                  </div>
                </div>
              </div>

              <Field label="Notițe">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.customerName.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.customerName.trim() ? 0.5 : 1 }}
              >
                Salvează ca ciornă
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
