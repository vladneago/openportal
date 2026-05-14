"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Step { id: string; type: string; label: string; config: Record<string, unknown>; }
interface Instance { id: string; status: string; log: any[]; startedAt: string; completedAt: string | null; }

const STEP_TYPES = [
  { type: "send_email", label: "Trimite email", icon: "✉", color: "#3B82F6" },
  { type: "send_notification", label: "Trimite notificare", icon: "🔔", color: "#8B5CF6" },
  { type: "create_item", label: "Creează element", icon: "➕", color: "#10B981" },
  { type: "update_item", label: "Actualizează element", icon: "✏", color: "#F59E0B" },
  { type: "approval", label: "Cerere aprobare", icon: "✓", color: "#6366F1" },
  { type: "delay", label: "Așteaptă (delay)", icon: "⏱", color: "#71717A" },
  { type: "condition", label: "Condiție (if/else)", icon: "◇", color: "#EC4899" },
  { type: "webhook", label: "Apel HTTP extern", icon: "🌐", color: "#0EA5E9" },
];

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wfId = params.id as string;

  const [wf, setWf] = useState<any>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStep, setShowAddStep] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  useEffect(() => { loadData(); }, [wfId]);

  async function loadData() {
    setLoading(true);
    const [wfRes, instRes] = await Promise.all([
      api(`/api/v1/workflows/${wfId}`),
      api(`/api/v1/workflows/${wfId}/instances`),
    ]);
    if (wfRes.success) setWf(wfRes.data);
    if (instRes.success) setInstances(instRes.data || []);
    setLoading(false);
  }

  async function addStep(type: string) {
    if (!wf) return;
    const stepType = STEP_TYPES.find((s) => s.type === type);
    const newStep: Step = { id: `step-${Date.now()}`, type, label: stepType?.label || type, config: {} };
    const newSteps = [...(wf.steps || []), newStep];
    await api(`/api/v1/workflows/${wfId}`, { method: "PATCH", body: JSON.stringify({ steps: newSteps }) });
    setShowAddStep(false);
    await loadData();
  }

  async function removeStep(stepId: string) {
    if (!wf) return;
    const newSteps = wf.steps.filter((s: Step) => s.id !== stepId);
    await api(`/api/v1/workflows/${wfId}`, { method: "PATCH", body: JSON.stringify({ steps: newSteps }) });
    await loadData();
  }

  async function handleRun() {
    await api(`/api/v1/workflows/${wfId}/run`, { method: "POST" });
    await loadData();
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;
  if (!wf) return null;

  const triggerLabels: Record<string, string> = { manual: "Manual", on_create: "La creare", on_update: "La modificare", scheduled: "Programat", form_submit: "Submit formular", document_upload: "Upload document" };
  const triggerLabel = triggerLabels[wf.trigger?.type] || "Manual";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/workflows")} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{wf.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
              <span>Declanșator: {triggerLabel}</span>
              <span>·</span>
              <span>{wf.steps?.length || 0} pași</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={handleRun}>▶ Rulează</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {[{ id: "editor" as const, label: "Editor" }, { id: "history" as const, label: `Execuții (${instances.length})` }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: activeTab === tab.id ? "var(--text)" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "transparent"; }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "editor" ? (
        <div className="max-w-2xl mx-auto">
          {/* Trigger node */}
          <div className="flex items-center gap-3 panel px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: "#6366F115", color: "#6366F1" }}>⚡</div>
            <div>
              <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>Declanșator</p>
              <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{triggerLabel}</p>
            </div>
          </div>

          {/* Connector line */}
          <div className="flex justify-center"><div className="w-px h-6" style={{ background: "var(--border-hover)" }} /></div>

          {/* Steps */}
          {(wf.steps || []).map((step: Step, i: number) => {
            const st = STEP_TYPES.find((s) => s.type === step.type);
            return (
              <div key={step.id}>
                <div className="group flex items-center gap-3 panel px-4 py-3 mb-2 transition-all"
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: (st?.color || "#71717A") + "15" }}>
                    {st?.icon || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{step.label}</p>
                    <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>Pas {i + 1}</p>
                  </div>
                  <button onClick={() => removeStep(step.id)}
                    className="border-0 bg-transparent cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                {i < (wf.steps?.length || 0) - 1 && <div className="flex justify-center"><div className="w-px h-6" style={{ background: "var(--border-hover)" }} /></div>}
              </div>
            );
          })}

          {/* Add step */}
          <div className="flex justify-center"><div className="w-px h-6" style={{ background: "var(--border-hover)" }} /></div>

          {showAddStep ? (
            <div className="panel p-4">
              <p className="text-[11px] font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Alege acțiunea</p>
              <div className="grid grid-cols-2 gap-2">
                {STEP_TYPES.map((st) => (
                  <button key={st.type} onClick={() => addStep(st.type)}
                    className="border-0 cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-all text-left"
                    style={{ background: "var(--page-bg)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--page-bg)"; }}>
                    <span className="text-lg">{st.icon}</span>
                    <span className="text-[11.5px] font-medium" style={{ color: "var(--text)" }}>{st.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddStep(false)} className="mt-3 text-[11px] border-0 bg-transparent cursor-pointer" style={{ color: "var(--text-tertiary)" }}>Anulează</button>
            </div>
          ) : (
            <button onClick={() => setShowAddStep(true)}
              className="w-full border-0 bg-transparent cursor-pointer py-3 rounded-lg text-[12px] transition-colors flex items-center justify-center gap-2"
              style={{ color: "var(--text-muted)", border: "1.5px dashed var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Adaugă pas
            </button>
          )}
        </div>
      ) : (
        /* Execution history */
        <div className="panel">
          <div className="grid gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
            style={{ gridTemplateColumns: "1fr 100px 100px 120px", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <span>ID</span><span>Status</span><span>Pași</span><span>Data</span>
          </div>
          {instances.length === 0 ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Nicio execuție încă. Apasă "Rulează" pentru a testa.</div>
          ) : instances.map((inst) => {
            const stColor = inst.status === "completed" ? "#10B981" : inst.status === "failed" ? "#EF4444" : inst.status === "running" ? "#3B82F6" : "#F59E0B";
            return (
              <div key={inst.id} className="grid gap-4 items-center px-4 py-3 transition-colors"
                style={{ gridTemplateColumns: "1fr 100px 100px 120px", borderBottom: "1px solid var(--page-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>{inst.id.slice(0, 8)}</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium w-fit" style={{ background: stColor + "15", color: stColor }}>
                  {inst.status === "completed" ? "Complet" : inst.status === "failed" ? "Eșuat" : inst.status === "running" ? "Rulează" : "Așteaptă"}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{inst.log?.length || 0} completați</span>
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{new Date(inst.startedAt).toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
