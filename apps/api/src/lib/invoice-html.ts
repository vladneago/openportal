import type { BillingInvoice, BillingInvoiceLine, BillingPayment } from "@openportal/db";

// ─────────────────────────────────────────────
// Server-side HTML rendering of an invoice for print / Save-as-PDF
//
// Returns a self-contained HTML document with embedded styles tuned
// for A4 paper. The user opens in a tab and uses Ctrl+P → Save as PDF.
// No headless-browser dependency.
// ─────────────────────────────────────────────

function esc(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMoney(value: string | number | null | undefined, currency: string): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return `0.00 ${currency}`;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtQty(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 4 });
}

function fmtDateRO(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "CIORNĂ",
  issued: "EMISĂ",
  sent: "TRIMISĂ",
  viewed: "VIZUALIZATĂ",
  partially_paid: "PARȚIAL ACHITATĂ",
  paid: "ACHITATĂ",
  overdue: "RESTANTĂ",
  cancelled: "ANULATĂ",
  void: "STORNATĂ",
};

const TYPE_TITLES: Record<string, string> = {
  invoice: "FACTURĂ",
  proforma: "FACTURĂ PROFORMĂ",
  credit_note: "STORNO / NOTĂ DE CREDIT",
  receipt: "BON FISCAL",
  advance: "FACTURĂ DE AVANS",
};

export interface InvoiceHtmlInput {
  invoice: BillingInvoice;
  lines: BillingInvoiceLine[];
  payments: BillingPayment[];
  watermark?: string | null; // optional, e.g. "CIORNĂ" for drafts
}

export function renderInvoiceHtml({ invoice, lines, payments, watermark }: InvoiceHtmlInput): string {
  const currency = invoice.currency || "RON";
  const isCreditNote = invoice.type === "credit_note";
  const title = TYPE_TITLES[invoice.type] || "DOCUMENT";
  const wm = watermark ?? (invoice.status === "draft" ? "CIORNĂ" : invoice.status === "cancelled" ? "ANULATĂ" : null);

  // Aggregate VAT per rate for the summary table
  const taxByRate = new Map<string, { taxable: number; tax: number; rate: number }>();
  for (const l of lines) {
    const rate = Number(l.vatRate);
    const key = rate.toFixed(2);
    const cur = taxByRate.get(key);
    if (cur) {
      cur.taxable += Number(l.subtotal);
      cur.tax += Number(l.vatAmount);
    } else {
      taxByRate.set(key, { taxable: Number(l.subtotal), tax: Number(l.vatAmount), rate });
    }
  }
  const taxRows = Array.from(taxByRate.values()).sort((a, b) => b.rate - a.rate);

  const linesHtml = lines
    .map(
      (l, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${esc(l.description)}${l.itemCode ? `<br><span class="muted">${esc(l.itemCode)}</span>` : ""}</td>
        <td style="text-align:center;">${esc(l.unitOfMeasure || "buc")}</td>
        <td style="text-align:right;">${fmtQty(l.quantity)}</td>
        <td style="text-align:right;">${fmtMoney(l.unitPrice, currency)}</td>
        ${Number(l.discountAmount) > 0 ? `<td style="text-align:right;">-${fmtMoney(l.discountAmount, currency)}</td>` : `<td style="text-align:right;">—</td>`}
        <td style="text-align:right;">${fmtMoney(l.subtotal, currency)}</td>
        <td style="text-align:center;">${Number(l.vatRate).toFixed(0)}%</td>
        <td style="text-align:right;">${fmtMoney(l.vatAmount, currency)}</td>
        <td style="text-align:right;font-weight:600;">${fmtMoney(l.totalAmount, currency)}</td>
      </tr>`,
    )
    .join("");

  const paymentsHtml = payments.length > 0
    ? `
      <h3 style="margin-top:24px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Plăți efectuate</h3>
      <table class="table small">
        <thead>
          <tr><th>Data</th><th>Metodă</th><th>Referință</th><th style="text-align:right;">Sumă</th></tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>${fmtDateRO(p.paidAt.toISOString().slice(0, 10))}</td>
              <td>${esc(p.method)}</td>
              <td>${esc(p.reference ?? "—")}</td>
              <td style="text-align:right;font-weight:600;">${fmtMoney(p.amount, currency)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `
    : "";

  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<title>${esc(invoice.documentNumber)} — ${esc(invoice.issuerName)}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0F172A;
    font-size: 12px;
    margin: 0;
    background: #F8FAFC;
    line-height: 1.5;
  }
  .page {
    max-width: 210mm;
    margin: 20px auto;
    background: white;
    padding: 24px 28px;
    box-shadow: 0 6px 24px rgba(15,23,42,.08);
    position: relative;
  }
  @media print {
    body { background: white; }
    .page { box-shadow: none; margin: 0; max-width: 100%; padding: 0; }
    .no-print { display: none !important; }
  }
  .actions {
    max-width: 210mm; margin: 16px auto -12px; display: flex; gap: 8px; justify-content: flex-end;
  }
  .btn {
    padding: 8px 14px; background: #0F172A; color: white; border: none; border-radius: 6px;
    font-size: 13px; cursor: pointer; font-weight: 600;
  }
  .btn-secondary { background: white; color: #0F172A; border: 1px solid #CBD5E1; }
  .head { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
  .head h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: 0.5px; }
  .head .doc-no { font-size: 16px; font-weight: 600; color: #0F172A; }
  .head .dates { margin-top: 8px; color: #475569; font-size: 11px; }
  .head .status {
    display: inline-block; padding: 3px 9px; font-size: 10px; font-weight: 700;
    border-radius: 4px; letter-spacing: 0.5px; margin-top: 6px;
  }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .party { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px 14px; }
  .party h2 {
    font-size: 9px; color: #64748B; margin: 0 0 6px; text-transform: uppercase;
    letter-spacing: 0.8px; font-weight: 600;
  }
  .party .name { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .party .meta { font-size: 11px; color: #475569; line-height: 1.6; }
  .table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .table th { background: #0F172A; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 10px; }
  .table td { padding: 8px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
  .table.small th { background: #F1F5F9; color: #0F172A; }
  .totals { margin-top: 16px; display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
  .totals .tax-summary { font-size: 11px; }
  .totals .tax-summary table { width: 100%; }
  .totals .tax-summary th { background: #F1F5F9; color: #0F172A; padding: 4px 6px; font-size: 10px; }
  .totals .tax-summary td { padding: 4px 6px; border-bottom: 1px solid #F1F5F9; }
  .totals .grand { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px 16px; }
  .totals .grand .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
  .totals .grand .row.bigger { font-size: 16px; font-weight: 700; padding-top: 8px; border-top: 1px solid #CBD5E1; margin-top: 8px; }
  .totals .grand .row.paid { color: #059669; }
  .totals .grand .row.due { color: #DC2626; font-weight: 700; }
  .notes { margin-top: 16px; padding: 12px 14px; background: #FFFBEB; border-left: 3px solid #F59E0B; border-radius: 4px; font-size: 11px; color: #92400E; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
  .muted { color: #94A3B8; font-size: 10px; }
  .watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 120px; color: rgba(239, 68, 68, 0.07); font-weight: 900; pointer-events: none;
    letter-spacing: 8px; white-space: nowrap;
  }
</style>
</head>
<body>
<div class="actions no-print">
  <button class="btn-secondary btn" onclick="window.close()">Închide</button>
  <button class="btn" onclick="window.print()">Tipărește / Salvează PDF</button>
</div>
<div class="page">
  ${wm ? `<div class="watermark">${esc(wm)}</div>` : ""}
  <div class="head">
    <div>
      <h1>${title}</h1>
      <div class="doc-no">Nr. ${esc(invoice.documentNumber)}</div>
      <div class="dates">
        Data emitere: <strong>${fmtDateRO(invoice.issueDate)}</strong>
        ${invoice.dueDate ? `&nbsp;·&nbsp; Scadență: <strong>${fmtDateRO(invoice.dueDate)}</strong>` : ""}
      </div>
      ${invoice.status ? `<span class="status" style="background:${invoice.status === "paid" ? "#D1FAE5;color:#065F46" : invoice.status === "overdue" ? "#FEE2E2;color:#991B1B" : invoice.status === "draft" ? "#F1F5F9;color:#475569" : "#DBEAFE;color:#1E40AF"};">${esc(STATUS_LABELS[invoice.status] || invoice.status)}</span>` : ""}
      ${isCreditNote && invoice.relatedInvoiceId ? `<div style="margin-top:6px;font-size:10px;color:#64748B;">Storno la factura ${esc(invoice.relatedInvoiceId)}</div>` : ""}
    </div>
    <div style="text-align:right; min-width: 200px;">
      <div class="muted">EMITENT</div>
      <div style="font-weight:700;font-size:14px;">${esc(invoice.issuerName)}</div>
      ${invoice.issuerTaxId ? `<div style="font-size:11px;">CUI: <strong>${esc(invoice.issuerTaxId)}</strong></div>` : ""}
      ${invoice.issuerRegistrationNumber ? `<div style="font-size:11px;">Reg. Com.: ${esc(invoice.issuerRegistrationNumber)}</div>` : ""}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Furnizor</h2>
      <div class="name">${esc(invoice.issuerName)}</div>
      <div class="meta">
        ${invoice.issuerTaxId ? `CUI: ${esc(invoice.issuerTaxId)}<br>` : ""}
        ${invoice.issuerRegistrationNumber ? `Reg. Com.: ${esc(invoice.issuerRegistrationNumber)}<br>` : ""}
        ${invoice.issuerAddress ? `${esc(invoice.issuerAddress)}<br>` : ""}
        ${[invoice.issuerCity, invoice.issuerCounty, invoice.issuerCountry].filter(Boolean).join(", ") || ""}
        ${invoice.issuerEmail ? `<br>Email: ${esc(invoice.issuerEmail)}` : ""}
        ${invoice.issuerPhone ? `<br>Tel: ${esc(invoice.issuerPhone)}` : ""}
        ${invoice.issuerIban ? `<br>IBAN: <strong>${esc(invoice.issuerIban)}</strong>` : ""}
        ${invoice.issuerBank ? `<br>${esc(invoice.issuerBank)}` : ""}
      </div>
    </div>
    <div class="party">
      <h2>Client</h2>
      <div class="name">${esc(invoice.customerName)}</div>
      <div class="meta">
        ${invoice.customerTaxId ? `CUI: ${esc(invoice.customerTaxId)}<br>` : ""}
        ${invoice.customerRegistrationNumber ? `Reg. Com.: ${esc(invoice.customerRegistrationNumber)}<br>` : ""}
        ${invoice.customerAddress ? `${esc(invoice.customerAddress)}<br>` : ""}
        ${[invoice.customerCity, invoice.customerCounty, invoice.customerCountry].filter(Boolean).join(", ") || ""}
        ${invoice.customerEmail ? `<br>Email: ${esc(invoice.customerEmail)}` : ""}
        ${invoice.customerPhone ? `<br>Tel: ${esc(invoice.customerPhone)}` : ""}
      </div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th style="width:24px;text-align:center;">#</th>
        <th>Descriere</th>
        <th style="width:36px;text-align:center;">U.M.</th>
        <th style="width:50px;text-align:right;">Cant.</th>
        <th style="width:80px;text-align:right;">Preț</th>
        <th style="width:60px;text-align:right;">Disc.</th>
        <th style="width:80px;text-align:right;">Net</th>
        <th style="width:40px;text-align:center;">TVA</th>
        <th style="width:60px;text-align:right;">Val. TVA</th>
        <th style="width:90px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div class="totals">
    <div class="tax-summary">
      <h3 style="margin:0 0 6px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Recapitulație TVA</h3>
      <table>
        <thead>
          <tr><th>Cotă</th><th style="text-align:right;">Bază</th><th style="text-align:right;">TVA</th></tr>
        </thead>
        <tbody>
          ${taxRows.map(t => `
            <tr>
              <td>${t.rate.toFixed(0)}%</td>
              <td style="text-align:right;">${fmtMoney(t.taxable, currency)}</td>
              <td style="text-align:right;">${fmtMoney(t.tax, currency)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="grand">
      <div class="row"><span>Subtotal:</span><span>${fmtMoney(invoice.subtotal, currency)}</span></div>
      ${Number(invoice.totalDiscount) > 0 ? `<div class="row"><span>Discount:</span><span>-${fmtMoney(invoice.totalDiscount, currency)}</span></div>` : ""}
      <div class="row"><span>TVA:</span><span>${fmtMoney(invoice.totalVat, currency)}</span></div>
      <div class="row bigger"><span>TOTAL:</span><span>${fmtMoney(invoice.totalAmount, currency)}</span></div>
      ${Number(invoice.totalPaid) > 0 ? `<div class="row paid"><span>Achitat:</span><span>${fmtMoney(invoice.totalPaid, currency)}</span></div>` : ""}
      ${Number(invoice.amountDue) > 0 && invoice.status !== "draft" ? `<div class="row due"><span>De plată:</span><span>${fmtMoney(invoice.amountDue, currency)}</span></div>` : ""}
    </div>
  </div>

  ${paymentsHtml}

  ${invoice.notes ? `<div class="notes"><strong>Note:</strong> ${esc(invoice.notes)}</div>` : ""}
  ${invoice.termsAndConditions ? `<div class="notes" style="background:#EFF6FF;border-left-color:#3B82F6;color:#1E40AF;"><strong>Termeni și condiții:</strong> ${esc(invoice.termsAndConditions)}</div>` : ""}

  <div class="footer">
    Document generat de OpenPortal · ${new Date().toLocaleString("ro-RO")} · ${esc(invoice.efacturaStatus)}${invoice.efacturaUploadId ? ` · ANAF ID: ${esc(invoice.efacturaUploadId)}` : ""}
  </div>
</div>
</body>
</html>`;
}
