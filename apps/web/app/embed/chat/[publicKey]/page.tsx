"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

// ─────────────────────────────────────────────
// /embed/chat/[publicKey]
//
// Iframe page that the chat.js loader mounts. Self-contained UI:
//   - Fetches widget config (colors, greeting, agent name)
//   - Resumes session via sessionStorage so a reload doesn't lose history
//   - Polls /messages?since=... every 2.5s for AI replies (no WS in MVP)
//   - Sends user messages via POST /conversations/:id/messages
//
// Posts {source: "openportal-chat", type: "close"} to parent when user
// clicks the X header button.
// ─────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const POLL_INTERVAL = 2500;

interface WidgetConfig {
  id: string;
  name: string;
  primaryColor: string;
  textColor: string;
  position: string;
  bubbleIconUrl: string | null;
  headerImageUrl: string | null;
  greetingMessage: string | null;
  awayMessage: string | null;
  showAvatar: boolean;
  agentName: string;
  agentAvatarUrl: string | null;
  aiEnabled: boolean;
  offlineCollectEmail: boolean;
}

interface Conversation {
  id: string;
  sessionId: string;
  status: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  createdAt: string;
}

function generateSessionId(): string {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatEmbedPage() {
  const params = useParams<{ publicKey: string }>();
  const publicKey = params?.publicKey;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined" || !publicKey) return "";
    const k = `op_chat_session_${publicKey}`;
    let existing = sessionStorage.getItem(k);
    if (!existing) {
      existing = generateSessionId();
      sessionStorage.setItem(k, existing);
    }
    return existing;
  }, [publicKey]);

  // Restore conversation id from sessionStorage so reloads keep history
  const persistedConvId = useMemo(() => {
    if (typeof window === "undefined" || !publicKey) return null;
    return sessionStorage.getItem(`op_chat_conv_${publicKey}`);
  }, [publicKey]);

  const fetchJson = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || `HTTP ${res.status}`);
    }
    return data.data;
  }, []);

  // ─── 1. Load widget config + start/resume conversation ───
  useEffect(() => {
    if (!publicKey || !sessionId) return;
    let cancelled = false;

    async function bootstrap() {
      try {
        const cfg = (await fetchJson(`/api/v1/chat-widget/public/widget?key=${encodeURIComponent(publicKey!)}`)) as WidgetConfig;
        if (cancelled) return;
        setConfig(cfg);

        const c = (await fetchJson(`/api/v1/chat-widget/public/conversations`, {
          method: "POST",
          body: JSON.stringify({
            publicKey,
            sessionId,
            pageUrl: typeof window !== "undefined" ? document.referrer || window.location.href : null,
            referrer: typeof window !== "undefined" ? document.referrer || null : null,
            userAgent: typeof window !== "undefined" ? navigator.userAgent : null,
          }),
        })) as Conversation;
        if (cancelled) return;
        setConv(c);
        sessionStorage.setItem(`op_chat_conv_${publicKey}`, c.id);

        // Initial message fetch
        const msgs = (await fetchJson(
          `/api/v1/chat-widget/public/conversations/${c.id}/messages?publicKey=${encodeURIComponent(publicKey!)}&sessionId=${encodeURIComponent(sessionId)}`,
        )) as Message[];
        if (cancelled) return;
        setMessages(msgs);
        lastMsgIdRef.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [publicKey, sessionId, persistedConvId, fetchJson]);

  // ─── 2. Polling loop for new messages ───
  useEffect(() => {
    if (!conv || !publicKey || !sessionId) return;
    let cancelled = false;

    async function poll() {
      try {
        const last = messages.length > 0 ? messages[messages.length - 1].createdAt : null;
        const sinceParam = last ? `&since=${encodeURIComponent(last)}` : "";
        const newOnes = (await fetchJson(
          `/api/v1/chat-widget/public/conversations/${conv!.id}/messages?publicKey=${encodeURIComponent(publicKey!)}&sessionId=${encodeURIComponent(sessionId)}${sinceParam}`,
        )) as Message[];
        if (cancelled || newOnes.length === 0) return;
        setMessages((prev) => {
          const seenIds = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of newOnes) {
            if (!seenIds.has(m.id)) merged.push(m);
          }
          return merged;
        });
      } catch {
        // ignore transient poll errors
      }
    }

    const handle = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [conv, publicKey, sessionId, messages, fetchJson]);

  // ─── 3. Auto-scroll to bottom on new message ───
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── 4. Send message ───
  async function sendMessage() {
    if (!conv || !publicKey || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic insert
    const tempId = `tmp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);

    try {
      const saved = (await fetchJson(`/api/v1/chat-widget/public/conversations/${conv.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ publicKey, sessionId, content: text }),
      })) as Message;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  function close() {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ source: "openportal-chat", type: "close" }, "*");
    }
  }

  if (!publicKey) return null;

  const color = config?.primaryColor || "#6366F1";
  const textColor = config?.textColor || "#FFFFFF";
  const agentName = config?.agentName || config?.name || "Asistent";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#F8FAFC",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: color,
          color: textColor,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {config?.agentAvatarUrl ? (
          <img
            src={config.agentAvatarUrl}
            alt=""
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {agentName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{agentName}</div>
          <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.2, marginTop: 2 }}>
            {conv?.status === "human_handling" ? "Vorbești cu un agent" : config?.aiEnabled ? "AI · răspuns rapid" : "Online"}
          </div>
        </div>
        <button
          onClick={close}
          aria-label="Închide"
          style={{
            background: "transparent",
            border: "none",
            color: textColor,
            opacity: 0.85,
            cursor: "pointer",
            padding: 6,
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          &#x2715;
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {error && (
          <div
            style={{
              padding: 10,
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #FECACA",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            {error}
          </div>
        )}
        {messages.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "#94A3B8", fontSize: 12 }}>
            Se încarcă…
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "82%",
                background: isUser ? color : "#FFFFFF",
                color: isUser ? textColor : "#0F172A",
                padding: "9px 13px",
                borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize: 13.5,
                lineHeight: 1.45,
                boxShadow: isUser ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.6,
                  marginTop: 4,
                  textAlign: isUser ? "right" : "left",
                }}
              >
                {formatTime(m.createdAt)}
              </div>
            </div>
          );
        })}
        {sending && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#FFFFFF",
              padding: "9px 13px",
              borderRadius: "14px 14px 14px 4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              display: "flex",
              gap: 4,
            }}
          >
            <span style={dotStyle(0)} />
            <span style={dotStyle(150)} />
            <span style={dotStyle(300)} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        style={{
          padding: "10px 12px",
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Scrie un mesaj…"
          rows={1}
          style={{
            flex: 1,
            border: "1px solid #CBD5E1",
            borderRadius: 12,
            padding: "9px 12px",
            fontSize: 13.5,
            fontFamily: "inherit",
            resize: "none",
            maxHeight: 96,
            outline: "none",
            background: "#F8FAFC",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          style={{
            background: color,
            color: textColor,
            border: "none",
            borderRadius: 10,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: input.trim() && !sending ? "pointer" : "not-allowed",
            opacity: input.trim() && !sending ? 1 : 0.55,
            whiteSpace: "nowrap",
          }}
        >
          Trimite
        </button>
      </form>

      <style jsx global>{`
        @keyframes op-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

function dotStyle(delayMs: number): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#94A3B8",
    display: "inline-block",
    animation: `op-pulse 1.2s ease-in-out ${delayMs}ms infinite`,
  };
}
