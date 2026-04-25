"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Field { id: string; label: string; type: string; order: number; }
interface Submission { id: string; data: Record<string, unknown>; submittedAt: string; }

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [formTitle, setFormTitle] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [formRes, subRes] = await Promise.all([
        api(`/api/v1/forms/${formId}`),
        api(`/api/v1/forms/${formId}/submissions`),
      ]);
      if (formRes.success) {
        setFormTitle(formRes.data.title);
        setFields((formRes.data.fields || []).filter((f: Field) => !["heading", "divider", "paragraph"].includes(f.type)));
      }
      if (subRes.success) setSubmissions(subRes.data || []);
      setLoading(false);
    }
    load();
  }, [formId]);

  if (loading) return <div className="py-20 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/forms/${formId}/edit`)} className="border-0 bg-transparent cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{formTitle} — Răspunsuri</h1>
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{submissions.length} răspunsuri primite</p>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--border)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text)" }}>Niciun răspuns încă</p>
          <p className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>Publică formularul și partajează link-ul pentru a primi răspunsuri.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <div className="flex" style={{ borderBottom: "1px solid var(--border)", minWidth: fields.length * 200 + 160 }}>
            <div className="shrink-0 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ width: 160, color: "var(--text-tertiary)" }}>Data</div>
            {fields.map((f) => (
              <div key={f.id} className="shrink-0 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest" style={{ width: 200, color: "var(--text-tertiary)", borderLeft: "1px solid var(--border)" }}>
                {f.label}
              </div>
            ))}
          </div>
          {submissions.map((sub) => (
            <div key={sub.id} className="flex transition-colors" style={{ borderBottom: "1px solid var(--page-bg)", minWidth: fields.length * 200 + 160 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div className="shrink-0 px-4 py-2.5 text-[11px]" style={{ width: 160, color: "var(--text-tertiary)" }}>
                {new Date(sub.submittedAt).toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
              {fields.map((f) => (
                <div key={f.id} className="shrink-0 px-4 py-2.5 text-[12px]" style={{ width: 200, color: "var(--text)", borderLeft: "1px solid var(--page-bg)" }}>
                  {String(sub.data[f.id] || "—")}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
