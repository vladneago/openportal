import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "localhost";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "1025", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

const FROM_NAME = process.env.MAIL_FROM_NAME || "OpenPortal";
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || "noreply@openportal.app";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    ...(SMTP_USER
      ? {
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        }
      : {}),
  });

  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

export async function sendMail(opts: MailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await getTransporter().sendMail({
      from: opts.from || `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || stripHtml(opts.html),
      replyTo: opts.replyTo,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return { success: false, error: String(err) };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────

const DAY_NAMES_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const MONTH_NAMES_RO = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

function formatDateRO(d: Date): string {
  return `${DAY_NAMES_RO[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_RO[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeRO(d: Date): string {
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function wrapEmail(content: string, brandColor = "#6366F1"): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#F8FAFC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color:#0F172A; }
  .container { max-width:560px; margin:0 auto; padding:24px 16px; }
  .card { background:#FFFFFF; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
  .header { text-align:center; padding-bottom:20px; border-bottom:1px solid #E2E8F0; margin-bottom:24px; }
  .header h1 { margin:0; color:${brandColor}; font-size:24px; font-weight:700; }
  .summary { background:#F1F5F9; border-radius:10px; padding:20px; margin:20px 0; }
  .summary-row { display:flex; justify-content:space-between; padding:6px 0; }
  .summary-row strong { color:#0F172A; }
  .summary-row span { color:#475569; }
  .code-box { text-align:center; margin:24px 0; padding:16px; background:${brandColor}15; border-radius:10px; }
  .code { font-family: 'Courier New', monospace; font-size:22px; font-weight:700; color:${brandColor}; letter-spacing:2px; }
  .btn { display:inline-block; padding:14px 32px; background:${brandColor}; color:#FFFFFF !important; text-decoration:none; border-radius:8px; font-weight:600; }
  .footer { text-align:center; color:#64748B; font-size:12px; padding:24px 16px; }
  .footer a { color:#64748B; }
</style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      Trimis automat prin <strong>OpenPortal</strong>. Nu răspunde la acest email.
    </div>
  </div>
</body>
</html>`;
}

export interface BookingConfirmationData {
  customerName: string;
  bookingCode: string;
  serviceName: string;
  resourceName: string;
  startAt: Date;
  durationMinutes: number;
  price: string;
  currency: string;
  businessName: string;
  businessPhone: string | null;
  businessAddress: string | null;
  customerNote: string | null;
  cancellationUrl?: string;
  brandColor?: string;
}

export function renderBookingConfirmation(data: BookingConfirmationData): {
  subject: string;
  html: string;
} {
  const subject = `Programare confirmată — ${data.serviceName} (${data.bookingCode})`;

  const content = `
    <div class="header">
      <h1>Programare confirmată!</h1>
      <p style="color:#475569;margin:8px 0 0;">Mulțumim, ${escapeHtml(data.customerName)}!</p>
    </div>

    <p>${escapeHtml(data.businessName)} ți-a confirmat programarea pentru:</p>

    <div class="summary">
      <div class="summary-row">
        <span>Serviciu</span>
        <strong>${escapeHtml(data.serviceName)}</strong>
      </div>
      <div class="summary-row">
        <span>Personal</span>
        <strong>${escapeHtml(data.resourceName)}</strong>
      </div>
      <div class="summary-row">
        <span>Data</span>
        <strong>${formatDateRO(data.startAt)}</strong>
      </div>
      <div class="summary-row">
        <span>Ora</span>
        <strong>${formatTimeRO(data.startAt)}</strong>
      </div>
      <div class="summary-row">
        <span>Durată</span>
        <strong>${data.durationMinutes} minute</strong>
      </div>
      <div class="summary-row" style="border-top:1px solid #CBD5E1;padding-top:10px;margin-top:6px;">
        <span>Preț</span>
        <strong style="font-size:18px;">${Number(data.price).toFixed(2)} ${data.currency}</strong>
      </div>
    </div>

    <div class="code-box">
      <div style="color:#475569;font-size:12px;margin-bottom:6px;">Cod rezervare</div>
      <div class="code">${data.bookingCode}</div>
      <div style="color:#475569;font-size:12px;margin-top:6px;">Salvează acest cod pentru anulare sau reprogramare.</div>
    </div>

    ${data.customerNote ? `
      <div style="margin:16px 0;padding:12px;background:#FEF3C7;border-radius:8px;font-size:14px;">
        <strong>Notița ta:</strong> ${escapeHtml(data.customerNote)}
      </div>
    ` : ""}

    ${data.businessAddress || data.businessPhone ? `
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E2E8F0;">
        <p style="margin:0 0 8px;font-weight:600;">${escapeHtml(data.businessName)}</p>
        ${data.businessAddress ? `<p style="margin:4px 0;color:#475569;font-size:14px;">📍 ${escapeHtml(data.businessAddress)}</p>` : ""}
        ${data.businessPhone ? `<p style="margin:4px 0;color:#475569;font-size:14px;">📞 <a href="tel:${escapeHtml(data.businessPhone)}" style="color:#475569;">${escapeHtml(data.businessPhone)}</a></p>` : ""}
      </div>
    ` : ""}

    ${data.cancellationUrl ? `
      <p style="margin-top:24px;color:#64748B;font-size:13px;text-align:center;">
        Vrei să anulezi? <a href="${data.cancellationUrl}" style="color:${data.brandColor || "#6366F1"};">Click aici</a>
      </p>
    ` : ""}
  `;

  return { subject, html: wrapEmail(content, data.brandColor) };
}

export interface BookingCancellationData {
  customerName: string;
  bookingCode: string;
  serviceName: string;
  startAt: Date;
  businessName: string;
  reason: string | null;
  brandColor?: string;
}

export function renderBookingCancellation(data: BookingCancellationData): {
  subject: string;
  html: string;
} {
  const subject = `Programare anulată — ${data.serviceName} (${data.bookingCode})`;

  const content = `
    <div class="header">
      <h1 style="color:#EF4444;">Programare anulată</h1>
    </div>

    <p>Bună, ${escapeHtml(data.customerName)},</p>
    <p>Programarea ta de la <strong>${escapeHtml(data.businessName)}</strong> a fost anulată.</p>

    <div class="summary">
      <div class="summary-row">
        <span>Serviciu</span>
        <strong>${escapeHtml(data.serviceName)}</strong>
      </div>
      <div class="summary-row">
        <span>Data programată</span>
        <strong>${formatDateRO(data.startAt)} la ${formatTimeRO(data.startAt)}</strong>
      </div>
      <div class="summary-row">
        <span>Cod rezervare</span>
        <strong style="font-family:monospace;">${data.bookingCode}</strong>
      </div>
    </div>

    ${data.reason ? `
      <p style="color:#475569;font-size:14px;">
        <strong>Motiv:</strong> ${escapeHtml(data.reason)}
      </p>
    ` : ""}

    <p style="margin-top:24px;">Te așteptăm cu drag să rezervi din nou când îți convine.</p>
  `;

  return { subject, html: wrapEmail(content, data.brandColor) };
}

export interface BookingReminderData {
  customerName: string;
  bookingCode: string;
  serviceName: string;
  resourceName: string;
  startAt: Date;
  businessName: string;
  businessPhone: string | null;
  businessAddress: string | null;
  brandColor?: string;
  variant?: "24h" | "2h";
  cancellationUrl?: string;
}

export function renderBookingReminder(data: BookingReminderData): {
  subject: string;
  html: string;
} {
  const variant = data.variant ?? "24h";
  const subject =
    variant === "2h"
      ? `Te așteptăm peste 2 ore — ${data.serviceName}`
      : `Reminder — programare mâine la ${formatTimeRO(data.startAt)}`;

  const headerLabel = variant === "2h" ? "Programarea ta începe în curând" : "Reminder programare";
  const introLine =
    variant === "2h"
      ? "Programarea ta începe peste aproximativ 2 ore:"
      : "Îți reamintim că mâine ai programare la <strong>" + escapeHtml(data.businessName) + "</strong>:";

  const content = `
    <div class="header">
      <h1>${headerLabel}</h1>
    </div>

    <p>Bună, ${escapeHtml(data.customerName)},</p>
    <p>${introLine}</p>

    <div class="summary">
      <div class="summary-row">
        <span>Serviciu</span>
        <strong>${escapeHtml(data.serviceName)}</strong>
      </div>
      <div class="summary-row">
        <span>Personal</span>
        <strong>${escapeHtml(data.resourceName)}</strong>
      </div>
      <div class="summary-row">
        <span>Când</span>
        <strong>${formatDateRO(data.startAt)} la ${formatTimeRO(data.startAt)}</strong>
      </div>
      <div class="summary-row">
        <span>Cod</span>
        <strong style="font-family:monospace;">${data.bookingCode}</strong>
      </div>
    </div>

    ${data.businessAddress || data.businessPhone ? `
      <p style="color:#475569;font-size:14px;">
        ${data.businessAddress ? `📍 ${escapeHtml(data.businessAddress)}<br>` : ""}
        ${data.businessPhone ? `📞 ${escapeHtml(data.businessPhone)}` : ""}
      </p>
    ` : ""}

    <p style="margin-top:24px;">Te așteptăm!</p>

    ${data.cancellationUrl ? `
      <p style="margin-top:24px;color:#64748B;font-size:13px;text-align:center;">
        Nu mai poți veni? <a href="${data.cancellationUrl}" style="color:${data.brandColor || "#6366F1"};">Anulează aici</a>
      </p>
    ` : ""}
  `;

  return { subject, html: wrapEmail(content, data.brandColor) };
}

// ─────────────────────────────────────────────
// Invoice payment reminder
// ─────────────────────────────────────────────

export interface InvoiceReminderData {
  customerName: string;
  documentNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string | null;
  amountDue: string; // pre-formatted
  currency: string;
  businessName: string;
  businessIban: string | null;
  businessBank: string | null;
  paymentUrl: string | null;
  daysOverdue: number; // negative if not yet due, positive if past due
  brandColor?: string;
}

export function renderInvoiceReminder(data: InvoiceReminderData): {
  subject: string;
  html: string;
} {
  const isOverdue = data.daysOverdue > 0;
  const subject = isOverdue
    ? `Reminder plată — factura ${data.documentNumber} (${data.daysOverdue} zile întârziere)`
    : `Reminder plată — factura ${data.documentNumber} ajunge la scadență`;

  const tone = data.daysOverdue > 60 ? "firm" : data.daysOverdue > 14 ? "polite" : "soft";
  const intro =
    tone === "firm"
      ? `Factura nr. <strong>${escapeHtml(data.documentNumber)}</strong> are deja <strong>${data.daysOverdue} zile</strong> de întârziere. Te rugăm să achiți cât de curând pentru a evita alte măsuri.`
      : tone === "polite"
        ? `Factura nr. <strong>${escapeHtml(data.documentNumber)}</strong> este restantă de <strong>${data.daysOverdue} zile</strong>. Ne-ar ajuta foarte mult dacă o poți achita zilele acestea.`
        : isOverdue
          ? `Factura nr. <strong>${escapeHtml(data.documentNumber)}</strong> a depășit data scadenței cu ${data.daysOverdue} zile.`
          : `Îți reamintim prietenește că factura nr. <strong>${escapeHtml(data.documentNumber)}</strong> ajunge la scadență curând.`;

  const paymentBlock = data.businessIban
    ? `
    <div class="summary" style="margin-top:16px;">
      <div class="summary-row"><span>IBAN</span><strong style="font-family:monospace;">${escapeHtml(data.businessIban)}</strong></div>
      ${data.businessBank ? `<div class="summary-row"><span>Bancă</span><strong>${escapeHtml(data.businessBank)}</strong></div>` : ""}
      <div class="summary-row"><span>Referință plată</span><strong>${escapeHtml(data.documentNumber)}</strong></div>
    </div>`
    : "";

  const content = `
    <div class="header">
      <h1>${isOverdue ? "Factură restantă" : "Reminder plată"}</h1>
    </div>

    <p>Bună, ${escapeHtml(data.customerName)},</p>
    <p>${intro}</p>

    <div class="summary">
      <div class="summary-row"><span>Document</span><strong>${escapeHtml(data.documentNumber)}</strong></div>
      <div class="summary-row"><span>Data emiterii</span><strong>${escapeHtml(data.issueDate)}</strong></div>
      ${data.dueDate ? `<div class="summary-row"><span>Scadență</span><strong>${escapeHtml(data.dueDate)}</strong></div>` : ""}
      <div class="summary-row"><span>De plată</span><strong>${escapeHtml(data.amountDue)} ${escapeHtml(data.currency)}</strong></div>
    </div>

    ${paymentBlock}

    ${data.paymentUrl ? `
      <p style="text-align:center;margin-top:24px;">
        <a href="${data.paymentUrl}" style="background:${data.brandColor || "#6366F1"};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Plătește acum</a>
      </p>
    ` : ""}

    <p style="margin-top:24px;color:#475569;font-size:13px;">
      Dacă plata a fost deja efectuată, te rugăm să ignori acest mesaj. Mulțumim — ${escapeHtml(data.businessName)}.
    </p>
  `;

  return { subject, html: wrapEmail(content, data.brandColor) };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
