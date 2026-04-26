"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Module { id: string; title: string; order: number; lessons: Lesson[]; }
interface Lesson { id: string; title: string; type: string; order: number; durationMinutes: number; videoUrl: string | null; }
interface CourseData { id: string; title: string; description: string | null; status: string; modules: Module[]; enrollment: any; enrollmentCount: number; settings: any; }

const LESSON_TYPES = [
  { type: "text", label: "Text / Articol", icon: "📄" },
  { type: "video", label: "Video", icon: "🎬" },
  { type: "quiz", label: "Quiz", icon: "❓" },
  { type: "assignment", label: "Temă", icon: "📝" },
  { type: "code", label: "Cod / Exercițiu", icon: "💻" },
];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "students">("content");

  useEffect(() => { loadCourse(); }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    const res = await api(`/api/v1/education/courses/${courseId}`);
    if (res.success) setCourse(res.data);
    setLoading(false);
  }

  async function addModule() {
    await api(`/api/v1/education/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify({}) });
    await loadCourse();
  }

  async function deleteModule(modId: string) {
    await api(`/api/v1/education/modules/${modId}`, { method: "DELETE" });
    await loadCourse();
  }

  async function addLesson(moduleId: string, type: string = "text") {
    await api(`/api/v1/education/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify({ type }) });
    await loadCourse();
  }

  async function deleteLesson(lessonId: string) {
    await api(`/api/v1/education/lessons/${lessonId}`, { method: "DELETE" });
    await loadCourse();
  }

  async function handlePublish() {
    await api(`/api/v1/education/courses/${courseId}/publish`, { method: "POST" });
    await loadCourse();
  }

  async function handleEnroll() {
    await api(`/api/v1/education/courses/${courseId}/enroll`, { method: "POST" });
    await loadCourse();
  }

  async function completeLesson(lessonId: string) {
    await api(`/api/v1/education/courses/${courseId}/complete-lesson`, { method: "POST", body: JSON.stringify({ lessonId }) });
    await loadCourse();
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă cursul...</div>;
  if (!course) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Cursul nu a fost găsit.</div>;

  const completedLessons = course.enrollment?.completedLessons || [];
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const progress = course.enrollment?.progress || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/education")} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{course.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
              <span className="px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: course.status === "published" ? "#10B98115" : "#71717A15", color: course.status === "published" ? "#10B981" : "#71717A" }}>
                {course.status === "published" ? "Publicat" : "Ciornă"}
              </span>
              <span>{course.modules.length} module · {totalLessons} lecții · {course.enrollmentCount} studenți</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!course.enrollment && <button className="btn-secondary" onClick={handleEnroll}>Înscrie-te</button>}
          {course.status === "draft" && <button className="btn-primary" onClick={handlePublish}>Publică</button>}
        </div>
      </div>

      {/* Progress bar if enrolled */}
      {course.enrollment && (
        <div className="panel p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium" style={{ color: "var(--text)" }}>Progresul tău</span>
            <span className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
          </div>
          <p className="text-[10.5px] mt-2" style={{ color: "var(--text-tertiary)" }}>{completedLessons.length} din {totalLessons} lecții completate</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {[{ id: "content" as const, label: "Conținut" }, { id: "students" as const, label: `Studenți (${course.enrollmentCount})` }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="border-0 cursor-pointer px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors"
            style={{ background: activeTab === tab.id ? "var(--text)" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "var(--border)"; }}
            onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "transparent"; }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" ? (
        <div className="space-y-4">
          {course.modules.map((mod) => (
            <div key={mod.id} className="panel">
              {/* Module header */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: mod.lessons.length > 0 ? "1px solid var(--border)" : "none" }}>
                <h3 className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{mod.title}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] mr-2" style={{ color: "var(--text-tertiary)" }}>{mod.lessons.length} lecții</span>
                  <button onClick={() => deleteModule(mod.id)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                    style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {mod.lessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const typeInfo = LESSON_TYPES.find((t) => t.type === lesson.type);
                return (
                  <div key={lesson.id} className="group flex items-center gap-3 px-5 py-3 transition-colors"
                    style={{ borderBottom: "1px solid var(--page-bg)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                    {course.enrollment ? (
                      <button onClick={() => !isCompleted && completeLesson(lesson.id)}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-0 cursor-pointer"
                        style={{ background: isCompleted ? "var(--text)" : "transparent", border: isCompleted ? "none" : "1.5px solid var(--border-hover)" }}>
                        {isCompleted && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                      </button>
                    ) : (
                      <span className="text-sm">{typeInfo?.icon || "📄"}</span>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px]" style={{ color: isCompleted ? "var(--text-tertiary)" : "var(--text)", textDecoration: isCompleted ? "line-through" : "none" }}>{lesson.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-tertiary)" }}>
                        {typeInfo?.label || lesson.type}
                      </span>
                      {lesson.durationMinutes > 0 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lesson.durationMinutes} min</span>}
                      <button onClick={() => deleteLesson(lesson.id)}
                        className="border-0 bg-transparent cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add lesson */}
              <div className="px-5 py-2 flex items-center gap-1">
                {LESSON_TYPES.map((lt) => (
                  <button key={lt.type} onClick={() => addLesson(mod.id, lt.type)}
                    className="border-0 bg-transparent cursor-pointer text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                    {lt.icon} {lt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Add module */}
          <button onClick={addModule}
            className="w-full border-0 bg-transparent cursor-pointer py-3 rounded-lg text-[12px] transition-colors flex items-center justify-center gap-2"
            style={{ color: "var(--text-muted)", border: "1.5px dashed var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Adaugă modul
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {course.enrollmentCount === 0 ? "Niciun student înscris încă." : `${course.enrollmentCount} studenți înscriși.`}
          </div>
        </div>
      )}
    </div>
  );
}
