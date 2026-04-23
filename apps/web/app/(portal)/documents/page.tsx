"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface DocItem {
  id: string;
  name: string;
  type: "folder" | "file";
  extension?: string;
  sizeBytes?: number;
  modifiedBy?: string;
  updatedAt?: string;
  mimeType?: string;
}

// Mock data until API is connected
const MOCK_ITEMS: DocItem[] = [
  { id: "1", name: "Contracte", type: "folder" },
  { id: "2", name: "Rapoarte Q1 2025", type: "folder" },
  { id: "3", name: "Template-uri", type: "folder" },
  { id: "4", name: "Politici Interne", type: "folder" },
  { id: "5", name: "Manual Angajat 2025.pdf", type: "file", extension: "pdf", sizeBytes: 2457600, updatedAt: "acum 2 ore" },
  { id: "6", name: "Buget Q2.xlsx", type: "file", extension: "xlsx", sizeBytes: 156000, updatedAt: "acum 5 ore" },
  { id: "7", name: "Prezentare Board.pptx", type: "file", extension: "pptx", sizeBytes: 8945000, updatedAt: "ieri" },
  { id: "8", name: "Logo OpenPortal.png", type: "file", extension: "png", sizeBytes: 45000, updatedAt: "acum 3 zile" },
  { id: "9", name: "Notite sedinta.docx", type: "file", extension: "docx", sizeBytes: 28000, updatedAt: "acum 1 sapt" },
];

export default function DocumentsPage() {
  const [items] = useState<DocItem[]>(MOCK_ITEMS);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Documente" },
  ]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (ext?: string) => {
    const colors: Record<string, string> = {
      pdf: "#EF4444", docx: "#3B82F6", doc: "#3B82F6", xlsx: "#10B981", xls: "#10B981",
      pptx: "#F59E0B", ppt: "#F59E0B", png: "#8B5CF6", jpg: "#8B5CF6", jpeg: "#8B5CF6",
      gif: "#8B5CF6", svg: "#8B5CF6", mp4: "#EC4899", zip: "#71717A", rar: "#71717A",
    };
    return colors[ext || ""] || "#A1A1AA";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      console.log("Files dropped:", files.map((f) => f.name));
      // TODO: call upload API
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>
            Documente
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            Gestionează fișierele organizației
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowNewFolder(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Folder nou
          </button>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Încarcă
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
            const files = Array.from(e.target.files || []);
            console.log("Files selected:", files.map((f) => f.name));
          }} />
        </div>
      </div>

      {/* Toolbar: Breadcrumbs + View toggle */}
      <div className="flex items-center justify-between mb-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-[12.5px]">
          {breadcrumbs.map((bc, i) => (
            <span key={bc.id || "root"} className="flex items-center gap-1">
              {i > 0 && <span style={{ color: "var(--text-muted)" }}>/</span>}
              <button
                className="border-0 bg-transparent cursor-pointer px-1 py-0.5 rounded transition-colors"
                style={{
                  color: i === breadcrumbs.length - 1 ? "var(--text)" : "var(--text-tertiary)",
                  fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {bc.name}
              </button>
            </span>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-px rounded-md overflow-hidden" style={{ background: "var(--border)" }}>
          <button onClick={() => setViewMode("list")}
            className="border-0 cursor-pointer px-2 py-1.5 transition-colors"
            style={{ background: viewMode === "list" ? "var(--surface)" : "transparent", color: viewMode === "list" ? "var(--text)" : "var(--text-tertiary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </button>
          <button onClick={() => setViewMode("grid")}
            className="border-0 cursor-pointer px-2 py-1.5 transition-colors"
            style={{ background: viewMode === "grid" ? "var(--surface)" : "transparent", color: viewMode === "grid" ? "var(--text)" : "var(--text-tertiary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="panel transition-all duration-200"
        style={{
          borderColor: dragOver ? "var(--accent)" : undefined,
          borderStyle: dragOver ? "dashed" : undefined,
          boxShadow: dragOver ? "0 0 0 3px rgba(99,102,241,0.1)" : undefined,
        }}
      >
        {/* New folder input */}
        {showNewFolder && (
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            <input
              autoFocus
              className="border-0 bg-transparent text-xs outline-none flex-1"
              style={{ color: "var(--text)" }}
              placeholder="Nume folder..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) { setShowNewFolder(false); setNewFolderName(""); }
                if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
              }}
            />
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Enter pentru confirmare · Esc pentru anulare</span>
          </div>
        )}

        {/* Table header */}
        {viewMode === "list" && (
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
            style={{ gridTemplateColumns: "1fr 100px 120px 100px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Nume</span>
            <span>Dimensiune</span>
            <span>Modificat</span>
            <span></span>
          </div>
        )}

        {/* File listing */}
        {viewMode === "list" ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 items-center px-4 py-2.5 transition-colors cursor-pointer"
              style={{ gridTemplateColumns: "1fr 100px 120px 100px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.type === "folder" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                ) : (
                  <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: getFileIcon(item.extension) }}>
                    {(item.extension || "").toUpperCase().slice(0, 3)}
                  </div>
                )}
                <span className="text-[12.5px] truncate" style={{ color: "var(--text)", fontWeight: item.type === "folder" ? 500 : 400 }}>
                  {item.name}
                </span>
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {item.type === "folder" ? "—" : formatSize(item.sizeBytes)}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {item.updatedAt || "—"}
              </span>
              <div className="flex items-center justify-end gap-1">
                <button className="border-0 bg-transparent p-1 rounded cursor-pointer transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Grid view */
          <div className="grid grid-cols-5 gap-3 p-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-3 transition-all cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="flex items-center justify-center h-16 mb-2">
                  {item.type === "folder" ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: getFileIcon(item.extension) }}>
                      {(item.extension || "").toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[11.5px] truncate text-center" style={{ color: "var(--text)", fontWeight: item.type === "folder" ? 500 : 400 }}>{item.name}</p>
                {item.sizeBytes && <p className="text-[10px] text-center mt-0.5" style={{ color: "var(--text-tertiary)" }}>{formatSize(item.sizeBytes)}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Drop zone overlay */}
        {dragOver && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--accent)" }}>Eliberează pentru a încărca fișierele</p>
          </div>
        )}
      </div>
    </div>
  );
}
