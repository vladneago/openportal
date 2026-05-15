"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  BLOCK_TYPES,
  getBlockTypeDef,
  type BlockTypeDef,
  type BlockFieldDef,
} from "@/components/site-blocks/block-schema";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  locale: string;
  status: string;
  isHomePage: boolean;
  blocks: Block[];
  seoTitle: string | null;
  seoDescription: string | null;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params?.id as string;
  const pageId = params?.pageId as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [meta, setMeta] = useState({
    title: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAddPalette, setShowAddPalette] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/site-builder/pages/${pageId}`);
    if (res.success) {
      const data = res.data as PageData;
      setPage(data);
      setBlocks(Array.isArray(data.blocks) ? data.blocks.map((b) => ({ ...b, id: b.id || randomId() })) : []);
      setMeta({
        title: data.title,
        slug: data.slug,
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
      });
      setDirty(false);
    }
    setLoading(false);
  }

  function updateBlock(idx: number, data: Record<string, unknown>) {
    const next = [...blocks];
    next[idx] = { ...next[idx], data };
    setBlocks(next);
    setDirty(true);
  }

  function addBlock(typeDef: BlockTypeDef) {
    const newBlock: Block = {
      id: randomId(),
      type: typeDef.type,
      data: JSON.parse(JSON.stringify(typeDef.defaultData)),
    };
    const insertAt = selectedIdx !== null ? selectedIdx + 1 : blocks.length;
    const next = [...blocks];
    next.splice(insertAt, 0, newBlock);
    setBlocks(next);
    setSelectedIdx(insertAt);
    setShowAddPalette(false);
    setDirty(true);
  }

  function deleteBlock(idx: number) {
    if (!confirm("Ștergi acest bloc?")) return;
    const next = blocks.filter((_, i) => i !== idx);
    setBlocks(next);
    setSelectedIdx(null);
    setDirty(true);
  }

  function moveBlock(idx: number, direction: "up" | "down") {
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocks(next);
    setSelectedIdx(target);
    setDirty(true);
  }

  async function saveDraft() {
    setSaving(true);
    const res = await api(`/api/v1/site-builder/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: meta.title,
        slug: meta.slug,
        seoTitle: meta.seoTitle || undefined,
        seoDescription: meta.seoDescription || undefined,
        blocks,
      }),
    });
    setSaving(false);
    if (res.success) {
      setDirty(false);
    } else {
      alert(res.error?.message || "Eroare la salvare");
    }
  }

  async function publish() {
    if (dirty) {
      const ok = confirm("Ai modificări nesalvate. Salvăm întâi ciornă apoi publicăm?");
      if (!ok) return;
      await saveDraft();
    }
    setPublishing(true);
    const res = await api(`/api/v1/site-builder/pages/${pageId}/publish`, { method: "POST" });
    setPublishing(false);
    if (res.success) {
      await load();
      alert("Pagină publicată ✓");
    } else {
      alert(res.error?.message || "Eroare la publicare");
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Se încarcă editor-ul…
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Pagina nu a fost găsită.{" "}
        <Link href={`/site-builder/${siteId}`} className="underline">
          Înapoi la site
        </Link>
      </div>
    );
  }

  const selectedBlock = selectedIdx !== null ? blocks[selectedIdx] : null;
  const selectedTypeDef = selectedBlock ? getBlockTypeDef(selectedBlock.type) : null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-3">
        <Link href="/site-builder" className="no-underline" style={{ color: "var(--text-tertiary)" }}>
          Site-uri
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <Link href={`/site-builder/${siteId}`} className="no-underline" style={{ color: "var(--text-tertiary)" }}>
          Detalii site
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--text)" }}>
          {page.title}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Editor pagină
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {page.isHomePage ? "Pagină principală" : `/${page.slug}`} ·{" "}
            <span style={{ color: page.status === "published" ? "#10B981" : "#F59E0B" }}>
              {page.status === "published" ? "Publicată" : page.status === "draft" ? "Ciornă" : page.status}
            </span>
            {dirty && <span style={{ color: "#F59E0B" }}> · Modificări nesalvate</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/preview/${siteId}${page.isHomePage ? "" : `/${page.slug}`}`}
            target="_blank"
            rel="noopener"
            className="btn-secondary text-sm no-underline"
          >
            Preview
          </a>
          <button onClick={saveDraft} disabled={saving} className="btn-secondary text-sm">
            {saving ? "Se salvează…" : "Salvează ciornă"}
          </button>
          <button onClick={publish} disabled={publishing} className="btn-primary text-sm">
            {publishing ? "Se publică…" : "Publică"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Blocks list */}
        <div className="col-span-12 md:col-span-5">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Blocuri ({blocks.length})
              </h2>
              <button onClick={() => setShowAddPalette(true)} className="btn-primary text-xs">
                + Bloc
              </button>
            </div>

            {blocks.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                <p className="text-sm mb-3">Pagina e goală.</p>
                <button onClick={() => setShowAddPalette(true)} className="btn-primary text-xs">
                  Adaugă primul bloc
                </button>
              </div>
            ) : (
              blocks.map((b, idx) => {
                const typeDef = getBlockTypeDef(b.type);
                const isSelected = selectedIdx === idx;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedIdx(idx)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--bg-hover)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                  >
                    <span className="text-xl">{typeDef?.icon || "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {typeDef?.label || b.type}
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                        {summarizeBlock(b)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="text-xs p-1 rounded"
                        style={{ color: idx === 0 ? "var(--text-muted)" : "var(--text-tertiary)" }}
                        title="Mută sus"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(idx, "down");
                        }}
                        disabled={idx === blocks.length - 1}
                        className="text-xs p-1 rounded"
                        style={{
                          color: idx === blocks.length - 1 ? "var(--text-muted)" : "var(--text-tertiary)",
                        }}
                        title="Mută jos"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(idx);
                        }}
                        className="text-xs p-1 rounded"
                        style={{ color: "var(--text-tertiary)" }}
                        title="Șterge"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Page meta below blocks */}
          <div
            className="mt-4 rounded-lg p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
              Pagină
            </h3>
            <div className="space-y-3">
              <Field label="Titlu">
                <input
                  type="text"
                  value={meta.title}
                  onChange={(e) => {
                    setMeta({ ...meta, title: e.target.value });
                    setDirty(true);
                  }}
                  className="input w-full text-sm"
                />
              </Field>
              {!page.isHomePage && (
                <Field label="Slug (URL)">
                  <input
                    type="text"
                    value={meta.slug}
                    onChange={(e) => {
                      setMeta({ ...meta, slug: e.target.value });
                      setDirty(true);
                    }}
                    className="input w-full text-sm font-mono"
                  />
                </Field>
              )}
              <Field label="SEO title">
                <input
                  type="text"
                  value={meta.seoTitle}
                  onChange={(e) => {
                    setMeta({ ...meta, seoTitle: e.target.value });
                    setDirty(true);
                  }}
                  className="input w-full text-sm"
                  placeholder="Lasă gol pentru auto"
                />
              </Field>
              <Field label="SEO description">
                <textarea
                  value={meta.seoDescription}
                  onChange={(e) => {
                    setMeta({ ...meta, seoDescription: e.target.value });
                    setDirty(true);
                  }}
                  className="input w-full text-sm"
                  rows={2}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Block editor */}
        <div className="col-span-12 md:col-span-7">
          {selectedBlock && selectedTypeDef ? (
            <BlockEditor
              block={selectedBlock}
              typeDef={selectedTypeDef}
              onChange={(data) => updateBlock(selectedIdx!, data)}
            />
          ) : (
            <div
              className="rounded-lg p-8 text-center text-sm"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
            >
              {blocks.length === 0
                ? "Adaugă un bloc pentru a începe."
                : "Selectează un bloc din stânga pentru a-l edita."}
            </div>
          )}
        </div>
      </div>

      {/* Block palette modal */}
      {showAddPalette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAddPalette(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-2xl my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Adaugă bloc
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addBlock(t)}
                  className="flex items-start gap-3 p-3 rounded-md text-left"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  <span className="text-2xl shrink-0">{t.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium mb-0.5">{t.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {t.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAddPalette(false)} className="btn-secondary text-sm">
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save reminder if user navigates */}
      {dirty && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg z-30"
          style={{ background: "#F59E0B", color: "#fff", fontSize: "0.85rem" }}
        >
          Ai modificări nesalvate
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BLOCK EDITOR (per-type form)
// ─────────────────────────────────────────────

function BlockEditor({
  block,
  typeDef,
  onChange,
}: {
  block: Block;
  typeDef: BlockTypeDef;
  onChange: (data: Record<string, unknown>) => void;
}) {
  function setField(key: string, value: unknown) {
    onChange({ ...block.data, [key]: value });
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-xl">{typeDef.icon}</span>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {typeDef.label}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {typeDef.description}
          </p>
        </div>
      </div>

      {typeDef.fields.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-tertiary)" }}>
          Acest bloc nu are setări configurabile — folosește datele afacerii automat.
        </p>
      ) : (
        <div className="space-y-3">
          {typeDef.fields.map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={block.data[f.key]}
              onChange={(v) => setField(f.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: BlockFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <Field label={field.label}>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full text-sm"
            placeholder={field.placeholder}
          />
        </Field>
      );

    case "textarea":
      return (
        <Field label={field.label}>
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full text-sm"
            placeholder={field.placeholder}
            rows={3}
          />
        </Field>
      );

    case "url":
    case "image": {
      const stringValue = typeof value === "string" ? value : "";
      return (
        <Field label={field.label} help={field.helpText}>
          <input
            type="url"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full text-sm font-mono"
            placeholder={field.placeholder || "https://..."}
          />
          {stringValue && field.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stringValue}
              alt=""
              className="mt-2 rounded-md max-h-32 object-cover"
              style={{ border: "1px solid var(--border)" }}
            />
          )}
        </Field>
      );
    }

    case "select":
      return (
        <Field label={field.label} help={field.helpText}>
          <select
            value={(value as string) ?? field.defaultValue ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full text-sm"
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--text)" }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {field.label}
            {field.helpText && (
              <span className="ml-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                ({field.helpText})
              </span>
            )}
          </span>
        </label>
      );

    case "color":
      return (
        <Field label={field.label}>
          <input
            type="color"
            value={(value as string) ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="input w-full"
            style={{ height: 36 }}
          />
        </Field>
      );

    case "number":
      return (
        <Field label={field.label}>
          <input
            type="number"
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input w-full text-sm"
          />
        </Field>
      );

    case "cta": {
      const cta = (value as { text?: string; href?: string }) || {};
      return (
        <Field label={field.label}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={cta.text ?? ""}
              onChange={(e) => onChange({ ...cta, text: e.target.value })}
              className="input text-sm"
              placeholder="Text buton"
            />
            <input
              type="text"
              value={cta.href ?? ""}
              onChange={(e) => onChange({ ...cta, href: e.target.value })}
              className="input text-sm font-mono"
              placeholder="/link sau https://..."
            />
          </div>
        </Field>
      );
    }

    case "list":
      return (
        <ListField field={field} value={(value as Array<Record<string, unknown>>) || []} onChange={onChange} />
      );

    default:
      return null;
  }
}

function ListField({
  field,
  value,
  onChange,
}: {
  field: BlockFieldDef;
  value: Array<Record<string, unknown>>;
  onChange: (v: unknown) => void;
}) {
  function addItem() {
    const empty: Record<string, unknown> = {};
    for (const sub of field.itemFields || []) {
      empty[sub.key] = sub.defaultValue ?? "";
    }
    onChange([...value, empty]);
  }

  function removeItem(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, key: string, v: unknown) {
    const next = [...value];
    next[idx] = { ...next[idx], [key]: v };
    onChange(next);
  }

  return (
    <Field label={field.label}>
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="rounded-md p-3"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                #{idx + 1}
              </span>
              <button
                onClick={() => removeItem(idx)}
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                ✕ Șterge
              </button>
            </div>
            <div className="space-y-2">
              {field.itemFields?.map((sub) => (
                <FieldRenderer
                  key={sub.key}
                  field={sub}
                  value={item[sub.key]}
                  onChange={(v) => updateItem(idx, sub.key, v)}
                />
              ))}
            </div>
          </div>
        ))}
        <button onClick={addItem} className="btn-secondary text-xs w-full">
          + Adaugă element
        </button>
      </div>
    </Field>
  );
}

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
        {help && (
          <span className="ml-1" style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
            ({help})
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function summarizeBlock(b: Block): string {
  if (b.type === "hero" || b.type === "ctaBanner" || b.type === "textImage" || b.type === "featuresGrid" || b.type === "team" || b.type === "testimonials" || b.type === "servicesPreview") {
    const t = b.data.title;
    if (typeof t === "string" && t) return t;
  }
  return "(fără titlu)";
}
