"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

interface Field { id: string; type: string; label: string; placeholder: string | null; helpText: string | null; required: boolean; config: any; order: number; }
interface FormData { id: string; title: string; status: string; fields: Field[]; submissionCount: number; publicToken: string; }

const FIELD_TYPES = [
  { type: "text", label: "Text scurt", icon: "T" },
  { type: "textarea", label: "Text lung", icon: "¶" },
  { type: "email", label: "Email", icon: "@" },
  { type: "number", label: "Număr", icon: "#" },
  { type: "phone", label: "Telefon", icon: "☎" },
  { type: "date", label: "Dată", icon: "📅" },
  { type: "select", label: "Dropdown", icon: "▾" },
  { type: "radio", label: "Opțiune unică", icon: "◉" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "rating", label: "Rating", icon: "★" },
  { type: "file", label: "Fișier", icon: "📎" },
  { type: "heading", label: "Titlu secțiune", icon: "H" },
  { type: "divider", label: "Separator", icon: "—" },
];

export default function FormEditorPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => { loadForm(); }, [formId]);

  async function loadForm() {
    setLoading(true);
    const res = await api(`/api/v1/forms/${formId}`);
    if (res.success) setForm(res.data);
    setLoading(false);
  }

  async function addField(type: string) {
    const labels: Record<string, string> = { text: "Câmp text", textarea: "Câmp text lung", email: "Email", number: "Număr", phone: "Telefon", date: "Dată", select: "Alege o opțiune", radio: "Selectează", checkbox: "Bifează", rating: "Rating", file: "Încarcă fișier", heading: "Titlu secțiune", divider: "" };
    const res = await api(`/api/v1/forms/${formId}/fields`, {
      method: "POST",
      body: JSON.stringify({ type, label: labels[type] || "Câmp nou", required: false, config: type === "select" || type === "radio" ? { choices: ["Opțiunea 1", "Opțiunea 2", "Opțiunea 3"] } : type === "rating" ? { ratingMax: 5 } : {} }),
    });
    if (res.success) { setShowAddField(false); await loadForm(); }
  }

  async function deleteField(fieldId: string) {
    await api(`/api/v1/forms/${formId}/fields/${fieldId}`, { method: "DELETE" });
    await loadForm();
  }

  async function handlePublish() {
    await api(`/api/v1/forms/${formId}/publish`, { method: "POST" });
    await loadForm();
  }

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;
  if (!form) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Formularul nu a fost găsit.</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/forms")} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{form.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: form.status === "active" ? "#10B98115" : "#71717A15", color: form.status === "active" ? "#10B981" : "#71717A" }}>
                {form.status === "active" ? "Activ" : form.status === "closed" ? "Închis" : "Ciornă"}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{form.submissionCount} răspunsuri</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/forms/${formId}/responses`} className="btn-secondary no-underline">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            Răspunsuri
          </Link>
          {form.status === "draft" && <button className="btn-primary" onClick={handlePublish}>Publică</button>}
        </div>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* Left - Fields */}
        <div>
          <div className="space-y-2">
            {form.fields.map((field) => (
              <div key={field.id} className="group panel px-5 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{field.label}</span>
                    {field.required && <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#EF444415", color: "#EF4444" }}>Obligatoriu</span>}
                  </div>
                  <span className="text-[10.5px]" style={{ color: "var(--text-tertiary)" }}>
                    {FIELD_TYPES.find((t) => t.type === field.type)?.label || field.type}
                    {field.placeholder && ` · "${field.placeholder}"`}
                  </span>
                  {field.config?.choices && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {field.config.choices.map((ch: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>{ch}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteField(field.id)}
                  className="border-0 bg-transparent cursor-pointer p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add field */}
          {showAddField ? (
            <div className="panel p-4 mt-3">
              <p className="text-[11px] font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Alege tipul câmpului</p>
              <div className="grid grid-cols-4 gap-2">
                {FIELD_TYPES.map((ft) => (
                  <button key={ft.type} onClick={() => addField(ft.type)}
                    className="border-0 cursor-pointer rounded-lg p-2.5 text-center transition-all"
                    style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--page-bg)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                    <span className="text-base block mb-1">{ft.icon}</span>
                    <span className="text-[10px]">{ft.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddField(false)} className="mt-3 text-[11px] border-0 bg-transparent cursor-pointer" style={{ color: "var(--text-tertiary)" }}>Anulează</button>
            </div>
          ) : (
            <button onClick={() => setShowAddField(true)}
              className="mt-3 w-full border-0 bg-transparent cursor-pointer py-3 rounded-lg text-[12px] transition-colors flex items-center justify-center gap-2"
              style={{ color: "var(--text-muted)", border: "1.5px dashed var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Adaugă câmp
            </button>
          )}
        </div>

        {/* Right - Preview */}
        <div>
          <div className="text-[11px] font-medium mb-3" style={{ color: "var(--text-tertiary)" }}>PREVIEW</div>
          <div className="panel p-5">
            <h3 className="text-[14px] font-medium mb-4" style={{ color: "var(--text)" }}>{form.title}</h3>
            {form.fields.filter((f) => f.type !== "divider" && f.type !== "heading").map((field) => (
              <div key={field.id} className="mb-4">
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {field.label} {field.required && <span style={{ color: "#EF4444" }}>*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea className="input" rows={3} placeholder={field.placeholder || ""} readOnly style={{ resize: "none" }} />
                ) : field.type === "select" ? (
                  <select className="input"><option>{field.placeholder || "Selectează..."}</option></select>
                ) : field.type === "radio" ? (
                  <div className="space-y-1.5 mt-1">{(field.config?.choices || []).map((ch: string, i: number) => (
                    <label key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text)" }}><input type="radio" name={field.id} disabled />{ch}</label>
                  ))}</div>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text)" }}><input type="checkbox" disabled />{field.placeholder || field.label}</label>
                ) : field.type === "rating" ? (
                  <div className="flex gap-1">{Array.from({ length: field.config?.ratingMax || 5 }).map((_, i) => (
                    <span key={i} className="text-lg" style={{ color: "#E4E4E7" }}>★</span>
                  ))}</div>
                ) : (
                  <input className="input" type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    placeholder={field.placeholder || ""} readOnly />
                )}
              </div>
            ))}
            <button className="btn-primary w-full mt-2" disabled>Trimite</button>
          </div>
        </div>
      </div>
    </div>
  );
}
