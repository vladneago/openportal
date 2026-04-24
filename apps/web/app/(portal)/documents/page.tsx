"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

interface LibraryItem {
  id: string;
  title: string;
  slug: string;
  siteId: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

interface DocItem {
  id: string;
  name: string;
  extension: string | null;
  mimeType: string | null;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
  updatedAt: string;
}

type ViewItem = { type: "folder"; data: FolderItem } | { type: "file"; data: DocItem };

export default function DocumentsPage() {
  // State
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [selectedLib, setSelectedLib] = useState<LibraryItem | null>(null);
  const [items, setItems] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewLib, setShowNewLib] = useState(false);
  const [newLibName, setNewLibName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load libraries on mount
  useEffect(() => {
    loadLibraries();
  }, []);

  // Load contents when library or folder changes
  useEffect(() => {
    if (selectedLib) loadContents();
  }, [selectedLib, currentFolderId]);

  async function loadLibraries() {
    setLoading(true);
    try {
      const res = await api("/api/v1/documents/libraries");
      if (res.success && res.data) {
        setLibraries(res.data);
        if (res.data.length > 0 && !selectedLib) {
          setSelectedLib(res.data[0]);
          setBreadcrumbs([{ id: null, name: res.data[0].title }]);
        }
      }
    } catch (e) { console.error("Failed to load libraries:", e); }
    setLoading(false);
  }

  async function loadContents() {
    if (!selectedLib) return;
    try {
      const [foldersRes, filesRes] = await Promise.all([
        api(`/api/v1/documents/folders?libraryId=${selectedLib.id}${currentFolderId ? `&parentId=${currentFolderId}` : ""}`),
        api(`/api/v1/documents/files?libraryId=${selectedLib.id}${currentFolderId ? `&folderId=${currentFolderId}` : ""}`),
      ]);

      const viewItems: ViewItem[] = [];
      if (foldersRes.success && foldersRes.data) {
        foldersRes.data.forEach((f: FolderItem) => viewItems.push({ type: "folder", data: f }));
      }
      if (filesRes.success && filesRes.data) {
        filesRes.data.forEach((d: DocItem) => viewItems.push({ type: "file", data: d }));
      }
      setItems(viewItems);
    } catch (e) { console.error("Failed to load contents:", e); }
  }

  async function handleCreateLibrary() {
    if (!newLibName.trim()) return;
    // Get first site to attach library to
    const sitesRes = await api("/api/v1/sites");
    if (!sitesRes.success || !sitesRes.data?.length) return;

    const slug = newLibName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    const res = await api("/api/v1/documents/libraries", {
      method: "POST",
      body: JSON.stringify({ siteId: sitesRes.data[0].id, title: newLibName.trim(), slug }),
    });

    if (res.success) {
      setShowNewLib(false);
      setNewLibName("");
      await loadLibraries();
      if (res.data) {
        setSelectedLib(res.data);
        setBreadcrumbs([{ id: null, name: res.data.title }]);
        setCurrentFolderId(null);
      }
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !selectedLib) return;
    const res = await api("/api/v1/documents/folders", {
      method: "POST",
      body: JSON.stringify({
        libraryId: selectedLib.id,
        name: newFolderName.trim(),
        parentId: currentFolderId || undefined,
      }),
    });

    if (res.success) {
      setShowNewFolder(false);
      setNewFolderName("");
      await loadContents();
    }
  }

  async function handleUpload(files: File[]) {
    if (!selectedLib || files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("libraryId", selectedLib.id);
      if (currentFolderId) formData.append("folderId", currentFolderId);

      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/documents/files/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          body: formData,
        });
      } catch (e) { console.error("Upload failed:", file.name, e); }
    }

    setUploading(false);
    await loadContents();
  }

  function navigateToFolder(folderId: string, folderName: string) {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
  }

  function navigateToBreadcrumb(index: number) {
    const bc = breadcrumbs[index];
    setCurrentFolderId(bc.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  }

  async function handleDelete(item: ViewItem) {
    if (item.type === "file") {
      await api(`/api/v1/documents/files/${item.data.id}`, { method: "DELETE" });
      await loadContents();
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  }, [selectedLib, currentFolderId]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileColor = (ext: string | null) => {
    const m: Record<string, string> = { pdf: "#EF4444", docx: "#3B82F6", doc: "#3B82F6", xlsx: "#10B981", xls: "#10B981", pptx: "#F59E0B", ppt: "#F59E0B", png: "#8B5CF6", jpg: "#8B5CF6", jpeg: "#8B5CF6", gif: "#8B5CF6", svg: "#8B5CF6", mp4: "#EC4899", zip: "#71717A", txt: "#71717A", md: "#71717A" };
    return m[ext || ""] || "#A1A1AA";
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "acum";
    if (mins < 60) return `acum ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `acum ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `acum ${days}z`;
  };

  // ─── No libraries yet ───
  if (!loading && libraries.length === 0 && !showNewLib) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Documente</h1>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>Gestionează fișierele organizației</p>
          </div>
        </div>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Nicio bibliotecă de documente</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--text-tertiary)" }}>Creează prima bibliotecă pentru a începe să încarci fișiere.</p>
          <button className="btn-primary" onClick={() => setShowNewLib(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Bibliotecă nouă
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Documente</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {selectedLib ? selectedLib.title : "Gestionează fișierele organizației"}
            {uploading && <span style={{ color: "var(--accent)" }}> · Se încarcă...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowNewLib(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
            Bibliotecă
          </button>
          <button className="btn-secondary" onClick={() => setShowNewFolder(true)} disabled={!selectedLib}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Folder
          </button>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={!selectedLib}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Încarcă
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(Array.from(e.target.files || []))} />
        </div>
      </div>

      {/* New library input */}
      {showNewLib && (
        <div className="panel p-4 mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Numele bibliotecii</label>
            <input className="input" autoFocus placeholder="ex: Contracte, Rapoarte, Marketing..." value={newLibName} onChange={(e) => setNewLibName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateLibrary(); if (e.key === "Escape") { setShowNewLib(false); setNewLibName(""); } }} />
          </div>
          <button className="btn-primary shrink-0" onClick={handleCreateLibrary}>Creează</button>
          <button className="btn-secondary shrink-0" onClick={() => { setShowNewLib(false); setNewLibName(""); }}>Anulează</button>
        </div>
      )}

      {/* Library tabs */}
      {libraries.length > 0 && (
        <div className="flex items-center gap-1 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          {libraries.map((lib) => (
            <button key={lib.id}
              onClick={() => { setSelectedLib(lib); setBreadcrumbs([{ id: null, name: lib.title }]); setCurrentFolderId(null); }}
              className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{
                background: selectedLib?.id === lib.id ? "var(--text)" : "transparent",
                color: selectedLib?.id === lib.id ? "#fff" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { if (selectedLib?.id !== lib.id) e.currentTarget.style.background = "var(--border)"; }}
              onMouseLeave={(e) => { if (selectedLib?.id !== lib.id) e.currentTarget.style.background = "transparent"; }}
            >{lib.title}</button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-[12.5px]">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span style={{ color: "var(--text-muted)" }}>/</span>}
              <button className="border-0 bg-transparent cursor-pointer px-1 py-0.5 rounded transition-colors"
                style={{ color: i === breadcrumbs.length - 1 ? "var(--text)" : "var(--text-tertiary)", fontWeight: i === breadcrumbs.length - 1 ? 500 : 400 }}
                onClick={() => navigateToBreadcrumb(i)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >{bc.name}</button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-px rounded-md overflow-hidden" style={{ background: "var(--border)" }}>
          <button onClick={() => setViewMode("list")} className="border-0 cursor-pointer px-2 py-1.5 transition-colors"
            style={{ background: viewMode === "list" ? "var(--surface)" : "transparent", color: viewMode === "list" ? "var(--text)" : "var(--text-tertiary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className="border-0 cursor-pointer px-2 py-1.5 transition-colors"
            style={{ background: viewMode === "grid" ? "var(--surface)" : "transparent", color: viewMode === "grid" ? "var(--text)" : "var(--text-tertiary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className="panel transition-all duration-200"
        style={{ borderColor: dragOver ? "var(--accent)" : undefined, borderStyle: dragOver ? "dashed" : undefined, boxShadow: dragOver ? "0 0 0 3px rgba(99,102,241,0.1)" : undefined }}>

        {/* New folder inline */}
        {showNewFolder && (
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            <input autoFocus className="border-0 bg-transparent text-xs outline-none flex-1" style={{ color: "var(--text)" }}
              placeholder="Nume folder..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); } }} />
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Enter · Esc</span>
          </div>
        )}

        {/* Table header */}
        {viewMode === "list" && items.length > 0 && (
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
            style={{ gridTemplateColumns: "1fr 100px 120px 60px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>Nume</span><span>Dimensiune</span><span>Modificat</span><span></span>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>
        ) : items.length === 0 && !showNewFolder ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Folder gol</p>
            <p className="text-[12px] mt-1 mb-4" style={{ color: "var(--text-tertiary)" }}>Trage fișiere aici sau apasă Încarcă</p>
          </div>
        ) : viewMode === "list" ? (
          items.map((item) => (
            <div key={item.data.id}
              className="grid gap-4 items-center px-4 py-2.5 transition-colors cursor-pointer"
              style={{ gridTemplateColumns: "1fr 100px 120px 60px", borderBottom: "1px solid var(--page-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => { if (item.type === "folder") navigateToFolder(item.data.id, (item.data as FolderItem).name); }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.type === "folder" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                ) : (
                  <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: getFileColor((item.data as DocItem).extension) }}>
                    {((item.data as DocItem).extension || "").toUpperCase().slice(0, 3)}
                  </div>
                )}
                <span className="text-[12.5px] truncate" style={{ color: "var(--text)", fontWeight: item.type === "folder" ? 500 : 400 }}>
                  {item.type === "folder" ? (item.data as FolderItem).name : (item.data as DocItem).name}
                </span>
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {item.type === "folder" ? "—" : formatSize((item.data as DocItem).sizeBytes)}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {timeAgo(item.data.createdAt || item.data.updatedAt)}
              </span>
              <div className="flex items-center justify-end">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                  className="border-0 bg-transparent p-1 rounded cursor-pointer transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-5 gap-3 p-4">
            {items.map((item) => (
              <div key={item.data.id} className="rounded-lg p-3 transition-all cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
                onClick={() => { if (item.type === "folder") navigateToFolder(item.data.id, (item.data as FolderItem).name); }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="flex items-center justify-center h-12 mb-2">
                  {item.type === "folder" ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: getFileColor((item.data as DocItem).extension) }}>
                      {((item.data as DocItem).extension || "").toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[11px] truncate text-center" style={{ color: "var(--text)", fontWeight: item.type === "folder" ? 500 : 400 }}>
                  {item.type === "folder" ? (item.data as FolderItem).name : (item.data as DocItem).name}
                </p>
              </div>
            ))}
          </div>
        )}

        {dragOver && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--accent)" }}>Eliberează pentru a încărca</p>
          </div>
        )}
      </div>
    </div>
  );
}
