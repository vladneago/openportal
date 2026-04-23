"use client";

import { useState } from "react";

const USERS = [
  { id: "1", name: "Alexandru Ionescu", email: "admin@acme.ro", role: "owner", department: "IT", status: "active", lastLogin: "acum 2 min", initials: "AI", color: "#6366F1" },
  { id: "2", name: "Maria Popescu", email: "maria@acme.ro", role: "admin", department: "Resurse Umane", status: "active", lastLogin: "acum 1 oră", initials: "MP", color: "#EC4899" },
  { id: "3", name: "Andrei Constantin", email: "andrei@acme.ro", role: "member", department: "IT", status: "active", lastLogin: "acum 3 ore", initials: "AC", color: "#0EA5E9" },
];

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Membru", guest: "Vizitator" };

export default function AdminUsersPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Utilizatori</h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>{USERS.length} utilizatori în Acme Corporation</p>
        </div>
        <button className="btn-primary" onClick={() => setShowInvite(!showInvite)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Invită
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="panel p-4 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
            <input
              type="email"
              className="input"
              placeholder="coleg@companie.ro"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Rol</label>
            <select
              className="input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Membru</option>
              <option value="admin">Admin</option>
              <option value="guest">Vizitator</option>
            </select>
          </div>
          <button className="btn-primary shrink-0" onClick={() => { setShowInvite(false); setInviteEmail(""); }}>
            Trimite invitație
          </button>
          <button className="btn-secondary shrink-0" onClick={() => setShowInvite(false)}>
            Anulează
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="panel">
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <div className="col-span-4">Utilizator</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Departament</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Ultima conectare</div>
        </div>

        {USERS.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-12 gap-4 items-center px-4 py-3 transition-colors cursor-pointer"
            style={{ borderBottom: "1px solid var(--page-bg)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{ background: user.color + "15", color: user.color }}>{user.initials}</div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--text)" }}>{user.name}</p>
                <p className="text-[10.5px] truncate" style={{ color: "var(--text-tertiary)" }}>{user.email}</p>
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: "var(--page-bg)", color: "var(--text-secondary)" }}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div className="col-span-2 text-xs" style={{ color: "var(--text-secondary)" }}>{user.department}</div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--success)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                Activ
              </span>
            </div>
            <div className="col-span-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{user.lastLogin}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
