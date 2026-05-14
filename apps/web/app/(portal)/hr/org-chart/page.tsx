"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Node {
  id: string; firstName: string; lastName: string; preferredName: string | null;
  photoUrl: string | null; currentJobTitle: string | null;
  workEmail: string | null; reports: Node[];
}

export default function OrgChartPage() {
  const [tree, setTree] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    api<Node[]>("/api/v1/hr/org-chart").then((res) => {
      if (res.success) setTree(res.data || []);
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  if (loading) return <div className="py-16 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă organigrama…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hr" className="text-[11px] no-underline" style={{ color: "var(--text-tertiary)" }}>HR</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Organigrama</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: "var(--text)" }}>Organigrama</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Click pe un angajat pentru a expanda echipa</p>
        </div>
        <div className="flex gap-1 items-center">
          <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="btn-secondary text-[11px]">−</button>
          <span className="text-[11px] w-12 text-center" style={{ color: "var(--text-secondary)" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="btn-secondary text-[11px]">+</button>
        </div>
      </div>

      <div className="panel p-4 overflow-auto" style={{ minHeight: 600 }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s" }}>
          {tree.length === 0 ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Niciun angajat încă. <Link href="/hr/employees" className="no-underline" style={{ color: "#6366F1" }}>Adaugă primul angajat →</Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {tree.map((root) => <Branch key={root.id} node={root} expanded={expanded} toggle={toggle} depth={0} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Branch({ node, expanded, toggle, depth }: { node: Node; expanded: Set<string>; toggle: (id: string) => void; depth: number }) {
  const isOpen = expanded.has(node.id);
  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div className="flex flex-col items-center">
      <Card node={node} expanded={isOpen} hasReports={hasReports} onToggle={() => toggle(node.id)} />
      {isOpen && hasReports && (
        <>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div className="relative flex gap-4 items-start">
            {node.reports.length > 1 && (
              <div className="absolute" style={{
                top: 0, left: "50%", transform: "translateX(-50%)",
                height: 1, width: `calc(100% - 240px)`, background: "var(--border)",
              }} />
            )}
            {node.reports.map((r) => (
              <div key={r.id} className="flex flex-col items-center">
                <div style={{ width: 1, height: 20, background: "var(--border)" }} />
                <Branch node={r} expanded={expanded} toggle={toggle} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ node, expanded, hasReports, onToggle }: { node: Node; expanded: boolean; hasReports: boolean; onToggle: () => void }) {
  return (
    <div className="panel p-3 transition-all" style={{ width: 220 }}>
      <Link href={`/hr/employees/${node.id}`} className="no-underline">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11.5px] font-semibold shrink-0"
            style={{ background: node.photoUrl ? `url(${node.photoUrl}) center/cover` : "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            {!node.photoUrl && `${node.firstName[0]}${node.lastName[0]}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: "var(--text)" }}>{node.preferredName || node.firstName} {node.lastName}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>{node.currentJobTitle || "—"}</p>
          </div>
        </div>
      </Link>
      {hasReports && (
        <button onClick={onToggle} className="w-full border-0 bg-transparent cursor-pointer text-[10px] font-medium pt-1 transition-colors" style={{ color: "#6366F1", borderTop: "1px solid var(--page-bg)" }}>
          {expanded ? "▲ Ascunde echipa" : `▼ Vezi ${node.reports.length} ${node.reports.length === 1 ? "raport" : "rapoarte"} direct${node.reports.length > 1 ? "e" : ""}`}
        </button>
      )}
    </div>
  );
}
