"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type AutomationType = "birthday" | "comeback" | "post_visit" | "new_customer";

interface Starter {
  label: string;
  description: string;
  name: string;
  subject: string;
  body: string;
  targetType: string;
  isAutomation?: boolean;
  automationType?: AutomationType;
  automationParams?: Record<string, unknown>;
}

const STARTERS: Starter[] = [
  {
    label: "🎂 Aniversare (automat)",
    description: "Trimite automat la ziua de naștere a fiecărui client",
    name: "La mulți ani — automat",
    subject: "La mulți ani, {firstName}!",
    body: `Bună {firstName},

Îți urăm un sincer **La mulți ani!** din partea echipei {businessName}.

Pentru a sărbători cu tine, îți oferim **20% reducere** la următoarea ta vizită din această lună.

Programează-te aici: [{bookingLink}]({bookingLink})

Toate cele bune,
Echipa {businessName}`,
    targetType: "all_with_consent",
    isAutomation: true,
    automationType: "birthday",
    automationParams: {},
  },
  {
    label: "💌 Comeback (automat)",
    description: "Trimite automat când un client n-a mai venit de 60 zile",
    name: "Ne-a fost dor de tine — automat",
    subject: "Ne-a fost dor de tine, {firstName}",
    body: `Bună {firstName},

Au trecut câteva luni de când nu te-am mai văzut și voiam să-ți spunem un simplu „salut".

Dacă vrei să revii, te așteptăm cu o **reducere de 15%** la următoarea programare.

[Rezervă acum]({bookingLink})

Cu drag,
{businessName}`,
    targetType: "all_with_consent",
    isAutomation: true,
    automationType: "comeback",
    automationParams: { daysSinceLastVisit: 60, windowDays: 7 },
  },
  {
    label: "🙏 Mulțumesc (automat)",
    description: "Mesaj trimis automat la 3 zile după o programare finalizată",
    name: "Mulțumesc — post vizită",
    subject: "Mulțumim pentru vizită, {firstName}",
    body: `Bună {firstName},

Mulțumim că ai ales {businessName} pentru ultima ta vizită. Ne-a făcut plăcere să te vedem.

Dacă vrei să te programezi din nou, te așteptăm cu drag:

[Rezervă acum]({bookingLink})

Cu drag,
Echipa {businessName}`,
    targetType: "all_with_consent",
    isAutomation: true,
    automationType: "post_visit",
    automationParams: { daysAfterVisit: 3 },
  },
  {
    label: "👋 Bun venit (automat)",
    description: "Mesaj de bun venit trimis la 7 zile după prima vizită",
    name: "Bun venit — client nou",
    subject: "Mulțumim că ai ales {businessName}, {firstName}",
    body: `Bună {firstName},

Suntem onorați că te-ai programat pentru prima dată la {businessName}.

Pentru a-ți mulțumi, îți oferim **10% reducere** la a doua vizită — valabil în următoarele 30 de zile.

[Programează-te aici]({bookingLink})

Cu drag,
Echipa {businessName}`,
    targetType: "all_with_consent",
    isAutomation: true,
    automationType: "new_customer",
    automationParams: { daysAfterFirstVisit: 7 },
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
    isAutomation: false,
    automationType: "" as "" | AutomationType,
    daysSinceLastVisit: 60,
    daysAfterVisit: 3,
    daysAfterFirstVisit: 7,
  });

  function applyStarter(s: Starter) {
    setForm({
      ...form,
      name: s.name,
      subject: s.subject,
      body: s.body,
      previewText: "",
      targetType: s.targetType,
      isAutomation: Boolean(s.isAutomation),
      automationType: (s.automationType as AutomationType) ?? "",
      daysSinceLastVisit:
        (s.automationParams?.daysSinceLastVisit as number | undefined) ?? form.daysSinceLastVisit,
      daysAfterVisit:
        (s.automationParams?.daysAfterVisit as number | undefined) ?? form.daysAfterVisit,
      daysAfterFirstVisit:
        (s.automationParams?.daysAfterFirstVisit as number | undefined) ?? form.daysAfterFirstVisit,
    });
  }

  async function save() {
    if (!form.name || !form.subject || !form.body) {
      setError("Numele, subiectul și conținutul sunt obligatorii");
      return;
    }
    setSaving(true);
    setError(null);
    const automationParams: Record<string, unknown> = {};
    if (form.automationType === "comeback") {
      automationParams.daysSinceLastVisit = form.daysSinceLastVisit;
      automationParams.windowDays = 7;
    } else if (form.automationType === "post_visit") {
      automationParams.daysAfterVisit = form.daysAfterVisit;
    } else if (form.automationType === "new_customer") {
      automationParams.daysAfterFirstVisit = form.daysAfterFirstVisit;
    }
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
        isAutomation: form.isAutomation,
        automationType: form.isAutomation && form.automationType ? form.automationType : null,
        automationParams,
        automationActive: true,
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

          <Field label="Tip campanie" hint="Manuală trimite o singură dată. Automată trimite zilnic la clienții care îndeplinesc condiția.">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, isAutomation: false, automationType: "" })}
                className="rounded-md p-2 text-xs text-left"
                style={{
                  background: !form.isAutomation ? "var(--bg-subtle)" : "var(--bg-surface)",
                  border: `1px solid ${!form.isAutomation ? "var(--primary)" : "var(--border)"}`,
                  cursor: "pointer",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text)" }}>📨 Manuală (one-shot)</div>
                <div style={{ color: "var(--text-tertiary)" }}>Trimiți tu când vrei</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isAutomation: true })}
                className="rounded-md p-2 text-xs text-left"
                style={{
                  background: form.isAutomation ? "var(--bg-subtle)" : "var(--bg-surface)",
                  border: `1px solid ${form.isAutomation ? "var(--primary)" : "var(--border)"}`,
                  cursor: "pointer",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text)" }}>⚙️ Automată</div>
                <div style={{ color: "var(--text-tertiary)" }}>Rulează zilnic în fundal</div>
              </button>
            </div>
          </Field>

          {form.isAutomation && (
            <>
              <Field label="Declanșator" required hint="Când să trimită automat sistemul.">
                <select
                  value={form.automationType}
                  onChange={(e) =>
                    setForm({ ...form, automationType: e.target.value as "" | AutomationType })
                  }
                  className="input w-full text-sm"
                >
                  <option value="">— Alege —</option>
                  <option value="birthday">🎂 La ziua de naștere a clientului</option>
                  <option value="comeback">💌 Când clientul nu a mai venit de X zile</option>
                  <option value="post_visit">🙏 La X zile după o vizită finalizată</option>
                  <option value="new_customer">👋 La X zile după prima vizită (welcome)</option>
                </select>
              </Field>

              {form.automationType === "comeback" && (
                <Field label="Zile fără vizită" hint="Trimite când lastVisitAt a fost cu atâtea zile în urmă (±7 zile toleranță).">
                  <input
                    type="number"
                    min={14}
                    max={365}
                    value={form.daysSinceLastVisit}
                    onChange={(e) =>
                      setForm({ ...form, daysSinceLastVisit: parseInt(e.target.value) || 60 })
                    }
                    className="input w-full text-sm"
                  />
                </Field>
              )}

              {form.automationType === "post_visit" && (
                <Field label="Zile după vizită" hint="Câte zile după appointment.completed.">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.daysAfterVisit}
                    onChange={(e) =>
                      setForm({ ...form, daysAfterVisit: parseInt(e.target.value) || 3 })
                    }
                    className="input w-full text-sm"
                  />
                </Field>
              )}

              {form.automationType === "new_customer" && (
                <Field label="Zile după prima vizită" hint="Câte zile după primul appointment finalizat.">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={form.daysAfterFirstVisit}
                    onChange={(e) =>
                      setForm({ ...form, daysAfterFirstVisit: parseInt(e.target.value) || 7 })
                    }
                    className="input w-full text-sm"
                  />
                </Field>
              )}

              {form.automationType === "birthday" && (
                <div
                  className="rounded-md p-3 text-xs"
                  style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FED7AA" }}
                >
                  Notă: clienții trebuie să aibă <code>Data nașterii</code> setată în profil pentru a primi mesajul.
                </div>
              )}
            </>
          )}

          {!form.isAutomation && (
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
          )}

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
              {saving
                ? "Se salvează…"
                : form.isAutomation
                ? "Activează automatizarea"
                : "Salvează ca ciornă"}
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
