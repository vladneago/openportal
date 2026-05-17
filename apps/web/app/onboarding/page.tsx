"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { INDUSTRY_PRESETS, getPreset, type ServiceSuggestion } from "./industry-presets";

type Step = "industry" | "business" | "services" | "staff" | "schedule" | "site" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "industry", label: "Industrie" },
  { id: "business", label: "Afacere" },
  { id: "services", label: "Servicii" },
  { id: "staff", label: "Personal" },
  { id: "schedule", label: "Program" },
  { id: "site", label: "Site" },
];

interface StaffMember {
  name: string;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
}

interface Theme {
  id: string;
  slug: string;
  name: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("industry");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const [industryId, setIndustryId] = useState<string>("");
  const [business, setBusiness] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
  });
  const [services, setServices] = useState<ServiceSuggestion[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffName, setStaffName] = useState("");
  const [createSite, setCreateSite] = useState(true);
  const [siteSubdomain, setSiteSubdomain] = useState("");
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);

  const preset = industryId ? getPreset(industryId) : null;

  // Load themes & templates once
  useEffect(() => {
    (async () => {
      const [tplRes, themeRes] = await Promise.all([
        api(`/api/v1/site-builder/templates`),
        api(`/api/v1/site-builder/themes?includeSystem=true`),
      ]);
      if (tplRes.success) setTemplates((tplRes.data as Template[]) || []);
      if (themeRes.success) setThemes((themeRes.data as Theme[]) || []);
    })();
  }, []);

  function pickIndustry(id: string) {
    setIndustryId(id);
    const p = getPreset(id);
    if (p) {
      setServices(p.services);
    }
    setStep("business");
  }

  function applyBusiness() {
    if (!business.name.trim()) return;
    if (!siteSubdomain) setSiteSubdomain(slugify(business.name));
    setStep("services");
  }

  function addService() {
    setServices([
      ...services,
      { name: "Serviciu nou", durationMinutes: 60, price: "0", color: "#6366F1" },
    ]);
  }

  function updateService(idx: number, patch: Partial<ServiceSuggestion>) {
    const next = [...services];
    next[idx] = { ...next[idx], ...patch };
    setServices(next);
  }

  function removeService(idx: number) {
    setServices(services.filter((_, i) => i !== idx));
  }

  function addStaff() {
    if (!staffName.trim()) return;
    setStaff([...staff, { name: staffName.trim() }]);
    setStaffName("");
  }

  function removeStaff(idx: number) {
    setStaff(staff.filter((_, i) => i !== idx));
  }

  async function finalize() {
    if (!preset || staff.length === 0) return;
    setSubmitting(true);
    setProgress("Salvăm setările afacerii…");

    try {
      // 1. Create resources (staff)
      setProgress("Adăugăm personalul…");
      const resourceIds: string[] = [];
      for (const m of staff) {
        const res = await api(`/api/v1/booking/resources`, {
          method: "POST",
          body: JSON.stringify({
            name: m.name,
            type: "staff",
            isActive: true,
            isBookableOnline: true,
          }),
        });
        if (res.success) resourceIds.push((res.data as { id: string }).id);
      }

      // 2. Create services
      setProgress("Salvăm serviciile…");
      for (const svc of services) {
        if (!svc.name.trim()) continue;
        await api(`/api/v1/booking/services`, {
          method: "POST",
          body: JSON.stringify({
            name: svc.name,
            slug: slugify(svc.name),
            description: undefined,
            category: svc.category,
            durationMinutes: svc.durationMinutes,
            price: svc.price,
            color: svc.color,
            isActive: true,
            isBookableOnline: true,
          }),
        });
      }

      // 3. Create weekly availability for each staff member
      setProgress("Configurăm programul săptămânal…");
      for (const resourceId of resourceIds) {
        for (const h of preset.hours) {
          await api(`/api/v1/booking/availability`, {
            method: "POST",
            body: JSON.stringify({
              resourceId,
              dayOfWeek: h.dayOfWeek,
              startTime: h.start,
              endTime: h.end,
              isActive: true,
            }),
          });
        }
      }

      // 4. Create default invoice series
      setProgress("Configurăm seria de facturare…");
      await api(`/api/v1/billing/series`, {
        method: "POST",
        body: JSON.stringify({
          code: "FCT",
          name: "Facturi principale",
          type: "invoice",
          prefix: "FCT",
          padLength: 4,
          resetPolicy: "yearly",
          nextNumber: 1,
          isDefault: true,
          isActive: true,
        }),
      });

      // 5. Create site (optional)
      if (createSite && siteSubdomain.trim()) {
        setProgress("Creăm site-ul tău…");
        const template = templates.find((t) => t.slug === preset.suggestedTemplate);
        const theme = themes.find((t) => t.slug === preset.suggestedTheme);

        const siteRes = await api<{ id: string }>(`/api/v1/site-builder/sites`, {
          method: "POST",
          body: JSON.stringify({
            name: business.name,
            subdomain: siteSubdomain,
            templateId: template?.id,
            themeId: theme?.id,
            businessName: business.name,
            businessAddress: business.address || undefined,
            businessCity: business.city || undefined,
            businessPhone: business.phone || undefined,
            businessEmail: business.email || undefined,
            businessHours: preset.hours.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              open: h.start,
              close: h.end,
              closed: false,
            })),
            defaultLocale: "ro",
          }),
        });
        if (siteRes.success && siteRes.data?.id) {
          setCreatedSiteId(siteRes.data.id);
        }
      }

      setProgress("Gata!");
      setStep("done");
    } catch (err) {
      console.error(err);
      alert("A apărut o eroare. Te rugăm încearcă din nou.");
    }
    setSubmitting(false);
  }

  const currentIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "32px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#0F172A" }}>
            Bun venit în OpenPortal
          </h1>
          <p style={{ color: "#64748B", marginTop: 6 }}>
            5 minute, 6 pași — și ești gata să primești prima programare online.
          </p>
        </div>

        {/* Stepper */}
        {step !== "done" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: done || active ? "#6366F1" : "rgba(0,0,0,0.1)",
                      color: done || active ? "#fff" : "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: active ? "#6366F1" : "#64748B",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span style={{ color: "#94A3B8", margin: "0 4px" }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {step === "industry" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Ce tip de afacere ai?
              </h2>
              <p style={{ color: "#64748B", marginBottom: 24 }}>
                Folosim asta pentru a-ți sugera servicii, program și un site potrivit.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 8,
                }}
              >
                {INDUSTRY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickIndustry(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: 14,
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "#0F172A",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#6366F1";
                      e.currentTarget.style.background = "#6366F108";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.background = "#FFFFFF";
                    }}
                  >
                    <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748B" }}>{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "business" && preset && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Detalii despre {preset.label.toLowerCase()}
              </h2>
              <p style={{ color: "#64748B", marginBottom: 24 }}>
                Aceste date vor apărea pe site, în facturi și în confirmările trimise clienților.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Nume afacere *">
                  <input
                    type="text"
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    placeholder="ex: Salon Luna"
                    style={inputStyle}
                    autoFocus
                  />
                </Field>
                <Field label="Adresă">
                  <input
                    type="text"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    placeholder="ex: Str. Florilor nr. 12"
                    style={inputStyle}
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Oraș">
                    <input
                      type="text"
                      value={business.city}
                      onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                      placeholder="ex: București"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Telefon">
                    <input
                      type="tel"
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="07XX XXX XXX"
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <Field label="Email contact">
                  <input
                    type="email"
                    value={business.email}
                    onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                    placeholder="contact@..."
                    style={inputStyle}
                  />
                </Field>
              </div>

              <FooterActions onBack={() => setStep("industry")} onNext={applyBusiness} canNext={!!business.name.trim()} />
            </div>
          )}

          {step === "services" && preset && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Servicii oferite
              </h2>
              <p style={{ color: "#64748B", marginBottom: 16 }}>
                Am pre-completat cu serviciile tipice pentru {preset.label.toLowerCase()}. Modifică-le sau adaugă altele.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {services.map((svc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px 32px",
                      gap: 8,
                      alignItems: "center",
                      padding: 10,
                      background: "#F8FAFC",
                      borderRadius: 8,
                    }}
                  >
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) => updateService(idx, { name: e.target.value })}
                      placeholder="Nume serviciu"
                      style={{ ...inputStyle, padding: "8px 10px" }}
                    />
                    <input
                      type="number"
                      value={svc.durationMinutes}
                      onChange={(e) => updateService(idx, { durationMinutes: parseInt(e.target.value || "30", 10) })}
                      title="Durată (min)"
                      style={{ ...inputStyle, padding: "8px 10px" }}
                      min={5}
                      step={5}
                    />
                    <input
                      type="text"
                      value={svc.price}
                      onChange={(e) => updateService(idx, { price: e.target.value })}
                      title="Preț (RON)"
                      style={{ ...inputStyle, padding: "8px 10px" }}
                      placeholder="0"
                    />
                    <button
                      onClick={() => removeService(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#94A3B8",
                        fontSize: "1rem",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: "0.75rem", color: "#64748B" }}>
                <span style={{ marginRight: "auto" }}>nume / durată (min) / preț (RON)</span>
                <button
                  onClick={addService}
                  style={{
                    background: "transparent",
                    border: "1px dashed #CBD5E1",
                    borderRadius: 8,
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "0.85rem",
                    color: "#475569",
                  }}
                >
                  + Adaugă serviciu
                </button>
              </div>

              <FooterActions
                onBack={() => setStep("business")}
                onNext={() => setStep("staff")}
                canNext={services.length > 0 && services.every((s) => s.name.trim())}
              />
            </div>
          )}

          {step === "staff" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Cine oferă serviciile?
              </h2>
              <p style={{ color: "#64748B", marginBottom: 24 }}>
                Adaugă cel puțin o persoană (poți fi chiar tu). Mai poți adăuga colegi oricând.
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStaff();
                    }
                  }}
                  placeholder="ex: Ana Popescu"
                  style={{ ...inputStyle, flex: 1 }}
                  autoFocus
                />
                <button
                  onClick={addStaff}
                  disabled={!staffName.trim()}
                  style={{
                    padding: "10px 20px",
                    background: staffName.trim() ? "#6366F1" : "#CBD5E1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    cursor: staffName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Adaugă
                </button>
              </div>

              {staff.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {staff.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#F8FAFC",
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      <button
                        onClick={() => removeStaff(idx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                          fontSize: "1rem",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <FooterActions
                onBack={() => setStep("services")}
                onNext={() => setStep("schedule")}
                canNext={staff.length > 0}
              />
            </div>
          )}

          {step === "schedule" && preset && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Programul săptămânal
              </h2>
              <p style={{ color: "#64748B", marginBottom: 16 }}>
                Programul sugerat pentru {preset.label.toLowerCase()}. Poți să-l modifici detaliat ulterior din panou.
              </p>

              <div
                style={{
                  background: "#F8FAFC",
                  padding: 16,
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                {["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"].map((dayLabel, i) => {
                  const dow = i + 1 > 6 ? 0 : i + 1; // Mon=1..Sat=6, Sun=0
                  const rule = preset.hours.find((h) => h.dayOfWeek === dow);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span style={{ color: "#0F172A", fontWeight: rule ? 500 : 400 }}>{dayLabel}</span>
                      <span style={{ color: rule ? "#10B981" : "#94A3B8", fontVariantNumeric: "tabular-nums" }}>
                        {rule ? `${rule.start} – ${rule.end}` : "închis"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: "0.78rem", color: "#94A3B8", marginBottom: 0 }}>
                💡 Acest program va fi aplicat tuturor membrilor personalului. Îl poți personaliza per persoană din /booking/availability.
              </p>

              <FooterActions onBack={() => setStep("staff")} onNext={() => setStep("site")} canNext />
            </div>
          )}

          {step === "site" && preset && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Vrei și un site online?
              </h2>
              <p style={{ color: "#64748B", marginBottom: 24 }}>
                Generăm un site complet cu temă, pagini pre-populate și buton de rezervare. Îl poți edita oricând.
              </p>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  background: createSite ? "#6366F108" : "#F8FAFC",
                  border: `1px solid ${createSite ? "#6366F1" : "#E2E8F0"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  marginBottom: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={createSite}
                  onChange={(e) => setCreateSite(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Da, creează site cu template-ul recomandat</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
                    Cu temă <strong>{preset.suggestedTheme}</strong> și template{" "}
                    <strong>{preset.suggestedTemplate}</strong>.
                  </div>
                </div>
              </label>

              {createSite && (
                <Field label="Subdomain pentru site">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="text"
                      value={siteSubdomain}
                      onChange={(e) => setSiteSubdomain(slugify(e.target.value))}
                      placeholder="salon-luna"
                      style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
                    />
                    <span style={{ color: "#64748B", fontSize: "0.85rem" }}>.openportal.app</span>
                  </div>
                </Field>
              )}

              <FooterActions
                onBack={() => setStep("schedule")}
                onNext={finalize}
                canNext={!createSite || siteSubdomain.length >= 3}
                nextLabel={submitting ? "Se configurează…" : "Finalizează"}
                disabled={submitting}
              />

              {progress && (
                <p style={{ marginTop: 14, fontSize: "0.85rem", color: "#6366F1", textAlign: "center" }}>
                  {progress}
                </p>
              )}
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#10B981",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "2.5rem",
                }}
              >
                ✓
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 0, color: "#0F172A" }}>
                Felicitări, ai terminat!
              </h2>
              <p style={{ color: "#64748B", marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
                Afacerea ta e configurată și gata să primească programări. Iată ce poți face acum:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360, margin: "0 auto" }}>
                <Link
                  href="/booking"
                  style={{
                    padding: 14,
                    background: "#6366F1",
                    color: "#fff",
                    borderRadius: 10,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                  }}
                >
                  Vezi calendarul programărilor →
                </Link>
                {createSite && createdSiteId && (
                  <Link
                    href={`/site-builder/${createdSiteId}/generate`}
                    style={{
                      padding: 14,
                      background: "#FEF3C7",
                      color: "#92400E",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      border: "1px solid #FCD34D",
                    }}
                  >
                    ✨ Personalizează cu AI (60 secunde)
                  </Link>
                )}
                {createSite && (
                  <Link
                    href={`/s/${siteSubdomain}`}
                    target="_blank"
                    style={{
                      padding: 14,
                      background: "transparent",
                      color: "#0F172A",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    Deschide site-ul tău ↗
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  style={{
                    padding: 14,
                    background: "transparent",
                    color: "#64748B",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  Mergi la dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {step !== "done" && (
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.8rem", marginTop: 16 }}>
            <button
              onClick={() => {
                try {
                  localStorage.setItem("onboarding_dismissed", "1");
                } catch {
                  // ignore
                }
                router.push("/dashboard");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.8rem",
                textDecoration: "underline",
              }}
            >
              Sari peste configurare
            </button>{" "}
            (le poți face manual din panou)
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: "0.95rem",
  background: "#FFFFFF",
  color: "#0F172A",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 4, color: "#334155" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function FooterActions({
  onBack,
  onNext,
  canNext,
  nextLabel,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
      <button
        onClick={onBack}
        disabled={disabled}
        style={{
          padding: "10px 16px",
          background: "transparent",
          color: "#64748B",
          border: "none",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        ← Înapoi
      </button>
      <button
        onClick={onNext}
        disabled={!canNext || disabled}
        style={{
          padding: "10px 20px",
          background: canNext && !disabled ? "#6366F1" : "#CBD5E1",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: canNext && !disabled ? "pointer" : "not-allowed",
        }}
      >
        {nextLabel || "Continuă →"}
      </button>
    </div>
  );
}
