"use client";

import { useEffect, useState } from "react";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consented = localStorage.getItem("gdpr_consent");
      if (!consented) setShow(true);
    } catch {
      // localStorage unavailable — show by default
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 720,
        margin: "0 auto",
        background: "rgba(15, 23, 42, 0.95)",
        color: "#FAFAFA",
        padding: "14px 20px",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.85rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 100,
        flexWrap: "wrap",
      }}
    >
      <span>
        🍪 Folosim cookies pentru a-ți oferi cea mai bună experiență. Continuând, ești de acord cu politica de cookies.
      </span>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem("gdpr_consent", "1");
          } catch {
            // ignore
          }
          setShow(false);
        }}
        style={{
          background: "#FFFFFF",
          color: "#0F172A",
          border: "none",
          padding: "8px 16px",
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Accept
      </button>
    </div>
  );
}
