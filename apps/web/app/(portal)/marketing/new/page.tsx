"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const STARTERS: Array<{
  label: string;
  description: string;
  name: string;
  subject: string;
  body: string;
  targetType: string;
}> = [
  {
    label: "🎂 Aniversare",
    description: "Mesaj cald pentru clienții care își sărbătoresc ziua",
    name: "La mulți ani — campanie aniversară",
    subject: "La mulți ani, {firstName}!",
    body: `Bună {firstName},

Îți urăm un sincer **La mulți ani!** din partea echipei {businessName}.

Pentru a sărbători cu tine, îți oferim **20% reducere** la următoarea ta vizită din această lună.

Programează-te aici: [{bookingLink}]({bookingLink})

Toate cele bune,
Echipa {businessName}`,
    targetType: "all_with_consent",
  },
  {
    label: "💌 Comeback",
    description: "Reactivare clienți care nu au mai venit de 60+ zile",
    name: "Ne-a fost dor de tine",
    subject: "Ne-a fost dor de tine, {firstName}",
    body: `Bună {firstName},

Au trecut câteva luni de când nu te-am mai văzut și voiam să-ți spunem un simplu „salut".

Dacă vrei să revii, te așteptăm cu o **reducere de 15%** la următoarea programare.

[Rezervă acum]({bookingLink})

Cu drag,
{businessName}`,
    targetType: "segment_dormant",
  },
  {
    label: "🗞️ Newsletter",
    description: "Anunț nou serviciu / promoție / actualizare",
    name: "Newsletter — Noutăți",
    subject: "Noutăți de la {businessName}",
    body: `Bună {firstName},

## Ce e nou la noi

- Detaliu 1 — descriere scurtă
- Detaliu 2 — descriere scurtă
- Detaliu 3 — descriere scurtă

[Rezervă o programare]({bookingLink})

Cu drag,
Echipa {businessName}`,
    targetType: "all_with_consent",
  },
  {
    label: "✨ Promo",
    description: "Ofertă limitată în timp pentru top cheltuitori",
    name: "Ofertă exclusivă",
    subject: "Ofertă exclusivă pentru tine, {firstName}",
    body: `Bună {firstName},

Pentru clienții noștri loiali, am pregătit o ofertă specială:

**30% reducere** la pachet de 3 ședințe, valabilă până duminică.

[Profită acum]({bookingLink})

Cu drag,
{businessName}`,
    targetType: "segment_top_spenders",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    previewText: "",
    targetType: "all_with_consent",
    fromName: "",
    replyTo: "",
  });

  function applyStarter(s: typeof STARTERS[number]) {
    setForm({
      name: s.name,
      subject: s.subject,
      body: s.body,
      previewText: "",
      targetType: s.targetType,
      fromName: form.fromName,
      replyTo: form.replyTo,
    });
  }

  async function save() {
    if (!form.name || !form.subject || !form.body) {
      setError("Numele, subiectul și conținutul sunt obligatorii");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await api<{ id: string }>(`/api/v1/marketing/campaigns`, {
      method: "POST",
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
    if (res.success && res.data?.id) {
      router.push(`/marketing/${res.data.id}`);
    } else {
      setError(res.error?.message ?? "Eroare la salvare");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link href="/marketing" className="text-xs no-underline" style={{ color: "var(--text-tertiary)" }}>
          ← Înapoi la campanii
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
          Campanie nouă
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Începe de la zero sau alege un șablon. Variabile suportate: <code>{`{firstName}`}</code>{" "}
          <code>{`{businessName}`}</code> <code>{`{bookingLink}`}</code> <code>{`{unsubscribeLink}`}</code>.
        </p>
      </div>

      {error && (
        <div
          className="rounded-md p-3 mb-4 text-sm"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applyStarter(s)}
            className="rounded-lg p-4 text-left"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
              {s.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {s.description}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="space-y-3">
          <Field label="Nume intern" required hint="Vezi doar tu acest nume.">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Reducere Crăciun"
              className="input w-full text-sm"
            />
          </Field>

          <Field label="Audiență">
            <select
              value={form.targetType}
              onChange={(e) => setForm({ ...form, targetType: e.target.value })}
              className="input w-full text-sm"
            >
              <option value="all_with_consent">Toți clienții cu consimțământ email</option>
              <option value="segment_recent">Clienți recenți (ultimele 30 zile)</option>
              <option value="segment_dormant">Clienți inactivi (60+ zile)</option>
              <option value="segment_top_spenders">Top 50 cheltuitori</option>
              <option value="segment_tag">După etichetă (vei seta tag-ul în pasul următor)</option>
              <option value="manual">Listă manuală</option>
            </select>
          </Field>

          <Field label="Subiect email" required>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="La mulți ani, {firstName}!"
              className="input w-full text-sm"
            />
          </Field>

          <Field label="Preview text (inbox snippet)" hint="Apare lângă subiect în inbox-ul destinatarului.">
            <input
              value={form.previewText}
              onChange={(e) => setForm({ ...form, previewText: e.target.value })}
              placeholder="20% reducere pentru luna ta de naștere"
              className="input w-full text-sm"
            />
          </Field>

          <Field label="Conținut" required hint="Markdown simplu: # Heading, **bold**, *italic*, [link](url), - listă.">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={14}
              maxLength={20000}
              className="input w-full text-sm"
              placeholder={`Bună {firstName},\n\nMesajul tău...\n\nCu drag,\n{businessName}`}
              style={{ resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From name" hint="Default: numele afacerii">
              <input
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder="Salon Luna"
                className="input w-full text-sm"
              />
            </Field>
            <Field label="Reply-to" hint="Email unde primești răspunsurile">
              <input
                type="email"
                value={form.replyTo}
                onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                placeholder="contact@salonluna.ro"
                className="input w-full text-sm"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link href="/marketing" className="btn-secondary text-sm no-underline">
              Renunță
            </Link>
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? "Se salvează…" : "Salvează ca ciornă"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      {hint && (
        <div className="text-[11px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
