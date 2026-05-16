"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AuthAwareHeaderCTA() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("accessToken");
      setAuthed(Boolean(t));
    } catch {
      setAuthed(false);
    }
  }, []);

  // SSR fallback: render the unauthenticated state to avoid flash
  if (authed === null || authed === false) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link
          href="/login"
          style={{
            color: "#0F172A",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 500,
            padding: "8px 14px",
          }}
        >
          Conectează-te
        </Link>
        <Link
          href="/register"
          style={{
            background: "#6366F1",
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            padding: "10px 18px",
            borderRadius: 8,
          }}
        >
          Începe gratuit
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/dashboard"
      style={{
        background: "#6366F1",
        color: "#FFFFFF",
        textDecoration: "none",
        fontSize: "0.95rem",
        fontWeight: 600,
        padding: "10px 18px",
        borderRadius: 8,
      }}
    >
      Mergi la dashboard →
    </Link>
  );
}
