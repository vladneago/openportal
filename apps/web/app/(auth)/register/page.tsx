"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    tenantName: "",
    tenantSlug: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from tenant name
    if (field === "tenantName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      setForm((prev) => ({ ...prev, tenantName: value, tenantSlug: slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Registration failed");
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken", data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("tenant", JSON.stringify(data.data.tenant));

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Mobile logo */}
      <div className="mb-8 lg:hidden flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-slate-900">OpenPortal</span>
      </div>

      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Creează-ți organizația</h2>
        <p className="text-slate-500">Gratuit pentru echipe de până la 10 persoane.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 animate-slide-down">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
              Prenume
            </label>
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="input"
              placeholder="Ion"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
              Nume
            </label>
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="input"
              placeholder="Popescu"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="input"
            placeholder="ion@companie.ro"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Parolă
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="input"
            placeholder="Min. 8 caractere, 1 majusculă, 1 cifră"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenantName" className="block text-sm font-medium text-slate-700">
            Numele organizației
          </label>
          <input
            id="tenantName"
            type="text"
            value={form.tenantName}
            onChange={(e) => updateField("tenantName", e.target.value)}
            className="input"
            placeholder="Compania Mea SRL"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenantSlug" className="block text-sm font-medium text-slate-700">
            URL organizație
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              openportal.app/
            </span>
            <input
              id="tenantSlug"
              type="text"
              value={form.tenantSlug}
              onChange={(e) => updateField("tenantSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="input rounded-l-none"
              placeholder="compania-mea"
              required
              minLength={3}
              pattern="^[a-z0-9-]+$"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Se creează...
            </span>
          ) : (
            "Creează organizația"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Autentifică-te
        </Link>
      </p>
    </div>
  );
}
