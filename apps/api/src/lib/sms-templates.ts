// ─────────────────────────────────────────────
// SMS body templates (RO).
//
// Constraints:
//   - keep at ≤160 chars where possible (single SMS segment = cheaper)
//   - no smart quotes (some providers/handsets choke on UTF-16 chars)
//   - no markdown — SMS is plain text
//   - short links only (the cancellation URL is the only link sent)
//
// Each helper returns the body string. The caller injects it into
// sendSms() along with type metadata.
// ─────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function shortName(name: string, max = 18): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + ".";
}

export interface BookingSmsContext {
  businessName: string;
  customerFirstName: string;
  serviceName: string;
  startAt: Date;
  bookingCode: string;
  cancellationUrl?: string;
}

export function renderBookingConfirmationSms(ctx: BookingSmsContext): string {
  const biz = shortName(ctx.businessName);
  const date = fmtDate(ctx.startAt);
  const time = fmtTime(ctx.startAt);
  const url = ctx.cancellationUrl ?? "";
  return `[${biz}] Programare confirmata pe ${date} ora ${time}. Cod: ${ctx.bookingCode}. Anuleaza/Reprogrameaza: ${url}`.trim();
}

export function renderBookingReminder24hSms(ctx: BookingSmsContext): string {
  const biz = shortName(ctx.businessName);
  const date = fmtDate(ctx.startAt);
  const time = fmtTime(ctx.startAt);
  const url = ctx.cancellationUrl ?? "";
  return `[${biz}] Reminder: programare maine ${date} ora ${time}. Te asteptam! Anuleaza: ${url}`.trim();
}

export function renderBookingReminder2hSms(ctx: BookingSmsContext): string {
  const biz = shortName(ctx.businessName);
  const time = fmtTime(ctx.startAt);
  return `[${biz}] Te asteptam in 2h, la ora ${time}. ${ctx.customerFirstName ? `Pana atunci, ${ctx.customerFirstName}!` : ""}`.trim();
}

export function renderBookingCancelledSms(ctx: BookingSmsContext, reason?: string | null): string {
  const biz = shortName(ctx.businessName);
  const date = fmtDate(ctx.startAt);
  const time = fmtTime(ctx.startAt);
  const reasonStr = reason ? ` Motiv: ${reason.slice(0, 60)}` : "";
  return `[${biz}] Programarea din ${date} ora ${time} a fost anulata.${reasonStr}`.trim();
}

export function renderTestSms(businessName: string): string {
  const biz = shortName(businessName);
  return `[${biz}] OpenPortal test SMS. Daca primesti acest mesaj, configurarea e OK.`;
}
