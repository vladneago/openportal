"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Task { id: string; title: string; status: string; priority: string; dueDate: string | null; assigneeName: string | null; tags: string[]; }
interface Milestone { id: string; title: string; dueDate: string | null; completed: boolean; }
interface ProjectData { id: string; title: string; status: string; color: string; tasks: Task[]; milestones: Milestone[]; }

const COLUMNS = ["backlog", "todo", "in_progress", "in_review", "done"];
const COL_LABELS: Record<string, string> = { backlog: "Backlog", todo: "De făcut", in_progress: "În progres", in_review: "Review", done: "Finalizat" };
const COL_COLORS: Record<string, string> = { backlog: "#71717A", todo: "#3B82F6", in_progress: "#F59E0B", in_review: "#8B5CF6", done: "#10B981" };
const PRIORITY_COLORS: Record<string, string> = { urgent: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#71717A" };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => { loadProject(); }, [projectId]);

  async function loadProject() {
    setLoading(true);
    const res = await api(`/api/v1/projects/${projectId}`);
    if (res.success) setProject(res.data);
    setLoading(false);
  }

  async function addTask(status: string) {
    if (!newTaskTitle.trim()) return;
    await api(`/api/v1/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify({ title: newTaskTitle.trim(), status }) });
    setNewTaskCol(null); setNewTaskTitle(""); await loadProject();
  }

  async function moveTask(taskId: string, newStatus: string) {
    await api(`/api/v1/projects/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    await loadProject();
  }

  async function deleteTask(taskId: string) {
    await api(`/api/v1/projects/tasks/${taskId}`, { method: "DELETE" });
    await loadProject();
  }

  async function addMilestone() {
    await api(`/api/v1/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify({ title: "Milestone nou" }) });
    await loadProject();
  }

  async function completeMilestone(id: string) {
    await api(`/api/v1/projects/milestones/${id}/complete`, { method: "POST" });
    await loadProject();
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;
  if (!project) return null;

  const grouped: Record<string, Task[]> = {};
  COLUMNS.forEach((col) => { grouped[col] = []; });
  project.tasks.forEach((t) => { if (grouped[t.status]) grouped[t.status].push(t); else grouped["backlog"].push(t); });

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "done").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/projects")} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: project.color }} />
          <div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{project.title}</h1>
            <p className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>{totalTasks} task-uri · {doneTasks} completate · {project.milestones.length} milestones</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={addMilestone}>+ Milestone</button>
      </div>

      {/* Milestones bar */}
      {project.milestones.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {project.milestones.map((ms) => (
            <button key={ms.id} onClick={() => !ms.completed && completeMilestone(ms.id)}
              className="shrink-0 border-0 cursor-pointer rounded-lg px-3 py-2 flex items-center gap-2 transition-all"
              style={{ background: ms.completed ? "#10B98110" : "var(--surface)", border: "1px solid " + (ms.completed ? "#10B98130" : "var(--border)") }}
              onMouseEnter={(e) => { if (!ms.completed) e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { if (!ms.completed) e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: ms.completed ? "#10B981" : "transparent", border: ms.completed ? "none" : "1.5px solid var(--border-hover)" }}>
                {ms.completed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
              </div>
              <span className="text-[11px] font-medium" style={{ color: ms.completed ? "#10B981" : "var(--text)", textDecoration: ms.completed ? "line-through" : "none" }}>{ms.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {COLUMNS.map((col) => (
          <div key={col} className="shrink-0" style={{ width: 260 }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: COL_COLORS[col] }} />
                <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>{COL_LABELS[col]}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text-tertiary)" }}>{grouped[col].length}</span>
              </div>
              <button onClick={() => setNewTaskCol(col)} className="border-0 bg-transparent cursor-pointer p-0.5 rounded" style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>

            <div className="space-y-2">
              {/* New task input */}
              {newTaskCol === col && (
                <div className="panel p-2.5">
                  <input className="input mb-2" autoFocus placeholder="Titlu task..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTask(col); if (e.key === "Escape") setNewTaskCol(null); }} />
                  <div className="flex gap-1">
                    <button className="btn-primary text-[10px] px-2 py-1" onClick={() => addTask(col)}>Adaugă</button>
                    <button className="btn-secondary text-[10px] px-2 py-1" onClick={() => setNewTaskCol(null)}>Anulează</button>
                  </div>
                </div>
              )}

              {/* Task cards */}
              {grouped[col].map((task) => (
                <div key={task.id} className="group panel p-3 transition-all"
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[12px] font-medium leading-snug" style={{ color: "var(--text)" }}>{task.title}</p>
                    <button onClick={() => deleteTask(task.id)} className="border-0 bg-transparent cursor-pointer p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: PRIORITY_COLORS[task.priority] + "15", color: PRIORITY_COLORS[task.priority] }}>
                      {task.priority === "urgent" ? "Urgent" : task.priority === "high" ? "Mare" : task.priority === "medium" ? "Medie" : "Mică"}
                    </span>
                    {task.assigneeName && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{task.assigneeName}</span>}
                  </div>

                  {/* Move buttons */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {COLUMNS.filter((c) => c !== col).map((targetCol) => (
                      <button key={targetCol} onClick={() => moveTask(task.id, targetCol)}
                        className="border-0 bg-transparent cursor-pointer text-[8px] px-1 py-0.5 rounded transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        → {COL_LABELS[targetCol]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
