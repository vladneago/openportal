"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────
// /site-builder/[id]/generate — AI Site Generator
//
// Two-step flow:
//   1. Form: business name, industry, one-liner, USP, tone, city
//   2. Generate → show preview cards of all generated sections
//      → "Apply to home page" replaces the home page blocks
// ─────────────────────────────────────────────

interface SiteInfo {
  id: string;
  name: string;
  businessName: string | null;
  businessCity: string | null;
}

interface GeneratedContent {
  hero: { title: string; subtitle: string; ctaPrimary: { text: string }; ctaSecondary?: { text: string } };
  features: Array<{ icon: string; title: string; text: string }>;
  about: { title: string; text: string };
  servicesPreview: { title: string; subtitle: string; ctaText: string };
  reviewsFallback: Array<{ author: string; text: string; rating: number }>;
  faq: Array<{ q: string; a: string }>;
  ctaBanner: { title: string; subtitle: string; ctaText: string };
  seo: { title: string; description: string };
}

const INDUSTRIES: Array<{ value: string; label: string }> = [
  { value: "beauty", label: "Salon înfrumusețare" },
  { value: "barbershop", label: "Frizerie / barbershop" },
  { value: "spa_wellness", label: "SPA & wellness" },
  { value: "fitness", label: "Fitness / personal trainer" },
  { value: "yoga_pilates", label: "Yoga / pilates" },
  { value: "medical", label: "Cabinet medical" },
  { value: "dental", label: "Stomatologie" },
  { value: "cofetarie", label: "Cofetărie / patiserie" },
  { value: "florist", label: "Florărie" },
  { value: "photographer", label: "Fotograf" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafenea" },
  { value: "lawyer", label: "Avocat / notar" },
  { value: "accountant", label: "Contabil" },
  { value: "consulting", label: "Consultant" },
  { value: "psychology", label: "Psiholog / terapeut" },
  { value: "veterinary", label: "Veterinar" },
  { value: "automotive", label: "Atelier auto" },
  { value: "hotel_bnb", label: "Hotel / pensiune" },
  { value: "education", label: "Cursuri / training" },
  { value: "tattoo_studio", label: "Tatuaj / piercing" },
];

const TONES: Array<{ value: string; label: string; hint: string }> = [
  { value: "warm", label: "Cald & primitor", hint: "ca un prieten" },
  { value: "modern", label: "Modern & curat", hint: "fraze scurte" },
  { value: "lux", label: "Premium & elegant", hint: "exclusivist" },
  { value: "casual", label: "Relaxat", hint: "cu personalitate" },
  { value: "professional", label: "Profesional", hint: "sobru, încredere" },
];

export default function AiGeneratePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [site, setSite] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [stubMode, setStubMode] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    industry: "beauty",
    oneLineDescription: "",
    uniqueValue: "",
    tone: "warm" as "modern" | "lux" | "casual" | "warm" | "professional",
    city: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await api<SiteInfo>(`/api/v1/site-builder/sites/${id}`);
    if (res.success && res.data) {
      setSite(res.data);
      setForm((f) => ({
        ...f,
        businessName: f.businessName || res.data!.businessName || res.data!.name || "",
        city: f.city || res.data!.businessCity || "",
      }));
    } else {
      setError(res.error?.message ?? "Eroare la încărcare");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    if (!form.businessName || !form.oneLineDescription) {
      setError("Numele și descrierea sunt obligatorii");
      return;
    }
    setError(null);
    setGenerating(true);
    setContent(null);
    const res = await api<{ stub: boolean; content: GeneratedContent }>(
      `/api/v1/site-builder/ai-generate`,
      {
        method: "POST",
        body: JSON.stringify(form),
      },
    );
    setGenerating(false);
    if (res.success && res.data) {
      setContent(res.data.content);
      setStubMode(res.data.stub);
    } else {
      setError(res.error?.message ?? "Eroare la generare");
    }
  }

  async function applyToHomePage() {
    if (!id || !content) return;
    if (!confirm("Înlocuiesc conținutul actual al paginii principale cu cel generat?")) return;
    setApplying(true);
    setError(null);
    const res = await api(`/api/v1/site-builder/ai-generate/apply`, {
      method: "POST",
      body: JSON.stringify({ ...form, siteId: id }),
    });
    setApplying(false);
    if (res.success) {
      router.push(`/site-builder/${id}`);
    } else {
      setError(res.error?.message ?? "Eroare la aplicare");
    }
  }

  if (!id || loading) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Se încarcă…</div>;
  }
  if (!site) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Site inexistent.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link
          href={`/site-builder/${id}`}
          className="text-xs no-underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          ← Înapoi la {site.name}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
          Generator AI de conținut
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Descrie afacerea în 1-2 propoziții. AI-ul generează hero, despre, caracteristici, FAQ, CTA — tot ce ai nevoie
          pentru pagina principală. Poți edita oricând după.
        </p>
        {stubMode && content && (
          <div
            className="rounded-md p-3 mt-3 text-xs"
            style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}
          >
            ANTHROPIC_API_KEY nu e configurată pe acest mediu — folosim conținut stub generic pentru testare.
          </div>
        )}
        {error && (
          <div
            className="rounded-md p-3 mt-3 text-xs"
            style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form column */}
        <div
          className="rounded-lg p-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Spune-ne despre afacere
          </h2>

          <div className="space-y-3">
            <Field label="Nume afacere" required>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Salon Luna"
                className="input w-full text-sm"
              />
            </Field>

            <Field label="Industrie" required>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="input w-full text-sm"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Descrie afacerea într-o frază" required hint="Ex: Salon de înfrumusețare cu specializare în coloristică modernă, în centrul Clujului.">
              <textarea
                value={form.oneLineDescription}
                onChange={(e) => setForm({ ...form, oneLineDescription: e.target.value })}
                rows={2}
                maxLength={500}
                className="input w-full text-sm"
                style={{ resize: "vertical" }}
              />
            </Field>

            <Field
              label="De ce ne aleg clienții"
              hint="Opțional, dar ajută. Ex: experiență 12 ani, produse Olaplex, atmosferă caldă."
            >
              <textarea
                value={form.uniqueValue}
                onChange={(e) => setForm({ ...form, uniqueValue: e.target.value })}
                rows={2}
                maxLength={500}
                className="input w-full text-sm"
                style={{ resize: "vertical" }}
              />
            </Field>

            <Field label="Oraș" hint="Apare în SEO și unde e relevant.">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Cluj-Napoca"
                className="input w-full text-sm"
              />
            </Field>

            <Field label="Ton">
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, tone: t.value as typeof form.tone })}
                    className="text-xs px-3 py-2 rounded-md text-left"
                    style={{
                      background: form.tone === t.value ? "var(--bg-hover)" : "transparent",
                      border: "1px solid",
                      borderColor: form.tone === t.value ? "var(--text)" : "var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{t.label}</div>
                    <div style={{ color: "var(--text-tertiary)", marginTop: 2, fontSize: 10 }}>{t.hint}</div>
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={generate}
              disabled={generating || !form.businessName || !form.oneLineDescription}
              className="btn-primary text-sm w-full mt-2"
              style={{ opacity: generating || !form.businessName || !form.oneLineDescription ? 0.55 : 1 }}
            >
              {generating ? "Se generează… (5-15s)" : "✨ Generează conținut"}
            </button>
          </div>
        </div>

        {/* Preview column */}
        <div>
          {!content && !generating && (
            <div
              className="rounded-lg p-10 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px dashed var(--border)",
                color: "var(--text-tertiary)",
                fontSize: 13,
              }}
            >
              Completează formularul și apasă „Generează conținut" ca să vezi preview-ul aici.
            </div>
          )}

          {generating && (
            <div
              className="rounded-lg p-10 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                fontSize: 13,
                color: "var(--text-tertiary)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
              AI scrie conținutul pentru tine…
            </div>
          )}

          {content && (
            <div className="space-y-3">
              <PreviewCard title="HERO">
                <div className="font-semibold text-base mb-1" style={{ color: "var(--text)" }}>
                  {content.hero.title}
                </div>
                <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {content.hero.subtitle}
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-1 rounded" style={{ background: "var(--text)", color: "var(--bg)" }}>
                    {content.hero.ctaPrimary.text}
                  </span>
                  {content.hero.ctaSecondary && (
                    <span className="text-[10px] px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
                      {content.hero.ctaSecondary.text}
                    </span>
                  )}
                </div>
              </PreviewCard>

              <PreviewCard title="CARACTERISTICI">
                <div className="grid grid-cols-2 gap-2">
                  {content.features.map((f, i) => (
                    <div key={i} className="text-xs">
                      <span style={{ marginRight: 4 }}>{f.icon}</span>
                      <strong style={{ color: "var(--text)" }}>{f.title}</strong>
                      <div style={{ color: "var(--text-tertiary)", marginTop: 2 }}>{f.text}</div>
                    </div>
                  ))}
                </div>
              </PreviewCard>

              <PreviewCard title="DESPRE">
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  {content.about.title}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)", lineHeight: 1.55 }}>
                  {content.about.text}
                </div>
              </PreviewCard>

              <PreviewCard title="RECENZII PLACEHOLDER">
                {content.reviewsFallback.map((r, i) => (
                  <div key={i} className="text-xs mb-2 last:mb-0">
                    <span style={{ color: "#F59E0B", marginRight: 4 }}>{"★".repeat(r.rating)}</span>
                    <span style={{ color: "var(--text)" }}>„{r.text}"</span>
                    <span style={{ color: "var(--text-tertiary)" }}> — {r.author}</span>
                  </div>
                ))}
              </PreviewCard>

              <PreviewCard title="FAQ">
                {content.faq.map((q, i) => (
                  <div key={i} className="text-xs mb-2 last:mb-0">
                    <strong style={{ color: "var(--text)" }}>{q.q}</strong>
                    <div style={{ color: "var(--text-tertiary)", marginTop: 2 }}>{q.a}</div>
                  </div>
                ))}
              </PreviewCard>

              <PreviewCard title="CTA FINAL">
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  {content.ctaBanner.title}
                </div>
                <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {content.ctaBanner.subtitle}
                </div>
                <span className="text-[10px] px-2 py-1 rounded" style={{ background: "var(--text)", color: "var(--bg)" }}>
                  {content.ctaBanner.ctaText}
                </span>
              </PreviewCard>

              <PreviewCard title="SEO">
                <div className="text-xs" style={{ color: "var(--text)" }}>
                  <strong>Title:</strong> {content.seo.title}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  <strong>Description:</strong> {content.seo.description}
                </div>
              </PreviewCard>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-secondary text-sm flex-1"
                >
                  Regenerează
                </button>
                <button
                  onClick={applyToHomePage}
                  disabled={applying}
                  className="btn-primary text-sm flex-1"
                >
                  {applying ? "Se aplică…" : "Aplică pe pagina principală"}
                </button>
              </div>
            </div>
          )}
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

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[10px] font-semibold mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
