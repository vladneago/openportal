"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const HR_MODULES = [
  {
    href: "/hr/employees",
    title: "Angajați",
    description: "Director, profil, date personale, istoric.",
    icon: "users",
    color: "#0EA5E9",
    metric: "totalEmployees",
  },
  {
    href: "/hr/org-chart",
    title: "Organigrama",
    description: "Structura organizației, raportare, departamente.",
    icon: "tree",
    color: "#6366F1",
    metric: "totalDepartments",
  },
  {
    href: "/hr/recruiting",
    title: "Recrutare (ATS)",
    description: "Job-uri, candidați, interviuri, oferte.",
    icon: "search",
    color: "#F59E0B",
    metric: "openPositions",
  },
  {
    href: "/hr/leaves",
    title: "Concedii & Absențe",
    description: "Cereri, balanțe, calendar concedii, sărbători.",
    icon: "calendar",
    color: "#10B981",
    metric: "pendingLeaves",
  },
  {
    href: "/hr/performance",
    title: "Performanță",
    description: "Cicluri, obiective, evaluări, calibrare, 9-box.",
    icon: "target",
    color: "#EC4899",
    metric: "activeReviews",
  },
  {
    href: "/hr/learning",
    title: "Învățare & Dezvoltare",
    description: "Cursuri, învățare, certificări, competențe.",
    icon: "book",
    color: "#8B5CF6",
    metric: "totalCourses",
  },
  {
    href: "/hr/compensation",
    title: "Compensație",
    description: "Salarii, bonusuri, equity, planuri.",
    icon: "money",
    color: "#22C55E",
    metric: "avgSalary",
  },
  {
    href: "/hr/benefits",
    title: "Beneficii",
    description: "Planuri sănătate, pensie, asigurări.",
    icon: "shield",
    color: "#14B8A6",
    metric: "activePlans",
  },
  {
    href: "/hr/time",
    title: "Pontaj & Timp",
    description: "Timesheet-uri, schedule-uri, ore suplimentare.",
    icon: "clock",
    color: "#F97316",
    metric: "openTimesheets",
  },
  {
    href: "/hr/payroll",
    title: "Salarizare",
    description: "Run-uri payroll, fluturași, taxe, contribuții.",
    icon: "receipt",
    color: "#A855F7",
    metric: "lastPayrollAmount",
  },
  {
    href: "/hr/onboarding",
    title: "Onboarding",
    description: "Planuri & sarcini pentru angajați noi.",
    icon: "checklist",
    color: "#3B82F6",
    metric: "ongoingOnboarding",
  },
  {
    href: "/hr/surveys",
    title: "Sondaje",
    description: "Engagement, eNPS, exit, pulse.",
    icon: "chart",
    color: "#06B6D4",
    metric: "activeSurveys",
  },
];

export default function HRHubPage() {
  const [counts, setCounts] = useState<any>({});
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [headcount, setHeadcount] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api<any>("/api/v1/hr/analytics/headcount"),
      api<any>("/api/v1/hr/analytics/turnover?months=12"),
      api<any[]>("/api/v1/hr/employees?limit=1"),
      api<any[]>("/api/v1/hr/leaves?status=pending"),
      api<any[]>("/api/v1/hr/recruiting/jobs"),
      api<any[]>("/api/v1/hr/performance/cycles"),
      api<any[]>("/api/v1/hr/learning/courses"),
      api<any[]>("/api/v1/hr/surveys"),
      api<any[]>("/api/v1/hr/departments"),
      api<any[]>("/api/v1/hr/benefit-plans"),
    ]).then(([hc, to, emps, leaves, jobs, cycles, courses, surveys, depts, benefits]) => {
      setHeadcount(hc.data);
      setCounts({
        totalEmployees: emps.success ? (emps as any).meta?.total || 0 : 0,
        pendingLeaves: leaves.data?.length || 0,
        openPositions: (jobs.data || []).filter((j: any) => j.status === "open").length,
        activeReviews: (cycles.data || []).filter((c: any) => c.isActive).length,
        totalCourses: courses.data?.length || 0,
        activeSurveys: (surveys.data || []).filter((s: any) => s.status === "active" || s.status === "draft").length,
        totalDepartments: depts.data?.length || 0,
        activePlans: benefits.data?.length || 0,
        turnover: to.data?.turnoverRate || 0,
      });
      setRecentLeaves((leaves.data || []).slice(0, 5));
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Resurse Umane</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Management complet HR — angajați, recrutare, performanță, învățare, compensație, beneficii
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="panel p-3">
          <p className="text-[10.5px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Headcount</p>
          <p className="text-[24px] font-semibold mt-1" style={{ color: "var(--text)" }}>{headcount?.total ?? "—"}</p>
        </div>
        <div className="panel p-3">
          <p className="text-[10.5px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Turnover (12 luni)</p>
          <p className="text-[24px] font-semibold mt-1" style={{ color: "var(--text)" }}>
            {counts.turnover ? `${Number(counts.turnover).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="panel p-3">
          <p className="text-[10.5px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Posturi deschise</p>
          <p className="text-[24px] font-semibold mt-1" style={{ color: "var(--text)" }}>{counts.openPositions ?? "—"}</p>
        </div>
        <div className="panel p-3">
          <p className="text-[10.5px] uppercase tracking-widest font-medium" style={{ color: "var(--text-tertiary)" }}>Cereri concediu</p>
          <p className="text-[24px] font-semibold mt-1" style={{ color: "var(--text)" }}>{counts.pendingLeaves ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Modules grid */}
        <div className="lg:col-span-2">
          <h2 className="text-[12.5px] font-medium mb-3" style={{ color: "var(--text)" }}>Module HR</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {HR_MODULES.map((m) => (
              <Link key={m.href} href={m.href}
                className="panel p-3 transition-all no-underline"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = m.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[12px] font-semibold mb-2" style={{ background: m.color }}>
                  {m.title.charAt(0)}
                </div>
                <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{m.title}</p>
                <p className="text-[10.5px] mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{m.description}</p>
                {counts[m.metric] !== undefined && counts[m.metric] !== null && (
                  <p className="text-[14px] font-medium mt-1.5" style={{ color: m.color }}>{counts[m.metric]}</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar — recent activity */}
        <div className="space-y-3">
          <div className="panel p-3">
            <h3 className="text-[12px] font-medium mb-2" style={{ color: "var(--text)" }}>Cereri concediu de aprobat</h3>
            {recentLeaves.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>—</p>}
            {recentLeaves.map((l) => (
              <div key={l.id} className="text-[11px] py-1.5" style={{ borderTop: "1px solid var(--page-bg)" }}>
                <p className="font-medium" style={{ color: "var(--text)" }}>{l.employeeFirstName} {l.employeeLastName}</p>
                <p style={{ color: "var(--text-tertiary)" }}>
                  {new Date(l.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
                  {" — "}
                  {new Date(l.endDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
                  {" · "}{l.totalDays} zile
                </p>
              </div>
            ))}
          </div>

          <div className="panel p-3">
            <h3 className="text-[12px] font-medium mb-2" style={{ color: "var(--text)" }}>Distribuție pe departament</h3>
            {(headcount?.byDepartment || []).slice(0, 6).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 text-[11px]">
                <div className="flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{d.departmentId?.slice(0, 8) || "—"}</div>
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--page-bg)" }}>
                  <div className="h-full" style={{
                    background: "#6366F1",
                    width: `${(d.count / (headcount?.total || 1)) * 100}%`,
                  }} />
                </div>
                <span className="text-[11px] font-medium w-8 text-right" style={{ color: "var(--text)" }}>{d.count}</span>
              </div>
            ))}
            {(!headcount?.byDepartment || headcount.byDepartment.length === 0) && (
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Niciun angajat încă.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
