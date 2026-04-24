"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Col { id: string; name: string; type: string; order: number; width: number; config: any; isKanbanField: boolean; }
interface RowData { id: string; data: Record<string, unknown>; order: number; }
interface TableData { id: string; title: string; icon: string; columns: Col[]; rowCount: number; }

export default function TableDetailPage() {
  const params = useParams();
  const tableId = params.id as string;

  const [table, setTable] = useState<TableData | null>(null);
  const [rowList, setRowList] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "kanban">("grid");
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { loadTable(); }, [tableId]);

  async function loadTable() {
    setLoading(true);
    const [tableRes, rowsRes] = await Promise.all([
      api(`/api/v1/tables/${tableId}`),
      api(`/api/v1/tables/${tableId}/rows`),
    ]);
    if (tableRes.success) setTable(tableRes.data);
    if (rowsRes.success) setRowList(rowsRes.data || []);
    setLoading(false);
  }

  async function addRow() {
    if (!table) return;
    const defaultData: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      if (col.config?.defaultValue) defaultData[col.id] = col.config.defaultValue;
      else if (col.type === "boolean") defaultData[col.id] = false;
      else defaultData[col.id] = "";
    });
    await api(`/api/v1/tables/${tableId}/rows`, { method: "POST", body: JSON.stringify({ data: defaultData }) });
    await loadTable();
  }

  async function updateCell(rowId: string, colId: string, value: unknown) {
    await api(`/api/v1/tables/${tableId}/rows/${rowId}`, { method: "PATCH", body: JSON.stringify({ data: { [colId]: value } }) });
    setRowList((prev) => prev.map((r) => r.id === rowId ? { ...r, data: { ...r.data, [colId]: value } } : r));
  }

  async function deleteRow(rowId: string) {
    await api(`/api/v1/tables/${tableId}/rows/${rowId}`, { method: "DELETE" });
    setRowList((prev) => prev.filter((r) => r.id !== rowId));
  }

  function startEdit(rowId: string, colId: string, currentValue: unknown) {
    setEditingCell({ rowId, colId });
    setEditValue(String(currentValue || ""));
  }

  function commitEdit() {
    if (editingCell) {
      updateCell(editingCell.rowId, editingCell.colId, editValue);
      setEditingCell(null);
    }
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;
  if (!table) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Tabelul nu a fost găsit.</div>;

  const kanbanCol = table.columns.find((c) => c.isKanbanField);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{table.icon}</span>
          <div>
            <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>{table.title}</h1>
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{rowList.length} rânduri · {table.columns.length} coloane</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-px rounded-md overflow-hidden" style={{ background: "var(--border)" }}>
            <button onClick={() => setView("grid")} className="border-0 cursor-pointer px-2.5 py-1.5 text-[11px] font-medium transition-colors"
              style={{ background: view === "grid" ? "var(--surface)" : "transparent", color: view === "grid" ? "var(--text)" : "var(--text-tertiary)" }}>
              Grid
            </button>
            {kanbanCol && (
              <button onClick={() => setView("kanban")} className="border-0 cursor-pointer px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                style={{ background: view === "kanban" ? "var(--surface)" : "transparent", color: view === "kanban" ? "var(--text)" : "var(--text-tertiary)" }}>
                Kanban
              </button>
            )}
          </div>
          <button className="btn-primary" onClick={addRow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Rând nou
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <GridView table={table} rows={rowList} editingCell={editingCell} editValue={editValue}
          onStartEdit={startEdit} onEditChange={setEditValue} onCommitEdit={commitEdit}
          onCancelEdit={() => setEditingCell(null)} onDeleteRow={deleteRow} onUpdateCell={updateCell} />
      ) : kanbanCol ? (
        <KanbanView table={table} rows={rowList} kanbanCol={kanbanCol} onUpdateCell={updateCell} onAddRow={addRow} onDeleteRow={deleteRow} />
      ) : null}
    </div>
  );
}

// ─── GRID VIEW ───

function GridView({ table, rows, editingCell, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit, onDeleteRow, onUpdateCell }: {
  table: TableData; rows: RowData[]; editingCell: { rowId: string; colId: string } | null; editValue: string;
  onStartEdit: (rowId: string, colId: string, val: unknown) => void; onEditChange: (v: string) => void;
  onCommitEdit: () => void; onCancelEdit: () => void; onDeleteRow: (id: string) => void; onUpdateCell: (rowId: string, colId: string, val: unknown) => void;
}) {
  const cols = table.columns;

  return (
    <div className="panel overflow-x-auto">
      {/* Header */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)", minWidth: cols.reduce((s, c) => s + (c.width || 200), 60) }}>
        {cols.map((col) => (
          <div key={col.id} className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest shrink-0"
            style={{ width: col.width || 200, color: "var(--text-tertiary)", borderRight: "1px solid var(--border)" }}>
            {col.name}
          </div>
        ))}
        <div className="w-[60px] shrink-0" />
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <div key={row.id} className="flex transition-colors" style={{ borderBottom: "1px solid var(--page-bg)", minWidth: cols.reduce((s, c) => s + (c.width || 200), 60) }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {cols.map((col) => {
            const val = row.data[col.id];
            const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

            return (
              <div key={col.id} className="px-3 py-2 shrink-0 flex items-center"
                style={{ width: col.width || 200, borderRight: "1px solid var(--page-bg)" }}
                onClick={() => { if (!isEditing) onStartEdit(row.id, col.id, val); }}>

                {isEditing ? (
                  col.type === "choice" ? (
                    <select className="w-full border-0 bg-transparent text-xs outline-none" style={{ color: "var(--text)" }}
                      value={editValue} onChange={(e) => { onEditChange(e.target.value); onUpdateCell(row.id, col.id, e.target.value); onCancelEdit(); }}
                      onBlur={onCancelEdit} autoFocus>
                      {(col.config?.choices || []).map((ch: string) => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  ) : col.type === "boolean" ? (
                    <input type="checkbox" checked={editValue === "true"} onChange={(e) => { onUpdateCell(row.id, col.id, e.target.checked); onCancelEdit(); }} autoFocus />
                  ) : (
                    <input className="w-full border-0 bg-transparent text-xs outline-none" style={{ color: "var(--text)" }}
                      type={col.type === "number" || col.type === "currency" ? "number" : col.type === "date" ? "date" : "text"}
                      value={editValue} onChange={(e) => onEditChange(e.target.value)}
                      onBlur={onCommitEdit} onKeyDown={(e) => { if (e.key === "Enter") onCommitEdit(); if (e.key === "Escape") onCancelEdit(); }}
                      autoFocus />
                  )
                ) : (
                  <CellDisplay col={col} value={val} />
                )}
              </div>
            );
          })}
          <div className="w-[60px] shrink-0 flex items-center justify-center">
            <button onClick={() => onDeleteRow(row.id)} className="border-0 bg-transparent p-1 rounded cursor-pointer opacity-0 transition-opacity"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          Niciun rând. Apasă "Rând nou" pentru a adăuga date.
        </div>
      )}
    </div>
  );
}

// ─── KANBAN VIEW ───

function KanbanView({ table, rows, kanbanCol, onUpdateCell, onAddRow, onDeleteRow }: {
  table: TableData; rows: RowData[]; kanbanCol: Col; onUpdateCell: (rowId: string, colId: string, val: unknown) => void;
  onAddRow: () => void; onDeleteRow: (id: string) => void;
}) {
  const choices = kanbanCol.config?.choices || [];
  const titleCol = table.columns.find((c) => c.order === 0);

  const grouped: Record<string, RowData[]> = {};
  choices.forEach((ch: string) => { grouped[ch] = []; });
  rows.forEach((row) => {
    const val = String(row.data[kanbanCol.id] || choices[0] || "");
    if (!grouped[val]) grouped[val] = [];
    grouped[val].push(row);
  });

  const statusColors: Record<string, string> = {
    "De făcut": "#71717A", "În progres": "#3B82F6", "În review": "#F59E0B", "Finalizat": "#10B981",
    "Urgentă": "#EF4444", "Mare": "#F59E0B", "Medie": "#3B82F6", "Mică": "#71717A",
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {choices.map((status: string) => (
        <div key={status} className="shrink-0" style={{ width: 280 }}>
          {/* Column header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: statusColors[status] || "#A1A1AA" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{status}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text-tertiary)" }}>
                {grouped[status]?.length || 0}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {(grouped[status] || []).map((row) => {
              const title = titleCol ? String(row.data[titleCol.id] || "Fără titlu") : "Fără titlu";
              return (
                <div key={row.id} className="panel p-3 transition-all"
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                  <p className="text-[12.5px] font-medium mb-2" style={{ color: "var(--text)" }}>{title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {table.columns.filter((c) => c.id !== titleCol?.id && c.id !== kanbanCol.id && row.data[c.id]).map((col) => (
                      <span key={col.id} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>
                        {col.name}: {String(row.data[col.id])}
                      </span>
                    ))}
                  </div>
                  {/* Status selector */}
                  <div className="mt-2 flex items-center gap-1">
                    {choices.filter((ch: string) => ch !== status).map((ch: string) => (
                      <button key={ch} onClick={() => onUpdateCell(row.id, kanbanCol.id, ch)}
                        className="border-0 bg-transparent cursor-pointer text-[9px] px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
                        → {ch}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cell Display ───

function CellDisplay({ col, value }: { col: Col; value: unknown }) {
  const v = value === undefined || value === null || value === "" ? null : value;
  if (v === null) return <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>—</span>;

  if (col.type === "choice") {
    const colors: Record<string, string> = {
      "De făcut": "#71717A", "În progres": "#3B82F6", "În review": "#F59E0B", "Finalizat": "#10B981",
      "Urgentă": "#EF4444", "Mare": "#F59E0B", "Medie": "#3B82F6", "Mică": "#71717A",
    };
    const color = colors[String(v)] || "#A1A1AA";
    return (
      <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: color + "15", color }}>
        {String(v)}
      </span>
    );
  }

  if (col.type === "boolean") {
    return v ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    );
  }

  if (col.type === "rating") {
    const max = col.config?.ratingMax || 5;
    const val = Number(v) || 0;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} style={{ color: i < val ? "#F59E0B" : "#E4E4E7", fontSize: 12 }}>★</span>
        ))}
      </div>
    );
  }

  return <span className="text-[12px]" style={{ color: "var(--text)" }}>{String(v)}</span>;
}
