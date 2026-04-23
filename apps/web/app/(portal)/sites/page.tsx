"use client";

const SITES = [
  { name: "Intranet Acme", slug: "intranet", type: "Comunicare", letter: "I", color: "#6366F1", desc: "Portalul principal al companiei.", members: 1, updated: "acum 2 min" },
  { name: "Echipa IT", slug: "it", type: "Echipă", letter: "E", color: "#0EA5E9", desc: "Documentație tehnică și runbooks.", members: 1, updated: "acum 2 min" },
  { name: "Proiect Phoenix", slug: "phoenix", type: "Proiect", letter: "P", color: "#F59E0B", desc: "Transformare digitală 2025.", members: 1, updated: "acum 5 min" },
  { name: "Resurse Umane", slug: "hr", type: "Echipă", letter: "R", color: "#10B981", desc: "Politici și proceduri HR.", members: 1, updated: "acum 5 min" },
];

export default function SitesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Site-uri</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{SITES.length} site-uri active în Acme Corporation</p>
        </div>
        <button className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Site nou
        </button>
      </div>

      {/* Table */}
      <div className="panel">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <div className="col-span-5">Nume</div>
          <div className="col-span-2">Tip</div>
          <div className="col-span-2">Membri</div>
          <div className="col-span-3">Actualizat</div>
        </div>

        {/* Rows */}
        {SITES.map((site) => (
          <a
            key={site.slug}
            href={`/sites/${site.slug}`}
            className="grid grid-cols-12 gap-4 items-center px-4 py-3 transition-colors no-underline"
            style={{ borderBottom: "1px solid var(--page-bg)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-semibold shrink-0"
                style={{ background: site.color + "12", color: site.color }}>{site.letter}</div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{site.name}</p>
                <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{site.desc}</p>
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>
                {site.type}
              </span>
            </div>
            <div className="col-span-2 text-xs" style={{ color: "var(--text-secondary)" }}>{site.members}</div>
            <div className="col-span-3 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{site.updated}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
