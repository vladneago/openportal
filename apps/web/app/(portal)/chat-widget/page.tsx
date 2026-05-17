"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface ChatWidget {
  id: string;
  publicKey: string;
  name: string;
  description: string | null;
  primaryColor: string;
  position: string;
  greetingMessage: string;
  aiEnabled: boolean;
  aiModel: string;
  aiIndustry: string | null;
  isActive: boolean;
  conversationCount: number;
  messageCount: number;
  siteId: string | null;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  subdomain: string;
}

const TABS = [
  { href: "/chat-widget", label: "Widgets" },
  { href: "/chat-widget/conversations", label: "Conversații" },
  { href: "/chat-widget/knowledge", label: "Knowledge base" },
];

const INDUSTRY_OPTIONS = [
  { v: "beauty", label: "Salon înfrumusețare" },
  { v: "barbershop", label: "Frizerie" },
  { v: "spa_wellness", label: "SPA / Wellness" },
  { v: "restaurant", label: "Restaurant" },
  { v: "medical", label: "Cabinet medical" },
  { v: "fitness", label: "Fitness" },
  { v: "education", label: "Educație" },
  { v: "real_estate", label: "Imobiliare" },
  { v: "general_business", label: "Business general" },
];

export default function ChatWidgetsPage() {
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    siteId: "",
    primaryColor: "#6366F1",
    position: "bottom-right",
    greetingMessage: "Bună! Cu ce te pot ajuta?",
    agentName: "Asistent",
    aiEnabled: true,
    aiIndustry: "general_business",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [wRes, sRes] = await Promise.all([
      api(`/api/v1/chat-widget/widgets`),
      api(`/api/v1/site-builder/sites`),
    ]);
    if (wRes.success) setWidgets(wRes.data || []);
    if (sRes.success) setSites(sRes.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;

    const res = await api(`/api/v1/chat-widget/widgets`, {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        siteId: form.siteId || undefined,
        primaryColor: form.primaryColor,
        position: form.position,
        greetingMessage: form.greetingMessage,
        agentName: form.agentName,
        aiEnabled: form.aiEnabled,
        aiIndustry: form.aiIndustry,
      }),
    });

    if (res.success) {
      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        siteId: "",
        primaryColor: "#6366F1",
        position: "bottom-right",
        greetingMessage: "Bună! Cu ce te pot ajuta?",
        agentName: "Asistent",
        aiEnabled: true,
        aiIndustry: "general_business",
      });
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi acest widget? Tot istoricul de conversații se va pierde.")) return;
    await api(`/api/v1/chat-widget/widgets/${id}`, { method: "DELETE" });
    await load();
  }

  async function copyEmbedCode(w: ChatWidget) {
    const webOrigin =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_WEB_BASE_URL || window.location.origin
        : "https://openportal.app";
    const code = `<script src="${webOrigin}/embed/chat.js?id=${w.publicKey}" async></script>`;
    await navigator.clipboard.writeText(code);
    alert("Cod copiat în clipboard:\n\n" + code);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Chat Widgets
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            AI chatbots embedabile pentru site-urile tale, cu RAG din knowledge base.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Widget nou
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/chat-widget" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/chat-widget" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/chat-widget" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
        >
          Se încarcă…
        </div>
      ) : widgets.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-base font-medium mb-2" style={{ color: "var(--text)" }}>
            Niciun widget creat
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Creează primul AI chatbot care răspunde clienților 24/7 pe site-ul tău.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            Creează widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {widgets.map((w) => (
            <div
              key={w.id}
              className="rounded-lg p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: w.primaryColor }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {w.name}
                    </div>
                    <div className="text-[10px] font-mono truncate" style={{ color: "var(--text-tertiary)" }}>
                      {w.publicKey}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {w.aiEnabled && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#6366F122", color: "#6366F1" }}
                    >
                      AI activ
                    </span>
                  )}
                  {!w.isActive && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#EF444422", color: "#EF4444" }}
                    >
                      inactiv
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                <div className="rounded p-2" style={{ background: "var(--bg-hover)" }}>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Conversații
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {w.conversationCount}
                  </div>
                </div>
                <div className="rounded p-2" style={{ background: "var(--bg-hover)" }}>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Mesaje
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {w.messageCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link href={`/chat-widget/${w.id}`} className="btn-secondary text-xs no-underline">
                  Configurează
                </Link>
                <button onClick={() => copyEmbedCode(w)} className="btn-secondary text-xs">
                  Cod embed
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-xs p-1.5 rounded ml-auto"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Șterge"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Widget nou
            </h2>

            <div className="space-y-3">
              <Field label="Nume">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full text-sm"
                  placeholder="Asistent Salon Luna"
                  autoFocus
                />
              </Field>

              <Field label="Site asociat (opțional)">
                <select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">— Fără site —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.subdomain}.openportal.app)
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Industria (pentru context AI)">
                <select
                  value={form.aiIndustry}
                  onChange={(e) => setForm({ ...form, aiIndustry: e.target.value })}
                  className="input w-full text-sm"
                >
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Culoare">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="input w-full"
                    style={{ height: 36 }}
                  />
                </Field>
                <Field label="Poziție">
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="bottom-right">Dreapta jos</option>
                    <option value="bottom-left">Stânga jos</option>
                  </select>
                </Field>
              </div>

              <Field label="Nume agent">
                <input
                  type="text"
                  value={form.agentName}
                  onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                  className="input w-full text-sm"
                />
              </Field>

              <Field label="Mesaj de întâmpinare">
                <textarea
                  value={form.greetingMessage}
                  onChange={(e) => setForm({ ...form, greetingMessage: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={form.aiEnabled}
                  onChange={(e) => setForm({ ...form, aiEnabled: e.target.checked })}
                />
                AI activat (răspunde automat fără intervenție umană)
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.name.trim() ? 0.5 : 1 }}
              >
                Creează widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
