"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: string;
  color: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  avatarUrl: string | null;
  color: string;
}

interface Slot {
  resourceId: string;
  startAt: string;
  endAt: string;
}

interface SiteInfo {
  site: {
    name: string;
    businessName: string | null;
    businessCity: string | null;
    businessPhone: string | null;
    logoUrl: string | null;
  };
  theme: {
    colors?: Record<string, string>;
    typography?: Record<string, string | number>;
  } | null;
}

async function publicFetch<T>(url: string, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { message: string } }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    return res.json();
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}

function formatDayRO(d: Date) {
  return d.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

type Step = "service" | "datetime" | "details" | "done";

export default function PublicBookingPage() {
  const params = useParams();
  const search = useSearchParams();
  const siteId = params?.siteId as string;
  const preselectedServiceId = search?.get("service");

  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [step, setStep] = useState<Step>("service");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    note: "",
    smsConsent: true,
    emailConsent: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    bookingCode: string;
    startAt: string;
    serviceName: string;
    resourceName: string;
    price: string;
    currency: string;
  } | null>(null);

  // Load site info + services + resources
  useEffect(() => {
    if (!siteId) return;
    (async () => {
      const [siteRes, svcRes, rsRes] = await Promise.all([
        publicFetch<SiteInfo>(`${API_URL}/api/v1/public/site-builder/sites/by-id?id=${siteId}&preview=1`),
        publicFetch<Service[]>(`${API_URL}/api/v1/public/site-builder/sites/${siteId}/services`),
        publicFetch<Resource[]>(`${API_URL}/api/v1/public/site-builder/sites/${siteId}/resources`),
      ]);
      if (siteRes.success && siteRes.data) setSiteInfo(siteRes.data);
      if (svcRes.success && svcRes.data) {
        setServices(svcRes.data);
        if (preselectedServiceId) {
          const preselected = svcRes.data.find((s) => s.id === preselectedServiceId);
          if (preselected) {
            setSelectedService(preselected);
            setStep("datetime");
          }
        }
      }
      if (rsRes.success && rsRes.data) setResources(rsRes.data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Load slots when service/resource/date change
  useEffect(() => {
    if (!selectedService || step !== "datetime") return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const params = new URLSearchParams({
      siteId,
      serviceId: selectedService.id,
      date: selectedDate,
    });
    if (selectedResource) params.append("resourceId", selectedResource.id);

    publicFetch<Slot[]>(`${API_URL}/api/v1/public/booking/slots?${params}`).then((res) => {
      if (res.success && res.data) setSlots(res.data);
      else setSlots([]);
      setLoadingSlots(false);
    });
  }, [selectedService, selectedResource, selectedDate, step, siteId]);

  const theme = siteInfo?.theme;
  const primary = theme?.colors?.primary || "#6366F1";
  const surface = theme?.colors?.surface || "#FFFFFF";
  const bg = theme?.colors?.background || "#F8FAFC";
  const text = theme?.colors?.text || "#0F172A";
  const textMuted = theme?.colors?.textMuted || "#64748B";
  const fontHeading = (theme?.typography?.fontFamilyHeading as string) || "system-ui, sans-serif";
  const fontBody = (theme?.typography?.fontFamilyBody as string) || "system-ui, sans-serif";

  // Group slots by hour for display
  const slotsByHour = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const slot of slots) {
      const d = new Date(slot.startAt);
      const key = String(d.getHours()).padStart(2, "0");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(slot);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  async function submitBooking() {
    if (!selectedService || !selectedSlot || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await publicFetch<{
      bookingCode: string;
      startAt: string;
      serviceName: string;
      resourceName: string;
      price: string;
      currency: string;
    }>(`${API_URL}/api/v1/public/booking/appointments`, {
      method: "POST",
      body: JSON.stringify({
        siteId,
        serviceId: selectedService.id,
        resourceId: selectedSlot.resourceId,
        startAt: selectedSlot.startAt,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          phone: form.phone,
          email: form.email || undefined,
          note: form.note || undefined,
          smsConsent: form.smsConsent,
          emailConsent: form.emailConsent,
        },
      }),
    });

    setSubmitting(false);
    if (res.success && res.data) {
      setConfirmation(res.data);
      setStep("done");
    } else {
      setError(res.error?.message || "Eroare la rezervare. Te rugăm încearcă din nou.");
    }
  }

  // Generate next 14 days for date picker
  const dateOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const value = d.toISOString().slice(0, 10);
      opts.push({ value, label: formatDayRO(d) });
    }
    return opts;
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: fontBody, padding: "32px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {siteInfo?.site.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={siteInfo.site.logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 12, objectFit: "cover" }} />
          )}
          <h1 style={{ fontFamily: fontHeading, fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            Rezervă online
          </h1>
          {siteInfo?.site.businessName && (
            <p style={{ color: textMuted, marginTop: 6 }}>
              {siteInfo.site.businessName}
              {siteInfo.site.businessCity ? ` · ${siteInfo.site.businessCity}` : ""}
            </p>
          )}
        </div>

        {/* Stepper */}
        <Stepper step={step} primary={primary} textMuted={textMuted} />

        {/* Card */}
        <div style={{ background: surface, borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          {step === "service" && (
            <ServiceStep
              services={services}
              onPick={(s) => {
                setSelectedService(s);
                setStep("datetime");
              }}
              primary={primary}
              textMuted={textMuted}
            />
          )}

          {step === "datetime" && selectedService && (
            <DateTimeStep
              service={selectedService}
              resources={resources}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              dateOptions={dateOptions}
              loadingSlots={loadingSlots}
              slotsByHour={slotsByHour}
              selectedSlot={selectedSlot}
              setSelectedSlot={(slot) => {
                setSelectedSlot(slot);
                if (slot) setStep("details");
              }}
              onBack={() => {
                setStep("service");
                setSelectedSlot(null);
              }}
              primary={primary}
              textMuted={textMuted}
              surface={surface}
            />
          )}

          {step === "details" && selectedService && selectedSlot && (
            <DetailsStep
              service={selectedService}
              slot={selectedSlot}
              resourceName={resources.find((r) => r.id === selectedSlot.resourceId)?.name}
              form={form}
              setForm={setForm}
              onBack={() => setStep("datetime")}
              onSubmit={submitBooking}
              submitting={submitting}
              error={error}
              primary={primary}
              textMuted={textMuted}
            />
          )}

          {step === "done" && confirmation && (
            <DoneStep confirmation={confirmation} primary={primary} textMuted={textMuted} />
          )}
        </div>

        <p style={{ textAlign: "center", color: textMuted, fontSize: "0.8rem", marginTop: 24 }}>
          Powered by <strong>OpenPortal</strong>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEPPER
// ─────────────────────────────────────────────

function Stepper({ step, primary, textMuted }: { step: Step; primary: string; textMuted: string }) {
  const steps: { id: Step; label: string }[] = [
    { id: "service", label: "Serviciu" },
    { id: "datetime", label: "Dată & oră" },
    { id: "details", label: "Detalii" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
      {steps.map((s, i) => {
        const done = i < currentIdx || step === "done";
        const active = i === currentIdx && step !== "done";
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: done || active ? primary : "rgba(0,0,0,0.1)",
                color: done || active ? "#fff" : textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "0.85rem", color: done || active ? primary : textMuted, fontWeight: active ? 600 : 400 }}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span style={{ color: textMuted, opacity: 0.4 }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 1: SERVICE
// ─────────────────────────────────────────────

function ServiceStep({
  services,
  onPick,
  primary,
  textMuted,
}: {
  services: Service[];
  onPick: (s: Service) => void;
  primary: string;
  textMuted: string;
}) {
  if (services.length === 0) {
    return (
      <p style={{ textAlign: "center", color: textMuted, padding: "32px 0" }}>
        Nu sunt servicii disponibile pentru rezervare online momentan.
      </p>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
        Alege serviciul
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 10,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              fontFamily: "inherit",
              color: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = primary;
              e.currentTarget.style.background = primary + "08";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div style={{ width: 4, alignSelf: "stretch", background: s.color, borderRadius: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: "0.85rem", color: textMuted }}>
                {s.durationMinutes} min
                {s.description ? ` · ${s.description}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {Number(s.price).toFixed(2)} {s.currency}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 2: DATE & TIME
// ─────────────────────────────────────────────

function DateTimeStep({
  service,
  resources,
  selectedResource,
  setSelectedResource,
  selectedDate,
  setSelectedDate,
  dateOptions,
  loadingSlots,
  slotsByHour,
  selectedSlot,
  setSelectedSlot,
  onBack,
  primary,
  textMuted,
  surface,
}: {
  service: Service;
  resources: Resource[];
  selectedResource: Resource | null;
  setSelectedResource: (r: Resource | null) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  dateOptions: { value: string; label: string }[];
  loadingSlots: boolean;
  slotsByHour: [string, Slot[]][];
  selectedSlot: Slot | null;
  setSelectedSlot: (s: Slot | null) => void;
  onBack: () => void;
  primary: string;
  textMuted: string;
  surface: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: textMuted,
            fontSize: "0.85rem",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          ← Înapoi
        </button>
      </div>

      <div
        style={{
          padding: 12,
          background: primary + "15",
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: "0.8rem", color: textMuted }}>Serviciu selectat</div>
        <div style={{ fontWeight: 600 }}>
          {service.name} · {service.durationMinutes} min · {Number(service.price).toFixed(2)} {service.currency}
        </div>
      </div>

      {resources.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
            Personal (opțional)
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedResource(null)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${!selectedResource ? primary : "rgba(0,0,0,0.1)"}`,
                background: !selectedResource ? primary + "15" : "transparent",
                color: !selectedResource ? primary : "inherit",
                fontWeight: !selectedResource ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.85rem",
              }}
            >
              Oricine disponibil
            </button>
            {resources.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedResource(r)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${selectedResource?.id === r.id ? primary : "rgba(0,0,0,0.1)"}`,
                  background: selectedResource?.id === r.id ? primary + "15" : "transparent",
                  color: selectedResource?.id === r.id ? primary : "inherit",
                  fontWeight: selectedResource?.id === r.id ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
          Data
        </label>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedDate(opt.value)}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                borderRadius: 8,
                border: `1px solid ${selectedDate === opt.value ? primary : "rgba(0,0,0,0.1)"}`,
                background: selectedDate === opt.value ? primary : surface,
                color: selectedDate === opt.value ? "#fff" : "inherit",
                fontWeight: selectedDate === opt.value ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
          Ora disponibilă
        </label>

        {loadingSlots ? (
          <p style={{ textAlign: "center", color: textMuted, padding: "24px 0" }}>Se caută sloturi…</p>
        ) : slotsByHour.length === 0 ? (
          <p style={{ textAlign: "center", color: textMuted, padding: "24px 0" }}>
            Nu sunt sloturi disponibile pentru această dată. Alege altă zi.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {slotsByHour.map(([hour, hourSlots]) => (
              <div key={hour}>
                <div style={{ fontSize: "0.75rem", color: textMuted, marginBottom: 4 }}>{hour}:00</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {hourSlots.map((slot, i) => {
                    const t = formatTime(new Date(slot.startAt));
                    const active = selectedSlot?.startAt === slot.startAt && selectedSlot?.resourceId === slot.resourceId;
                    return (
                      <button
                        key={`${slot.startAt}-${slot.resourceId}-${i}`}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: `1px solid ${active ? primary : "rgba(0,0,0,0.1)"}`,
                          background: active ? primary : "transparent",
                          color: active ? "#fff" : "inherit",
                          fontWeight: active ? 600 : 400,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontSize: "0.85rem",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 3: DETAILS
// ─────────────────────────────────────────────

function DetailsStep({
  service,
  slot,
  resourceName,
  form,
  setForm,
  onBack,
  onSubmit,
  submitting,
  error,
  primary,
  textMuted,
}: {
  service: Service;
  slot: Slot;
  resourceName: string | undefined;
  form: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    note: string;
    smsConsent: boolean;
    emailConsent: boolean;
  };
  setForm: (f: typeof form) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  primary: string;
  textMuted: string;
}) {
  const startAt = new Date(slot.startAt);
  const canSubmit = form.firstName.trim() && form.phone.trim().length >= 5;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: textMuted,
            fontSize: "0.85rem",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          ← Înapoi
        </button>
      </div>

      <div
        style={{
          padding: 12,
          background: primary + "15",
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: "0.8rem", color: textMuted }}>Rezumat programare</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{service.name}</div>
        <div style={{ fontSize: "0.85rem", color: textMuted }}>
          {formatDayRO(startAt)} la {formatTime(startAt)}
          {resourceName ? ` cu ${resourceName}` : ""}
        </div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>
          {Number(service.price).toFixed(2)} {service.currency}
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: 12 }}>
        Datele tale de contact
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <FormField label="Prenume *">
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              style={inputStyle}
              autoFocus
            />
          </FormField>
          <FormField label="Nume">
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Telefon *">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="07XX XXX XXX"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Notă (preferințe, alergii etc.)">
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </FormField>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.smsConsent}
              onChange={(e) => setForm({ ...form, smsConsent: e.target.checked })}
            />
            Doresc confirmări și reminder prin SMS
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.emailConsent}
              onChange={(e) => setForm({ ...form, emailConsent: e.target.checked })}
            />
            Doresc confirmări prin email
          </label>
        </div>

        {error && (
          <div style={{ padding: 10, background: "#FEE2E2", color: "#B91C1C", borderRadius: 8, fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          style={{
            marginTop: 8,
            padding: "14px 24px",
            background: primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
            opacity: canSubmit && !submitting ? 1 : 0.5,
          }}
        >
          {submitting ? "Se rezervă…" : "Confirmă programarea"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: "0.95rem",
  background: "#FFFFFF",
  color: "inherit",
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────
// STEP 4: DONE
// ─────────────────────────────────────────────

function DoneStep({
  confirmation,
  primary,
  textMuted,
}: {
  confirmation: {
    bookingCode: string;
    startAt: string;
    serviceName: string;
    resourceName: string;
    price: string;
    currency: string;
  };
  primary: string;
  textMuted: string;
}) {
  const startAt = new Date(confirmation.startAt);

  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#10B981",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: "2rem",
        }}
      >
        ✓
      </div>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px" }}>Programare confirmată!</h2>
      <p style={{ color: textMuted, marginBottom: 24 }}>
        Vei primi un SMS cu detaliile dacă ai bifat acordul.
      </p>

      <div
        style={{
          background: primary + "10",
          borderRadius: 12,
          padding: 20,
          textAlign: "left",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <span style={{ color: textMuted, fontSize: "0.85rem" }}>Cod rezervare</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1rem" }}>{confirmation.bookingCode}</span>
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: textMuted, fontSize: "0.75rem" }}>Serviciu</div>
          <div style={{ fontWeight: 600 }}>{confirmation.serviceName}</div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: textMuted, fontSize: "0.75rem" }}>Personal</div>
          <div style={{ fontWeight: 600 }}>{confirmation.resourceName}</div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: textMuted, fontSize: "0.75rem" }}>Dată & oră</div>
          <div style={{ fontWeight: 600 }}>
            {formatDayRO(startAt)} la {formatTime(startAt)}
          </div>
        </div>
        <div>
          <div style={{ color: textMuted, fontSize: "0.75rem" }}>Preț</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {Number(confirmation.price).toFixed(2)} {confirmation.currency}
          </div>
        </div>
      </div>

      <p style={{ color: textMuted, fontSize: "0.8rem" }}>
        Salvează codul <strong>{confirmation.bookingCode}</strong> pentru a anula sau reprograma.
      </p>
    </div>
  );
}
