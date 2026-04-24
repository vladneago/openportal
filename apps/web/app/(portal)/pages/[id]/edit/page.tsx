"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Block {
  id: string;
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "quote" | "divider" | "callout";
  content: string;
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<any>(null);

  useEffect(() => { loadPage(); }, [pageId]);

  async function loadPage() {
    setLoading(true);
    const res = await api(`/api/v1/pages/${pageId}`);
    if (res.success && res.data) {
      setTitle(res.data.title);
      setStatus(res.data.status);
      // Parse content from TipTap-like JSON to blocks
      if (res.data.content?.content) {
        const parsed: Block[] = res.data.content.content.map((node: any, i: number) => {
          const text = node.content?.map((c: any) => c.text || "").join("") || "";
          let type: Block["type"] = "paragraph";
          if (node.type === "heading") type = `heading${node.attrs?.level || 1}` as any;
          else if (node.type === "blockquote") type = "quote";
          else if (node.type === "horizontalRule") type = "divider";
          return { id: `block-${i}`, type, content: text };
        });
        setBlocks(parsed.length > 0 ? parsed : [{ id: "block-0", type: "paragraph", content: "" }]);
      } else {
        setBlocks([{ id: "block-0", type: "paragraph", content: "" }]);
      }
    }
    setLoading(false);
  }

  const saveContent = useCallback(async (newTitle?: string, newBlocks?: Block[]) => {
    const t = newTitle ?? title;
    const b = newBlocks ?? blocks;
    setSaving(true);

    const content = {
      type: "doc",
      content: b.map((block) => {
        if (block.type === "divider") return { type: "horizontalRule" };
        if (block.type === "quote") return { type: "blockquote", content: [{ type: "paragraph", content: block.content ? [{ type: "text", text: block.content }] : [] }] };
        if (block.type.startsWith("heading")) {
          const level = parseInt(block.type.replace("heading", ""));
          return { type: "heading", attrs: { level }, content: block.content ? [{ type: "text", text: block.content }] : [] };
        }
        return { type: "paragraph", content: block.content ? [{ type: "text", text: block.content }] : [] };
      }),
    };

    await api(`/api/v1/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ title: t, content }),
    });

    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }));
  }, [title, blocks, pageId]);

  // Auto-save debounce
  function triggerAutoSave(newTitle?: string, newBlocks?: Block[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(newTitle, newBlocks), 1500);
  }

  function updateBlock(id: string, content: string) {
    const updated = blocks.map((b) => b.id === id ? { ...b, content } : b);
    setBlocks(updated);
    triggerAutoSave(undefined, updated);
  }

  function updateBlockType(id: string, type: Block["type"]) {
    const updated = blocks.map((b) => b.id === id ? { ...b, type } : b);
    setBlocks(updated);
    triggerAutoSave(undefined, updated);
  }

  function addBlockAfter(afterId: string, type: Block["type"] = "paragraph") {
    const newBlock: Block = { id: `block-${Date.now()}`, type, content: "" };
    const idx = blocks.findIndex((b) => b.id === afterId);
    const updated = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    setBlocks(updated);
    // Focus new block after render
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
      if (el) el.focus();
    }, 50);
  }

  function deleteBlock(id: string) {
    if (blocks.length <= 1) return;
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    triggerAutoSave(undefined, updated);
  }

  function handleKeyDown(e: React.KeyboardEvent, blockId: string) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(blockId);
    }
    if (e.key === "Backspace" && blocks.find((b) => b.id === blockId)?.content === "") {
      e.preventDefault();
      deleteBlock(blockId);
    }
  }

  async function handlePublish() {
    await saveContent();
    await api(`/api/v1/pages/${pageId}/publish`, { method: "POST" });
    setStatus("published");
  }

  async function handleUnpublish() {
    await api(`/api/v1/pages/${pageId}/unpublish`, { method: "POST" });
    setStatus("draft");
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă editorul...</div>;

  return (
    <div>
      {/* Editor toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/pages")} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {saving ? (
              <span>Se salvează...</span>
            ) : lastSaved ? (
              <span>Salvat la {lastSaved}</span>
            ) : (
              <span>Auto-save activ</span>
            )}
            <span>·</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: status === "published" ? "#10B98115" : "#71717A15", color: status === "published" ? "#10B981" : "#71717A" }}>
              {status === "published" ? "Publicat" : "Ciornă"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "draft" ? (
            <button className="btn-primary" onClick={handlePublish}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Publică
            </button>
          ) : (
            <button className="btn-secondary" onClick={handleUnpublish}>Retrage</button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <input
          className="w-full border-0 bg-transparent outline-none text-3xl font-medium tracking-tight mb-6"
          style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
          placeholder="Titlu pagină"
          value={title}
          onChange={(e) => { setTitle(e.target.value); triggerAutoSave(e.target.value); }}
        />

        {/* Block toolbar hint */}
        <div className="text-[10px] mb-4 px-1" style={{ color: "var(--text-muted)" }}>
          Enter = bloc nou · Backspace pe bloc gol = șterge · Click pe tipul blocului pentru a-l schimba
        </div>

        {/* Blocks */}
        <div className="space-y-1">
          {blocks.map((block) => (
            <div key={block.id} className="group flex gap-2">
              {/* Block type selector */}
              <div className="shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  value={block.type}
                  onChange={(e) => updateBlockType(block.id, e.target.value as Block["type"])}
                  className="border-0 bg-transparent text-[9px] cursor-pointer outline-none w-[18px]"
                  style={{ color: "var(--text-muted)" }}
                  title="Schimbă tipul blocului"
                >
                  <option value="paragraph">¶</option>
                  <option value="heading1">H1</option>
                  <option value="heading2">H2</option>
                  <option value="heading3">H3</option>
                  <option value="quote">❝</option>
                  <option value="divider">—</option>
                  <option value="callout">!</option>
                </select>
              </div>

              {/* Block content */}
              {block.type === "divider" ? (
                <div className="flex-1 py-3">
                  <hr className="border-0 h-px" style={{ background: "var(--border)" }} />
                </div>
              ) : block.type === "callout" ? (
                <div className="flex-1 rounded-lg px-4 py-3" style={{ background: "#6366F108", borderLeft: "3px solid #6366F1" }}>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    data-block-id={block.id}
                    className="outline-none text-[13px]"
                    style={{ color: "var(--text)" }}
                    onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                    onKeyDown={(e) => handleKeyDown(e, block.id)}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                </div>
              ) : (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  data-block-id={block.id}
                  className="flex-1 outline-none rounded px-2 py-1 transition-colors focus:bg-white"
                  style={{
                    color: "var(--text)",
                    fontSize: block.type === "heading1" ? 24 : block.type === "heading2" ? 20 : block.type === "heading3" ? 16 : 14,
                    fontWeight: block.type.startsWith("heading") ? 600 : 400,
                    letterSpacing: block.type.startsWith("heading") ? "-0.02em" : "normal",
                    fontStyle: block.type === "quote" ? "italic" : "normal",
                    borderLeft: block.type === "quote" ? "3px solid var(--border-hover)" : "none",
                    paddingLeft: block.type === "quote" ? 16 : 8,
                    lineHeight: 1.6,
                  }}
                  data-placeholder={
                    block.type === "heading1" ? "Titlu principal" :
                    block.type === "heading2" ? "Subtitlu" :
                    block.type === "heading3" ? "Secțiune" :
                    block.type === "quote" ? "Citat..." :
                    "Scrie ceva sau apasă Enter pentru un bloc nou..."
                  }
                  onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}

              {/* Delete */}
              <button
                onClick={() => deleteBlock(block.id)}
                className="shrink-0 border-0 bg-transparent cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add block button */}
        <button
          onClick={() => addBlockAfter(blocks[blocks.length - 1]?.id || "block-0")}
          className="mt-4 w-full border-0 bg-transparent cursor-pointer py-3 rounded-lg text-[12px] transition-colors flex items-center justify-center gap-2"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Adaugă bloc
        </button>
      </div>

      {/* CSS for placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
