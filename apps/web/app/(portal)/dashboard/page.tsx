"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getUser } from "@/lib/api";

interface AppointmentRow {
  appointment: {
    id: string;
    bookingCode: string;
    startAt: string;
    endAt: string;
    status: string;
    priceSnapshot: string;
    currencySnapshot: string;
    channel: string;
    customerNote: string | null;
  };
  customer: { firstName: string; lastName: string | null; phone: string | null };
  service: { name: string; durationMinutes: number; color: string };
  resource: { name: string; color: string };
}

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string | null;
  createdAt: string;
  totalSpent: string;
}

interface InvoiceRow {
  id: string;
  documentNumber: string;
  status: string;
  totalAmount: string;
  amountDue: string;
  currency: string;
  issueDate: string;
  customerName: string;
}

interface DailyReport {
  date: string;
  summary: {
    transactions: number;
    grossRevenue: string;
    totalVat: string;
    totalDiscount: string;
    totalRefunded: string;
    tips: string;
  };
}

interface SiteItem {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmat",
  checked_in: "Check-in",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
  no_show: "No-show",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  checked_in: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#52525B",
  cancelled: "#EF4444",
  no_show: "#EF4444",
};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatTime(s: string): string {
  return new Date(s).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointmentsToday, setAppointmentsToday] = useState<AppointmentRow[]>([]);
  const [appointmentsWeek, setAppointmentsWeek] = useState<AppointmentRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [posReport, setPosReport] = useState<DailyReport | null>(null);
  const [sites, setSites] = useState<SiteItem[]>([]);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    async function load() {
      // First-run check
      try {
        const dismissed =
          typeof window !== "undefined" && localStorage.getItem("onboarding_dismissed") === "1";
        if (!dismissed) {
          const [resCheck, svcCheck] = await Promise.all([
            api("/api/v1/booking/resources"),
            api("/api/v1/booking/services"),
          ]);
          const resources = (resCheck.data as unknown[]) || [];
          const services = (svcCheck.data as unknown[]) || [];
          if (resources.length === 0 && services.length === 0) {
            router.replace("/onboarding");
            return;
          }
        }
      } catch {
        // ignore
      }

      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfDay(addDays(now, -6));
      const weekEnd = endOfDay(now);
      const dateStr = todayStart.toISOString().slice(0, 10);

      const [apptTodayRes, apptWeekRes, custRes, invRes, posRes, sitesRes] = await Promise.all([
        api(
          `/api/v1/booking/appointments?from=${todayStart.toISOString()}&to=${todayEnd.toISOString()}&limit=100`,
        ),
        api(
          `/api/v1/booking/appointments?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}&limit=500`,
        ),
        api(`/api/v1/booking/customers?limit=200`),
        api(`/api/v1/billing/invoices?limit=20`),
        api(`/api/v1/pos/reports/daily?date=${dateStr}`),
        api(`/api/v1/site-builder/sites`),
      ]);

      if (apptTodayRes.success) setAppointmentsToday((apptTodayRes.data as AppointmentRow[]) || []);
      if (apptWeekRes.success) setAppointmentsWeek((apptWeekRes.data as AppointmentRow[]) || []);
      if (custRes.success) setCustomers((custRes.data as CustomerRow[]) || []);
      if (invRes.success) setInvoices((invRes.data as InvoiceRow[]) || []);
      if (posRes.success) setPosReport((posRes.data as DailyReport) || null);
      if (sitesRes.success) setSites((sitesRes.data as SiteItem[]) || []);

      setLoading(false);
    }
    load();
  }, [router]);

  const stats = useMemo(() => {
    const todayConfirmed = appointmentsToday.filter((a) =>
      ["confirmed", "checked_in", "in_progress", "completed"].includes(a.appointment.status),
    );
    const todayRevenue = todayConfirmed.reduce(
      (sum, a) => sum + Number(a.appointment.priceSnapshot),
      0,
    );
    const posRevenue = posReport ? Number(posReport.summary.grossRevenue) : 0;
    const totalToday = todayRevenue + posRevenue;

    const sevenDaysAgo = addDays(new Date(), -7);
    const newCustomers = customers.filter(
      (c) => new Date(c.createdAt).getTime() > sevenDaysAgo.getTime(),
    ).length;

    const pendingInvoices = invoices.filter(
      (i) => i.status === "issued" || i.status === "sent" || i.status === "partially_paid",
    );
    const totalOutstanding = pendingInvoices.reduce(
      (sum, i) => sum + Number(i.amountDue),
      0,
    );

    const weekConfirmed = appointmentsWeek.filter((a) =>
      ["confirmed", "checked_in", "in_progress", "completed"].includes(a.appointment.status),
    );
    const weekRevenue = weekConfirmed.reduce(
      (sum, a) => sum + Number(a.appointment.priceSnapshot),
      0,
    );

    // Top services last 7 days
    const serviceStats = new Map<string, { count: number; revenue: number; color: string }>();
    for (const a of weekConfirmed) {
      const k = a.service.name;
      const entry = serviceStats.get(k) || { count: 0, revenue: 0, color: a.service.color };
      entry.count += 1;
      entry.revenue += Number(a.appointment.priceSnapshot);
      serviceStats.set(k, entry);
    }
    const topServices = Array.from(serviceStats.entries())
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      appointmentsTodayCount: appointmentsToday.length,
      todayConfirmed: todayConfirmed.length,
      todayRevenue: totalToday,
      newCustomers,
      pendingInvoicesCount: pendingInvoices.length,
      totalOutstanding,
      weekRevenue,
      weekAppointments: weekConfirmed.length,
      topServices,
    };
  }, [appointmentsToday, appointmentsWeek, customers, invoices, posReport]);

  // Sort today's appointments by start time
  const sortedToday = useMemo(() => {
    return [...appointmentsToday].sort(
      (a, b) => new Date(a.appointment.startAt).getTime() - new Date(b.appointment.startAt).getTime(),
    );
  }, [appointmentsToday]);

  const nextAppt = sortedToday.find(
    (a) =>
      new Date(a.appointment.startAt).getTime() > Date.now() &&
      ["confirmed", "checked_in"].includes(a.appointment.status),
  );

  const publishedSite = sites.find((s) => s.status === "published");

  if (loading) {
    return (
      <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        Se încarcă…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          className="text-xl font-medium tracking-tight"
          style={{ color: "var(--text)", letterSpacing: "-0.025em" }}
        >
          Bună{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {nextAppt ? (
            <>
              Următoarea programare: <strong style={{ color: "var(--text)" }}>{formatTime(nextAppt.appointment.startAt)}</strong>{" "}
              cu <strong style={{ color: "var(--text)" }}>{nextAppt.customer.firstName}{nextAppt.customer.lastName ? ` ${nextAppt.customer.lastName}` : ""}</strong>{" "}
              pentru {nextAppt.service.name}.
            </>
          ) : appointmentsToday.length > 0 ? (
            "Astăzi nu mai sunt programări viitoare."
          ) : (
            "Niciuna programare azi. Profită de timpul liber!"
          )}
        </p>
      </div>

      {/* Top 4 KPIs */}
      <div
        className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden mb-6"
        style={{ background: "var(--border-hover)" }}
      >
        <SoloMetric
          label="Programări azi"
          value={String(stats.appointmentsTodayCount)}
          sub={`${stats.todayConfirmed} confirmate`}
          color="#6366F1"
        />
        <SoloMetric
          label="Încasări azi"
          value={`${stats.todayRevenue.toFixed(2)} RON`}
          sub={posReport ? `${posReport.summary.transactions} tranzacții POS` : "din programări"}
          color="#10B981"
        />
        <SoloMetric
          label="Clienți noi"
          value={String(stats.newCustomers)}
          sub="ultimele 7 zile"
          color="#EC4899"
        />
        <SoloMetric
          label="Facturi neîncasate"
          value={`${stats.totalOutstanding.toFixed(2)} RON`}
          sub={`${stats.pendingInvoicesCount} facturi`}
          color={stats.pendingInvoicesCount > 0 ? "#F59E0B" : "#52525B"}
        />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* Left */}
        <div>
          {/* Today's appointments */}
          <SectionHeader
            title={`Programări azi (${sortedToday.length})`}
            action={
              <Link
                href="/booking/calendar"
                className="no-underline text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Vezi calendar →
              </Link>
            }
          />
          <div
            className="rounded-lg overflow-hidden mt-3 mb-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {sortedToday.length === 0 ? (
              <div className="py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                <p className="text-sm">Nicio programare azi.</p>
                <Link
                  href="/booking"
                  className="text-xs font-medium no-underline"
                  style={{ color: "var(--accent)" }}
                >
                  + Adaugă o programare
                </Link>
              </div>
            ) : (
              sortedToday.map(({ appointment, customer, service, resource }) => {
                const isPast = new Date(appointment.startAt).getTime() < Date.now() &&
                  !["confirmed"].includes(appointment.status);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      opacity: ["cancelled", "no_show"].includes(appointment.status) ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="font-mono text-sm font-semibold tabular-nums shrink-0"
                      style={{ color: "var(--text)", width: 50 }}
                    >
                      {formatTime(appointment.startAt)}
                    </div>
                    <div
                      className="w-1 h-9 rounded-full shrink-0"
                      style={{ background: service.color || resource.color || "#6366F1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {customer.firstName}
                        {customer.lastName ? ` ${customer.lastName}` : ""}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {service.name} · {resource.name}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: (STATUS_COLORS[appointment.status] || "#71717A") + "22",
                        color: STATUS_COLORS[appointment.status] || "#71717A",
                      }}
                    >
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </span>
                    <div
                      className="text-sm font-semibold tabular-nums shrink-0"
                      style={{ color: isPast ? "var(--text-tertiary)" : "var(--text)" }}
                    >
                      {Number(appointment.priceSnapshot).toFixed(0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Top services last 7 days */}
          {stats.topServices.length > 0 && (
            <>
              <SectionHeader title="Top servicii (7 zile)" />
              <div
                className="rounded-lg p-4 mt-3 mb-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {stats.topServices.map((s) => {
                  const maxRevenue = stats.topServices[0]?.revenue || 1;
                  const pct = (s.revenue / maxRevenue) * 100;
                  return (
                    <div key={s.name} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                          {s.name}
                        </span>
                        <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                          {s.count} programări · {s.revenue.toFixed(2)} RON
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: s.color, minWidth: pct > 0 ? 4 : 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick actions */}
          <SectionHeader title="Acțiuni rapide" />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: "Programare nouă", desc: "Adaugă manual o rezervare", href: "/booking" },
              { label: "Calendar săptămânal", desc: "Vezi grila de programări", href: "/booking/calendar" },
              { label: "Facturează", desc: "Emite o factură nouă", href: "/billing" },
              { label: "POS — vinde", desc: "Casă de marcat", href: "/pos" },
              { label: "Editează site", desc: "Modifică site public", href: "/site-builder" },
              { label: "Knowledge AI", desc: "Pregătește chat widget", href: "/chat-widget/knowledge" },
            ].map((qa) => (
              <Link key={qa.label} href={qa.href} className="no-underline">
                <div
                  className="rounded-lg px-4 py-3 transition-all cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
                    {qa.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {qa.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Site card */}
          <SectionHeader
            title="Site online"
            action={
              <Link
                href="/site-builder"
                className="no-underline text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Toate →
              </Link>
            }
          />
          <div className="panel mt-3 p-4">
            {sites.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Nu ai niciun site online încă.
                </p>
                <Link
                  href="/site-builder"
                  className="text-xs font-medium no-underline"
                  style={{ color: "var(--accent)" }}
                >
                  + Creează site
                </Link>
              </div>
            ) : (
              <>
                {sites.map((s) => (
                  <div
                    key={s.id}
                    className="mb-2 last:mb-0 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {s.name}
                      </div>
                      <div className="text-[11px] font-mono truncate" style={{ color: "var(--text-tertiary)" }}>
                        {s.subdomain}.openportal.app
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2"
                      style={{
                        background: s.status === "published" ? "#10B98122" : "#F59E0B22",
                        color: s.status === "published" ? "#10B981" : "#F59E0B",
                      }}
                    >
                      {s.status === "published" ? "Publicat" : "Ciornă"}
                    </span>
                  </div>
                ))}
                {publishedSite && (
                  <a
                    href={`/s/${publishedSite.subdomain}`}
                    target="_blank"
                    rel="noopener"
                    className="block mt-3 text-center text-xs font-medium no-underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Deschide site public ↗
                  </a>
                )}
              </>
            )}
          </div>

          {/* Outstanding invoices */}
          {stats.pendingInvoicesCount > 0 && (
            <div className="mt-6">
              <SectionHeader
                title="Facturi de încasat"
                action={
                  <Link
                    href="/billing"
                    className="no-underline text-[11px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Toate →
                  </Link>
                }
              />
              <div className="panel mt-3">
                {invoices
                  .filter((i) =>
                    ["issued", "sent", "partially_paid"].includes(i.status),
                  )
                  .slice(0, 5)
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-2 px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                          {inv.documentNumber}
                        </div>
                        <div className="text-xs truncate" style={{ color: "var(--text)" }}>
                          {inv.customerName}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                        {Number(inv.amountDue).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Week summary */}
          <div className="mt-6">
            <SectionHeader title="Săptămâna aceasta" />
            <div className="panel p-4 mt-3">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>Programări</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>
                    {stats.weekAppointments}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>Venit estimat</span>
                  <span style={{ color: "#10B981", fontWeight: 600 }}>
                    {stats.weekRevenue.toFixed(2)} RON
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>Clienți noi</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>
                    {stats.newCustomers}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

function SoloMetric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="px-6 py-5" style={{ background: "var(--surface)" }}>
      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-[24px] font-medium leading-none tabular-nums"
          style={{ color, letterSpacing: "-0.04em" }}
        >
          {value}
        </span>
      </div>
      <p className="text-[10.5px] mt-2" style={{ color: "var(--text-tertiary)" }}>
        {sub}
      </p>
    </div>
  );
}
