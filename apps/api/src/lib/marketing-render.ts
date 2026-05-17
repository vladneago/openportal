// ─────────────────────────────────────────────
// Marketing email rendering
//
// Tiny markdown-ish body → HTML email transform with variable
// substitution. Deliberately minimal — no XSS surface because the
// body comes from the tenant admin (trusted) and the output is sent
// as HTML email, not rendered in browser.
//
// Supported markdown subset:
//   # Heading 1
//   ## Heading 2
//   **bold**
//   *italic*
//   [text](url)
//   - bullet item   (or *)
//   blank line → paragraph break
//   ---           → horizontal rule
//
// Template variables (case-sensitive):
//   {firstName}, {lastName}, {fullName}, {businessName},
//   {bookingLink}, {unsubscribeLink}, {currentYear}
// ─────────────────────────────────────────────

export interface RenderVars {
  firstName: string;
  lastName: string;
  fullName: string;
  businessName: string;
  bookingLink: string;
  unsubscribeLink: string;
  currentYear: string;
  // Future: anything custom from campaign.metadata
}

export function substituteVars(text: string, vars: RenderVars): string {
  return text.replace(/\{(firstName|lastName|fullName|businessName|bookingLink|unsubscribeLink|currentYear)\}/g, (_m, key) => {
    return (vars as unknown as Record<string, string>)[key] ?? "";
  });
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  let out = escHtml(text);
  // Links [text](url) — minimal, no nested brackets
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safeUrl = /^(https?:|mailto:)/i.test(url) ? url : "#";
    return `<a href="${safeUrl}" style="color:#2563EB;">${label}</a>`;
  });
  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic *text*
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

export function renderBody(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim() === "---") {
      out.push('<hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;">');
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      out.push(`<h2 style="font-size:18px;font-weight:700;margin:24px 0 12px;color:#0F172A;">${renderInline(line.slice(3))}</h2>`);
      i++;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      out.push(`<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px;color:#0F172A;">${renderInline(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(`<li style="margin-bottom:6px;">${renderInline(lines[i].replace(/^[-*]\s/, ""))}</li>`);
        i++;
      }
      out.push(`<ul style="padding-left:22px;margin:12px 0;color:#334155;">${items.join("")}</ul>`);
      continue;
    }

    // Paragraph (collect consecutive non-empty lines that aren't special)
    const para: string[] = [line];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "" && !/^([#*-]\s|---$)/.test(lines[j]) && !lines[j].startsWith("## ")) {
      para.push(lines[j]);
      j++;
    }
    out.push(`<p style="margin:0 0 14px;color:#334155;line-height:1.6;">${renderInline(para.join(" "))}</p>`);
    i = j;
  }

  return out.join("\n");
}

export interface CampaignEmailInput {
  subject: string;
  body: string; // markdown
  previewText: string | null;
  fromName: string;
  businessName: string;
  brandColor: string;
  vars: RenderVars;
}

export function renderCampaignEmail(input: CampaignEmailInput): { subject: string; html: string; preview: string } {
  const subject = substituteVars(input.subject, input.vars);
  const preview = substituteVars(input.previewText || "", input.vars);
  const renderedBody = renderBody(substituteVars(input.body, input.vars));

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;">${escHtml(preview)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:14px;border:1px solid #E2E8F0;overflow:hidden;">
      <tr><td style="background:${escHtml(input.brandColor)};color:#fff;padding:18px 24px;">
        <div style="font-size:14px;font-weight:600;letter-spacing:0.02em;">${escHtml(input.fromName || input.businessName)}</div>
      </td></tr>
      <tr><td style="padding:24px;font-size:14px;">
        ${renderedBody}
      </td></tr>
      <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:14px 24px;font-size:11px;color:#94A3B8;text-align:center;line-height:1.55;">
        Primești acest email pentru că ești client al <strong>${escHtml(input.businessName)}</strong>.<br>
        <a href="${escHtml(input.vars.unsubscribeLink)}" style="color:#94A3B8;text-decoration:underline;">Dezabonează-te</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html, preview };
}
