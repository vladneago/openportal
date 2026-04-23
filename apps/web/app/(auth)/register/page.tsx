"use client";

import { useState } from "react";
import Link from "next/link";
import { api, setAuth } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", tenantName: "", tenantSlug: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "tenantName") {
        next.tenantSlug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 50);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/api/v1/auth/register", { method: "POST", body: JSON.stringify(form) });
      if (!res.success) { setError(res.error?.message || "Înregistrare eșuată"); return; }
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
      <div className="mb-10 lg:hidden flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          <span className="text-white text-[13px] font-semibold">O</span>
        </div>
        <span className="text-base font-medium tracking-tight" style={{ color: "var(--text)" }}>OpenPortal</span>
      </div>

      <h2 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.025em" }}>Creează organizația</h2>
      <p className="mt-1 text-[13px] mb-8" style={{ color: "var(--text-tertiary)" }}>Gratuit pentru echipe de până la 10 persoane.</p>

      {error && (
        <div className="mb-5 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Prenume</label>
            <input type="text" className="input" placeholder="Ion" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nume</label>
            <input type="text" className="input" placeholder="Popescu" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" className="input" placeholder="ion@companie.ro" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Parolă</label>
          <input type="password" className="input" placeholder="Min. 8 caractere" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Numele organizației</label>
          <input type="text" className="input" placeholder="Compania Mea SRL" value={form.tenantName} onChange={(e) => update("tenantName", e.target.value)} required />
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>URL organizație</label>
          <div className="flex">
            <span className="flex items-center rounded-l-md px-2.5 text-[11px]" style={{ background: "var(--border)", color: "var(--text-tertiary)", border: "1px solid var(--border-hover)", borderRight: 0 }}>
              openportal.app/
            </span>
            <input type="text" className="input rounded-l-none" placeholder="compania-mea" value={form.tenantSlug}
              onChange={(e) => update("tenantSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required minLength={3} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2">
          {loading ? "Se creează..." : "Creează organizația"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium no-underline" style={{ color: "var(--text)" }}>Autentifică-te</Link>
      </p>
    </div>
  );
}
