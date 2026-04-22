"use client";

export default function SitesPage() {
  const sites = [
    { name: "Intranet Acme", slug: "intranet", type: "Comunicare", desc: "Portalul principal al companiei.", members: 1, updated: "acum câteva secunde" },
    { name: "Echipa IT", slug: "it", type: "Echipă", desc: "Documentație tehnică și runbooks.", members: 1, updated: "acum câteva secunde" },
    { name: "Proiect Phoenix", slug: "phoenix", type: "Proiect", desc: "Transformare digitală 2025.", members: 1, updated: "acum câteva secunde" },
    { name: "Resurse Umane", slug: "hr", type: "Echipă", desc: "Politici și proceduri HR.", members: 1, updated: "acum câteva secunde" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <h1 className="text-lg font-medium tracking-tight" style={{ color: "var(--color-text)" }}>
            Site-uri
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            {sites.length} site-uri active
          </p>
        </div>
        <button className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Site nou
        </button>
      </div>

      {/* Table-like list */}
      <div className="fade-in stagger-1">
        {/* Header row */}
        <div
          className="grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <div className="col-span-5">Nume</div>
          <div className="col-span-2">Tip</div>
          <div className="col-span-2">Membri</div>
          <div className="col-span-3">Actualizat</div>
        </div>

        {/* Rows */}
        <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          {sites.map((site) => (
            <a
              key={site.slug}
              href={`/sites/${site.slug}`}
              className="grid grid-cols-12 gap-4 items-center px-3 py-3 transition-colors"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-medium shrink-0"
                  style={{ background: "var(--color-subtle)", color: "var(--color-text-secondary)" }}
                >
                  {site.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--color-text)" }}>
                    {site.name}
                  </p>
                  <p className="text-[10.5px] truncate" style={{ color: "var(--color-text-tertiary)" }}>
                    {site.desc}
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <span
                  className="text-[10.5px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--color-subtle)", color: "var(--color-text-secondary)" }}
                >
                  {site.type}
                </span>
              </div>
              <div className="col-span-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {site.members}
              </div>
              <div className="col-span-3 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                {site.updated}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
