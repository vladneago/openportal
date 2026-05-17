"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  previewText: string | null;
  fromName: string | null;
  replyTo: string | null;
  targetType: string;
  targetParams: Record<string, unknown>;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  createdAt: string;
  updatedAt: string;
}

interface PreviewResult {
  subject: string;
  html: string;
  preview: string;
}

interface AudienceResult {
  total: number;
  eligible: number;
  withoutEmail: number;
  withoutConsent: number;
  sample: Array<{ firstName: string; lastName: string | null; email: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  sending: "Se trimite",
  sent: "Trimisă",
  paused: "Pauzată",
  failed: "Eșuată",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  scheduled: "#06B6D4",
  sending: "#F59E0B",
  sent: "#10B981",
  paused: "#94A3B8",
  failed: "#EF4444",
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [audience, setAudience] = useState<AudienceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Editable copy
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    previewText: "",
    targetType: "all_with_consent",
    fromName: "",
    replyTo: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await api<Campaign>(`/api/v1/marketing/campaigns/${id}`);
    if (res.success && res.data) {
      setCampaign(res.data);
      setForm({
        name: res.data.name,
        subject: res.data.subject,
        body: res.data.body,
        previewText: res.data.previewText ?? "",
        targetType: res.data.targetType,
        fromName: res.data.fromName ?? "",
        replyTo: res.data.replyTo ?? "",
      });
    } else {
      setError(res.error?.message ?? "Eroare");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadPreview() {
    if (!id) return;
    const res = await api<PreviewResult>(`/api/v1/marketing/campaigns/${id}/preview`, { method: "POST" });
    if (res.success && res.data) setPreview(res.data);
  }

  async function loadAudience() {
    if (!id) return;
    const res = await api<AudienceResult>(`/api/v1/marketing/campaigns/${id}/audience`, { method: "POST" });
    if (res.success && res.data) setAudience(res.data);
  }

  useEffect(() => {
    if (campaign && !preview) void loadPreview();
    if (campaign && !audience) void loadAudience();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign]);

  async function save() {
    if (!id) return;
    setSaving(true);
    const res = await api(`/api/v1/marketing/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: form.name,
        subject: form.subject,
        body: form.body,
        previewText: form.previewText || null,
        targetType: form.targetType,
        fromName: form.fromName || null,
        replyTo: form.replyTo || null,
      }),
    });
    setSaving(false);
    if (res.success) {
      setEditMode(false);
      await load();
      await loadPreview();
      await loadAudience();
    } else {
      setError(res.error?.message ?? "Eroare la salvare");
    }
  }

  async function sendNow() {
    if (!id) return;
    if (
      !confirm(
        `Trimiți ${audience?.eligible ?? 0} email-uri ACUM? Acțiunea nu poate fi anulată.`,
      )
    )
      return;
    setSending(true);
    setError(null);
    const res = await api(`/api/v1/marketing/campaigns/${id}/send-now`, {
      method: "POST",
      body: JSON.stringify({ inlineLimit: 50 }),
    });
    setSending(false);
    if (res.success) {
      await load();
    } else {
      setError(res.error?.message ?? "Eroare la trimitere");
    }
  }

  if (!id || loading) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  }
  if (!campaign) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Campanie inexistentă.
      </div>
    );
  }

  const isLocked = campaign.status === "sent" || campaign.status === "sending";

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link href="/marketing" className="text-xs no-underline" style={{ color: "var(--text-tertiary)" }}>
          ← Înapoi la campanii
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
              {campaign.name}
            </h1>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-medium"
              style={{
                background: (STATUS_COLORS[campaign.status] || "#71717A") + "22",
                color: STATUS_COLORS[campaign.status] || "#71717A",
              }}
            >
              {STATUS_LABELS[campaign.status]}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {campaign.subject}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLocked && !editMode && (
            <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">
              Editează
            </button>
          )}
          {!isLocked && (
            <button
              onClick={sendNow}
              disabled={sending || !audience || audience.eligible === 0}
              className="btn-primary text-sm"
            >
              {sending ? "Se trimite…" : `Trimite acum${audience ? ` (${audience.eligible})` : ""}`}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-md p-3 mb-4 text-sm"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      {campaign.status === "sent" && (
        <div
          className="rounded-md p-3 mb-4 text-sm"
          style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}
        >
          Campanie trimisă cu succes — {campaign.totalSent} email-uri livrate
          {campaign.totalFailed > 0 ? `, ${campaign.totalFailed} eșuate` : ""}
          {campaign.totalSkipped > 0 ? `, ${campaign.totalSkipped} omise (fără email sau consimțământ)` : ""}.
        </div>
      )}

      {campaign.status === "sending" && (
        <div
          className="rounded-md p-3 mb-4 text-sm"
          style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}
        >
          Trimitere în curs… {campaign.totalSent}/{campaign.totalRecipients} email-uri livrate. Restul se procesează la
          următorul tick al worker-ului (~2-3 min).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: editor or summary */}
        <div className="rounded-lg p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {editMode && !isLocked ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
                Editor
              </h2>
              <Field label="Nume">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>
              <Field label="Audiență">
                <select
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="all_with_consent">Toți cu consimțământ email</option>
                  <option value="segment_recent">Recenți (30 zile)</option>
                  <option value="segment_dormant">Inactivi (60+ zile)</option>
                  <option value="segment_top_spenders">Top 50 cheltuitori</option>
                  <option value="segment_tag">După etichetă</option>
                  <option value="manual">Listă manuală</option>
                </select>
              </Field>
              <Field label="Subiect">
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>
              <Field label="Preview text">
                <input
                  value={form.previewText}
                  onChange={(e) => setForm({ ...form, previewText: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>
              <Field label="Conținut (Markdown)">
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={16}
                  className="input w-full text-sm"
                  style={{ resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From name">
                  <input
                    value={form.fromName}
                    onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="Reply-to">
                  <input
                    type="email"
                    value={form.replyTo}
                    onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={() => setEditMode(false)} className="btn-secondary text-sm">
                  Renunță
                </button>
                <button onClick={save} disabled={saving} className="btn-primary text-sm">
                  {saving ? "Se salvează…" : "Salvează"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
                Audiență
              </h2>
              {audience ? (
                <div className="space-y-2 mb-4">
                  <Row label="Eligibili (cu email + consimțământ)" value={audience.eligible} accent="#10B981" />
                  <Row label="Fără email" value={audience.withoutEmail} dim />
                  <Row label="Fără consimțământ email" value={audience.withoutConsent} dim />
                  <Row label="Total în segment" value={audience.total} />
                  {audience.sample.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                        Primii destinatari (sample)
                      </div>
                      {audience.sample.map((s, i) => (
                        <div key={i} className="text-xs" style={{ color: "var(--text)" }}>
                          {s.firstName} {s.lastName ?? ""} — <span style={{ color: "var(--text-tertiary)" }}>{s.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Se calculează…</div>
              )}

              {campaign.status === "sent" && (
                <>
                  <h2 className="text-sm font-semibold mt-5 mb-3" style={{ color: "var(--text)" }}>
                    Rezultate
                  </h2>
                  <Row label="Trimise" value={campaign.totalSent} accent="#10B981" />
                  <Row label="Eșuate" value={campaign.totalFailed} accent={campaign.totalFailed > 0 ? "#DC2626" : undefined} />
                  <Row label="Omise" value={campaign.totalSkipped} dim />
                  <Row label="Total destinatari" value={campaign.totalRecipients} />
                </>
              )}
            </>
          )}
        </div>

        {/* Right: preview */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Preview email
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                Variabilele sunt înlocuite cu valori de exemplu (Maria Popescu).
              </div>
            </div>
            <button onClick={loadPreview} className="btn-secondary text-xs">
              Reîmprospătează
            </button>
          </div>
          {preview ? (
            <iframe
              srcDoc={preview.html}
              title="Preview"
              style={{ width: "100%", height: 620, border: "none", background: "white" }}
            />
          ) : (
            <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              Se generează preview…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent, dim }: { label: string; value: number; accent?: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: dim ? "var(--text-tertiary)" : "var(--text)" }}>{label}</span>
      <span style={{ color: accent ?? (dim ? "var(--text-tertiary)" : "var(--text)"), fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
