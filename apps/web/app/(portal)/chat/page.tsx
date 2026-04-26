"use client";

import { useState, useEffect, useRef } from "react";
import { api, getUser } from "@/lib/api";

interface Channel { id: string; name: string; type: string; icon: string; messageCount: number; memberCount: number; }
interface Message { id: string; body: string; createdAt: string; createdBy: string; authorName: string | null; authorFirstName: string; authorLastName: string; reactions: Record<string, string[]>; parentId: string | null; }

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => { setUser(getUser()); loadChannels(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);
  useEffect(() => { if (activeChannel) loadMessages(); }, [activeChannel]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeChannel) {
      pollRef.current = setInterval(() => loadMessages(), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannel]);

  async function loadChannels() {
    setLoading(true);
    const res = await api("/api/v1/chat/channels");
    if (res.success) {
      setChannels(res.data || []);
      if (res.data?.length && !activeChannel) setActiveChannel(res.data[0]);
    }
    setLoading(false);
  }

  async function loadMessages() {
    if (!activeChannel) return;
    const res = await api(`/api/v1/chat/channels/${activeChannel.id}/messages?limit=100`);
    if (res.success) setMessages(res.data || []);
  }

  async function handleCreateChannel() {
    if (!newChannelName.trim()) return;
    const res = await api("/api/v1/chat/channels", { method: "POST", body: JSON.stringify({ name: newChannelName.trim() }) });
    if (res.success) { setShowCreate(false); setNewChannelName(""); await loadChannels(); if (res.data) setActiveChannel(res.data); }
  }

  async function handleSend() {
    if (!newMessage.trim() || !activeChannel) return;
    await api(`/api/v1/chat/channels/${activeChannel.id}/messages`, { method: "POST", body: JSON.stringify({ body: newMessage.trim() }) });
    setNewMessage("");
    await loadMessages();
  }

  async function handleReact(msgId: string, emoji: string) {
    await api(`/api/v1/chat/messages/${msgId}/react`, { method: "POST", body: JSON.stringify({ emoji }) });
    await loadMessages();
  }

  async function handleDeleteMsg(msgId: string) {
    await api(`/api/v1/chat/messages/${msgId}`, { method: "DELETE" });
    await loadMessages();
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: string) => new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
  const getInitials = (m: Message) => `${(m.authorFirstName || "?")[0]}${(m.authorLastName || "?")[0]}`;

  return (
    <div className="-mx-7 -my-8 flex" style={{ height: "calc(100vh - 52px)" }}>
      {/* Channel list */}
      <div className="w-[240px] shrink-0 flex flex-col" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Mesaje</span>
          <button onClick={() => setShowCreate(true)} className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
            style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        {showCreate && (
          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <input className="input" autoFocus placeholder="Nume canal..." value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel(); if (e.key === "Escape") setShowCreate(false); }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-none py-2 px-2">
          {channels.length === 0 && !loading ? (
            <div className="text-center py-8 text-[11px]" style={{ color: "var(--text-tertiary)" }}>Niciun canal. Creează unul!</div>
          ) : channels.map((ch) => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)}
              className="w-full border-0 cursor-pointer rounded-md px-3 py-2 flex items-center gap-2.5 transition-colors mb-0.5 text-left"
              style={{
                background: activeChannel?.id === ch.id ? "var(--page-bg)" : "transparent",
                color: activeChannel?.id === ch.id ? "var(--text)" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { if (activeChannel?.id !== ch.id) e.currentTarget.style.background = "var(--page-bg)"; }}
              onMouseLeave={(e) => { if (activeChannel?.id !== ch.id) e.currentTarget.style.background = "transparent"; }}>
              <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>{ch.icon}</span>
              <span className="text-[12.5px] font-medium truncate">{ch.name}</span>
              {ch.messageCount > 0 && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text-tertiary)" }}>{ch.messageCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{activeChannel.icon} {activeChannel.name}</span>
                <span className="text-[11px] ml-2" style={{ color: "var(--text-tertiary)" }}>{activeChannel.memberCount} membri</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Niciun mesaj încă. Fii primul care scrie!
                </div>
              ) : messages.map((msg, i) => {
                const showAvatar = i === 0 || messages[i - 1].createdBy !== msg.createdBy || new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 300000;
                return (
                  <div key={msg.id} className={`group flex gap-3 ${showAvatar ? "mt-4" : "mt-0.5"}`}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{ padding: "2px 4px", borderRadius: 6, marginLeft: -4, marginRight: -4, transition: "background 0.1s" }}>
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-semibold"
                          style={{ background: "#6366F115", color: "#6366F1" }}>{getInitials(msg)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{msg.authorName || `${msg.authorFirstName} ${msg.authorLastName}`}</span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatTime(msg.createdAt)}</span>
                        </div>
                      )}
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text)", margin: 0 }}>{msg.body}</p>

                      {/* Reactions */}
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="border-0 cursor-pointer px-1.5 py-0.5 rounded-full text-[11px] transition-colors flex items-center gap-1"
                              style={{ background: (userIds as string[]).includes(user?.id) ? "#6366F120" : "var(--border)", color: "var(--text-secondary)" }}>
                              {emoji} {(userIds as string[]).length}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 mt-1">
                        {["👍", "❤️", "😄", "🎉"].map((emoji) => (
                          <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                            className="border-0 bg-transparent cursor-pointer p-1 rounded text-xs transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>{emoji}</button>
                        ))}
                        {msg.createdBy === user?.id && (
                          <button onClick={() => handleDeleteMsg(msg.id)}
                            className="border-0 bg-transparent cursor-pointer p-1 rounded transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "#FEE2E2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <input className="input flex-1" placeholder={`Scrie în #${activeChannel.name}...`} value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="btn-primary shrink-0 px-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {loading ? "Se încarcă..." : "Selectează sau creează un canal"}
          </div>
        )}
      </div>
    </div>
  );
}
