"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Conversation {
  id: string;
  widgetId: string;
  sessionId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  channel: string;
  status: string;
  pageUrl: string | null;
  pageTitle: string | null;
  messageCount: number;
  totalTokensUsed: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  tags: string[];
  customerSentiment: string | null;
  createdAt: string;
}

interface Widget {
  id: string;
  name: string;
  primaryColor: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  modelUsed: string | null;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

const TABS = [
  { href: "/chat-widget", label: "Widgets" },
  { href: "/chat-widget/conversations", label: "Conversații" },
  { href: "/chat-widget/knowledge", label: "Knowledge base" },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Deschisă",
  ai_handling: "AI răspunde",
  human_handling: "Agent uman",
  queued: "În coadă",
  resolved: "Rezolvată",
  abandoned: "Abandonată",
  spam: "Spam",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#06B6D4",
  ai_handling: "#6366F1",
  human_handling: "#10B981",
  queued: "#F59E0B",
  resolved: "#52525B",
  abandoned: "#71717A",
  spam: "#EF4444",
};

const ROLE_LABELS: Record<string, string> = {
  user: "Vizitator",
  assistant: "AI",
  agent: "Agent",
  system: "Sistem",
  tool: "Tool",
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [widgetFilter, setWidgetFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, widgetFilter]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter) params.append("status", statusFilter);
    if (widgetFilter) params.append("widgetId", widgetFilter);

    const [cRes, wRes] = await Promise.all([
      api(`/api/v1/chat-widget/conversations?${params}`),
      api(`/api/v1/chat-widget/widgets`),
    ]);
    if (cRes.success) setConversations(cRes.data || []);
    if (wRes.success) setWidgets(wRes.data || []);
    setLoading(false);
  }

  async function loadMessages(id: string) {
    const res = await api(`/api/v1/chat-widget/conversations/${id}`);
    if (res.success) setMessages(res.data?.messages || []);
  }

  async function sendReply() {
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    const res = await api(`/api/v1/chat-widget/conversations/${selectedId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: reply, role: "agent" }),
    });
    setSending(false);
    if (res.success) {
      setReply("");
      await loadMessages(selectedId);
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function setStatus(id: string, status: string) {
    await api(`/api/v1/chat-widget/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Conversații
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Inbox cu toate conversațiile din widget-urile tale.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/chat-widget/conversations" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/chat-widget/conversations" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/chat-widget/conversations" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={widgetFilter}
          onChange={(e) => setWidgetFilter(e.target.value)}
          className="input text-xs"
          style={{ width: 220 }}
        >
          <option value="">Toate widget-urile</option>
          {widgets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input text-xs"
          style={{ width: 180 }}
        >
          <option value="">Toate statusurile</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* List */}
        <div className="col-span-12 md:col-span-5">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {loading ? (
              <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Se încarcă…
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Nicio conversație încă.
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="w-full text-left p-3 transition-colors"
                    style={{
                      background: selectedId === c.id ? "var(--bg-hover)" : "transparent",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                        {c.visitorName || c.visitorEmail || c.visitorPhone || c.sessionId.slice(0, 12)}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-1"
                        style={{
                          background: (STATUS_COLORS[c.status] || "#71717A") + "22",
                          color: STATUS_COLORS[c.status] || "#71717A",
                        }}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>
                      {c.pageTitle || c.pageUrl || "—"}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {c.messageCount} mesaje
                      {c.lastMessageAt
                        ? ` · ${new Date(c.lastMessageAt).toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="col-span-12 md:col-span-7">
          {!selectedConv ? (
            <div
              className="rounded-lg p-8 text-center text-sm"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
            >
              Selectează o conversație din listă.
            </div>
          ) : (
            <div
              className="rounded-lg flex flex-col"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", height: 600 }}
            >
              <div
                className="p-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    {selectedConv.visitorName || selectedConv.visitorEmail || selectedConv.visitorPhone || "Vizitator anonim"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {selectedConv.pageUrl || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedConv.status !== "resolved" && (
                    <button onClick={() => setStatus(selectedConv.id, "resolved")} className="btn-secondary text-xs">
                      Rezolvă
                    </button>
                  )}
                  {selectedConv.status !== "spam" && (
                    <button onClick={() => setStatus(selectedConv.id, "spam")} className="text-xs px-2 py-1" style={{ color: "var(--text-tertiary)" }}>
                      Spam
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-sm py-8" style={{ color: "var(--text-tertiary)" }}>
                    Niciun mesaj încă.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isVisitor = m.role === "user";
                    return (
                      <div key={m.id} className={`flex ${isVisitor ? "justify-start" : "justify-end"}`}>
                        <div className="max-w-[80%]">
                          <div
                            className="text-[10px] mb-1"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {ROLE_LABELS[m.role] || m.role}
                            {m.modelUsed ? ` · ${m.modelUsed}` : ""}
                          </div>
                          <div
                            className="rounded-lg p-2.5 text-sm"
                            style={{
                              background: isVisitor ? "var(--bg-hover)" : "var(--accent)",
                              color: isVisitor ? "var(--text)" : "white",
                            }}
                          >
                            {m.content}
                          </div>
                          <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(m.createdAt).toLocaleString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="p-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Scrie un răspuns ca agent…"
                    className="input flex-1 text-sm"
                    disabled={sending}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="btn-primary text-sm"
                    style={{ opacity: !reply.trim() || sending ? 0.5 : 1 }}
                  >
                    Trimite
                  </button>
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Răspunsul tău va prelua conversația de la AI (status devine "Agent uman").
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
