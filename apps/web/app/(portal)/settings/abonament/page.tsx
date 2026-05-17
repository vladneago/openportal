"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface PlanLimits {
  maxResources: number;
  maxProducts: number;
  emailMailboxes: number;
  efacturaPerMonth: number;
  chatAiMessagesPerMonth: number;
  hasCustomDomain: boolean;
  hasMultipleLocations: boolean;
  hasRecurringBilling: boolean;
  hasPriorityFunctionCalling: boolean;
  hasOpenPortalBrandingRemoved: boolean;
  hasPrioritySupport: boolean;
}

interface Plan {
  slug: "solo" | "solo_pro";
  name: string;
  tagline: string;
  monthlyPriceEur: number;
  annualPriceEur: number;
  trialDays: number;
  limits: PlanLimits;
}

interface Subscription {
  hasSubscription: boolean;
  status: string;
  planSlug: string;
  plan: Plan;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeEnabled: boolean;
}

interface UsageQuota {
  used: number;
  limit: number;
}
interface UsageReport {
  planSlug: string;
  planName: string;
  status: string;
  resources: UsageQuota;
  products: UsageQuota;
  chatAiThisMonth: UsageQuota;
  efacturaThisMonth: UsageQuota;
  marketingEmailsThisMonth: UsageQuota;
  smsThisMonth: UsageQuota;
  sitesPublished: { used: number; limit: number | null };
}

const STATUS_LABEL: Record<string, string> = {
  trialing: "În perioadă de trial",
  active: "Activ",
  past_due: "Plată restantă",
  canceled: "Anulat",
  incomplete: "Incomplet",
  incomplete_expired: "Expirat",
  unpaid: "Neplătit",
  paused: "Pauzat",
};

const STATUS_COLOR: Record<string, string> = {
  trialing: "#3B82F6",
  active: "#10B981",
  past_due: "#F59E0B",
  canceled: "#EF4444",
  incomplete: "#94A3B8",
  incomplete_expired: "#EF4444",
  unpaid: "#EF4444",
  paused: "#F59E0B",
};

function formatDateRO(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      setBanner({ kind: "success", text: "Abonamentul a fost activat!" });
    }
    if (searchParams.get("upgrade") === "cancelled") {
      setBanner({ kind: "info", text: "Ai anulat upgrade-ul. Poți încerca oricând." });
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const [subRes, plansRes, usageRes] = await Promise.all([
      api<Subscription>("/api/v1/billing/platform/subscription"),
      api<{ plans: Plan[]; stripeEnabled: boolean }>("/api/v1/billing/platform/plans"),
      api<UsageReport>("/api/v1/billing/platform/usage"),
    ]);
    if (subRes.success && subRes.data) setSub(subRes.data);
    if (plansRes.success && plansRes.data) setPlans(plansRes.data.plans);
    if (usageRes.success && usageRes.data) setUsage(usageRes.data);
    setLoading(false);
  }

  async function startCheckout(planSlug: "solo" | "solo_pro") {
    setBusy(planSlug);
    try {
      const res = await api<{ url: string; stub: boolean; message?: string }>("/api/v1/billing/platform/checkout", {
        method: "POST",
        body: JSON.stringify({ planSlug, interval }),
      });
      if (res.success && res.data?.url) {
        if (res.data.stub) {
          // Local stub — just navigate to the success URL
          router.push(res.data.url.replace(window.location.origin, ""));
          await load();
        } else {
          window.location.href = res.data.url;
        }
      } else {
        setBanner({ kind: "error", text: res.error?.message || "Nu s-a putut crea sesiunea de checkout" });
      }
    } catch {
      setBanner({ kind: "error", text: "Eroare de rețea" });
    }
    setBusy(null);
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const res = await api<{ url: string; stub: boolean }>("/api/v1/billing/platform/portal", { method: "POST" });
      if (res.success && res.data?.url) {
        if (res.data.stub) {
          setBanner({ kind: "info", text: "Stripe nu e configurat — portalul real va fi disponibil când STRIPE_SECRET_KEY e setat." });
        } else {
          window.location.href = res.data.url;
        }
      } else {
        setBanner({ kind: "error", text: res.error?.message || "Eroare portal" });
      }
    } catch {
      setBanner({ kind: "error", text: "Eroare de rețea" });
    }
    setBusy(null);
  }

  if (loading) {
    return <Shell><p style={{ color: "#64748B", textAlign: "center", padding: 48 }}>Se încarcă…</p></Shell>;
  }

  if (!sub) {
    return <Shell><p style={{ color: "#64748B", textAlign: "center", padding: 48 }}>Nu s-au putut încărca datele abonamentului.</p></Shell>;
  }

  const currentPlan = sub.plan;
  const isPro = sub.planSlug === "solo_pro";

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Abonament</h1>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.95rem" }}>Plan curent, perioadă de facturare, upgrade.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: "0.85rem", flexWrap: "wrap" }}>
            <a href="/settings/sms" style={{ color: "#6366F1", textDecoration: "none" }}>
              📱 Configurează SMS
            </a>
            <a href="/settings/anaf" style={{ color: "#6366F1", textDecoration: "none" }}>
              📄 Configurează ANAF
            </a>
            <a href="/settings/stripe-payments" style={{ color: "#6366F1", textDecoration: "none" }}>
              💳 Configurează plăți online
            </a>
          </div>
        </div>
        {!sub.stripeEnabled && (
          <div style={{ background: "#FEF3C7", color: "#92400E", padding: "8px 14px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600 }}>
            ⚠️ STRIPE_SECRET_KEY nu e configurat — checkout local (sandbox)
          </div>
        )}
      </div>

      {banner && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            background: banner.kind === "success" ? "#D1FAE5" : banner.kind === "error" ? "#FEE2E2" : "#DBEAFE",
            color: banner.kind === "success" ? "#065F46" : banner.kind === "error" ? "#991B1B" : "#1E40AF",
            fontSize: "0.9rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "inherit" }}>×</button>
        </div>
      )}

      {/* Current plan card */}
      <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Plan curent
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>{currentPlan.name}</h2>
            <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.9rem" }}>{currentPlan.tagline}</p>
          </div>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: STATUS_COLOR[sub.status] + "22",
              color: STATUS_COLOR[sub.status],
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            {STATUS_LABEL[sub.status] || sub.status}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
          {sub.status === "trialing" && sub.trialEndsAt && (
            <Info label="Trial expiră" value={formatDateRO(sub.trialEndsAt)} accent={sub.trialDaysRemaining <= 3 ? "#EF4444" : "#3B82F6"} />
          )}
          {sub.currentPeriodEnd && (
            <Info label={sub.cancelAtPeriodEnd ? "Acces până la" : "Reînnoire automată"} value={formatDateRO(sub.currentPeriodEnd)} />
          )}
          <Info label="Preț lunar" value={`€${currentPlan.monthlyPriceEur}/lună`} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sub.hasSubscription && (
            <button
              onClick={openPortal}
              disabled={busy === "portal"}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: busy === "portal" ? "wait" : "pointer",
                color: "#0F172A",
              }}
            >
              {busy === "portal" ? "Se deschide…" : "Gestionează abonamentul"}
            </button>
          )}
          {!isPro && (
            <button
              onClick={() => startCheckout("solo_pro")}
              disabled={busy !== null}
              style={{
                padding: "10px 18px",
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy === "solo_pro" ? "Se procesează…" : "Upgrade la Solo Pro →"}
            </button>
          )}
        </div>

        {/* Trial countdown warning */}
        {sub.status === "trialing" && sub.trialDaysRemaining <= 3 && (
          <div style={{ marginTop: 16, padding: 12, background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: "0.85rem" }}>
            ⚠️ Trial-ul tău expiră în {sub.trialDaysRemaining} {sub.trialDaysRemaining === 1 ? "zi" : "zile"}. Adaugă o metodă de plată ca să continui.
          </div>
        )}
        {sub.cancelAtPeriodEnd && (
          <div style={{ marginTop: 16, padding: 12, background: "#FEF3C7", color: "#92400E", borderRadius: 8, fontSize: "0.85rem" }}>
            ℹ️ Abonamentul a fost anulat. Vei avea acces până la {formatDateRO(sub.currentPeriodEnd)}.
          </div>
        )}
      </div>

      {/* Usage breakdown */}
      {usage && (
        <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>Consum în planul curent</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <UsageBar label="Personal / resurse" used={usage.resources.used} limit={usage.resources.limit} />
            <UsageBar label="Produse POS" used={usage.products.used} limit={usage.products.limit} />
            <UsageBar
              label="Mesaje AI luna aceasta"
              used={usage.chatAiThisMonth.used}
              limit={usage.chatAiThisMonth.limit}
            />
            <UsageBar
              label="e-Factura ANAF luna aceasta"
              used={usage.efacturaThisMonth.used}
              limit={usage.efacturaThisMonth.limit}
            />
            <UsageBar
              label="Email-uri marketing luna aceasta"
              used={usage.marketingEmailsThisMonth.used}
              limit={usage.marketingEmailsThisMonth.limit}
            />
            <UsageBar
              label="SMS-uri luna aceasta"
              used={usage.smsThisMonth.used}
              limit={usage.smsThisMonth.limit}
            />
            <UsageBar
              label="Site-uri publicate"
              used={usage.sitesPublished.used}
              limit={usage.sitesPublished.limit ?? null}
            />
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#0F172A" }}>Toate planurile</h2>
        <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
          {(["month", "year"] as const).map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              style={{
                padding: "6px 14px",
                border: "none",
                background: interval === iv ? "#FFFFFF" : "transparent",
                color: interval === iv ? "#0F172A" : "#64748B",
                fontWeight: 600,
                fontSize: "0.85rem",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: interval === iv ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {iv === "month" ? "Lunar" : "Anual (-20%)"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {plans.map((p) => {
          const price = interval === "year" ? p.annualPriceEur : p.monthlyPriceEur;
          const period = interval === "year" ? "/an" : "/lună";
          const isCurrent = sub.planSlug === p.slug;
          const highlight = p.slug === "solo_pro";

          return (
            <div
              key={p.slug}
              style={{
                background: highlight ? "#6366F1" : "#FFFFFF",
                color: highlight ? "#fff" : "#0F172A",
                padding: 24,
                borderRadius: 16,
                border: highlight ? "none" : "1px solid #E2E8F0",
                boxShadow: highlight ? "0 8px 24px rgba(99,102,241,0.25)" : "none",
                position: "relative",
              }}
            >
              {isCurrent && (
                <div style={{ position: "absolute", top: -10, right: 16, background: "#10B981", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Plan actual
                </div>
              )}
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px" }}>{p.name}</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.85, margin: "0 0 20px" }}>{p.tagline}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: "2rem", fontWeight: 800 }}>€{price}</span>
                <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>{period}</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: "0.85rem", lineHeight: 1.6 }}>
                <li>✓ Personal/resurse: {p.limits.maxResources >= 999 ? "Nelimitat" : `Max ${p.limits.maxResources}`}</li>
                <li>✓ e-Factura: {p.limits.efacturaPerMonth >= 99999 ? "Nelimitat" : `${p.limits.efacturaPerMonth}/lună`}</li>
                <li>✓ Chat AI: {p.limits.chatAiMessagesPerMonth} mesaje/lună</li>
                <li>✓ Email mailboxes: {p.limits.emailMailboxes}</li>
                <li>{p.limits.hasCustomDomain ? "✓" : "—"} Domeniu propriu</li>
                <li>{p.limits.hasMultipleLocations ? "✓" : "—"} Locații multiple</li>
                <li>{p.limits.hasPrioritySupport ? "✓" : "—"} Suport prioritar 4h</li>
              </ul>

              {isCurrent ? (
                <div style={{ padding: "10px 16px", border: "1px solid currentColor", borderRadius: 8, textAlign: "center", fontSize: "0.85rem", fontWeight: 600, opacity: 0.7 }}>
                  Plan actual
                </div>
              ) : (
                <button
                  onClick={() => startCheckout(p.slug)}
                  disabled={busy !== null}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: highlight ? "#FFFFFF" : "#6366F1",
                    color: highlight ? "#6366F1" : "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {busy === p.slug ? "Se procesează…" : `Alege ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{children}</div>;
}

function Info({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.05rem", color: accent || "#0F172A", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const isUnlimited = limit === null || limit >= 99999;
  const pct = isUnlimited || !limit ? 0 : Math.min(100, (used / limit) * 100);
  const isNear = pct >= 80;
  const isOver = pct >= 100;
  const barColor = isOver ? "#EF4444" : isNear ? "#F59E0B" : "#10B981";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "0.85rem", color: isOver ? "#EF4444" : "#0F172A", fontWeight: 600 }}>
          {used}
          {isUnlimited ? "" : ` / ${limit}`}
        </span>
      </div>
      <div style={{ background: "#F1F5F9", borderRadius: 999, height: 6, overflow: "hidden" }}>
        <div style={{ background: isUnlimited ? "#94A3B8" : barColor, height: "100%", width: isUnlimited ? "100%" : `${pct}%`, transition: "width 0.3s ease" }} />
      </div>
      {isUnlimited && (
        <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: 4 }}>Nelimitat</div>
      )}
      {isNear && !isOver && !isUnlimited && (
        <div style={{ fontSize: "0.7rem", color: "#F59E0B", marginTop: 4, fontWeight: 600 }}>Aproape de limită</div>
      )}
      {isOver && (
        <div style={{ fontSize: "0.7rem", color: "#EF4444", marginTop: 4, fontWeight: 600 }}>Peste limita planului</div>
      )}
    </div>
  );
}
