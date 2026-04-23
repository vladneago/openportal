"use client";

import { useState } from "react";
import Link from "next/link";
import { api, setAuth } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.success) {
        setError(res.error?.message || "Autentificare eșuată");
        return;
      }

      setAuth(res.data.tokens, res.data.user, res.data.tenant);
      window.location.href = "/dashboard";
    } catch {
      setError("Nu se poate conecta la server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="mb-10 lg:hidden flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          <span className="text-white text-[13px] font-semibold">O</span>
        </div>
        <span className="text-base font-medium tracking-tight" style={{ color: "var(--text)" }}>OpenPortal</span>
      </div>

      <h2 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Bine ai revenit</h2>
      <p className="mt-1 text-[13px] mb-8" style={{ color: "var(--text-tertiary)" }}>
        Introdu datele tale pentru a continua.
      </p>

      {error && (
        <div className="mb-5 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" className="input" placeholder="nume@companie.ro" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Parolă</label>
          </div>
          <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2">
          {loading ? "Se conectează..." : "Autentificare"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        Nu ai cont?{" "}
        <Link href="/register" className="font-medium no-underline" style={{ color: "var(--text)" }}>Creează o organizație</Link>
      </p>
    </div>
  );
}
