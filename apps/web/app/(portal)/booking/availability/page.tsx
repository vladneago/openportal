"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Resource {
  id: string;
  name: string;
  type: string;
  color: string;
  isActive: boolean;
  isBookableOnline: boolean;
}

interface Rule {
  id: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  isActive: boolean;
}

const TABS = [
  { href: "/booking", label: "Programări" },
  { href: "/booking/calendar", label: "Calendar" },
  { href: "/booking/services", label: "Servicii" },
  { href: "/booking/resources", label: "Personal & Spații" },
  { href: "/booking/availability", label: "Program" },
  { href: "/booking/customers", label: "Clienți" },
];

const DAYS = [
  { v: 1, label: "Luni", short: "L" },
  { v: 2, label: "Marți", short: "Ma" },
  { v: 3, label: "Miercuri", short: "Mi" },
  { v: 4, label: "Joi", short: "J" },
  { v: 5, label: "Vineri", short: "V" },
  { v: 6, label: "Sâmbătă", short: "S" },
  { v: 0, label: "Duminică", short: "D" },
];

const PRESETS = [
  { label: "9-17 (program birou)", start: "09:00", end: "17:00" },
  { label: "9-19 (salon)", start: "09:00", end: "19:00" },
  { label: "10-22 (seara)", start: "10:00", end: "22:00" },
  { label: "8-13 (dimineața)", start: "08:00", end: "13:00" },
  { label: "14-20 (după-amiaza)", start: "14:00", end: "20:00" },
];

function normalizeTime(t: string): string {
  // "09:00:00" → "09:00"
  return t.slice(0, 5);
}

export default function AvailabilityPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<number | null>(null);

  const [form, setForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
  });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedResourceId) loadRules(selectedResourceId);
  }, [selectedResourceId]);

  async function load() {
    setLoading(true);
    const res = await api(`/api/v1/booking/resources?active=true`);
    if (res.success) {
      const list = (res.data as Resource[]) || [];
      setResources(list);
      if (list.length > 0 && !selectedResourceId) {
        setSelectedResourceId(list[0].id);
      }
    }
    setLoading(false);
  }

  async function loadRules(resourceId: string) {
    const res = await api(`/api/v1/booking/availability?resourceId=${resourceId}`);
    if (res.success) setRules((res.data as Rule[]) || []);
  }

  async function addRule(dayOfWeek: number) {
    if (!selectedResourceId) return;
    if (form.startTime >= form.endTime) {
      alert("Ora de început trebuie să fie înainte de ora de sfârșit");
      return;
    }
    const res = await api(`/api/v1/booking/availability`, {
      method: "POST",
      body: JSON.stringify({
        resourceId: selectedResourceId,
        dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        isActive: true,
      }),
    });
    if (res.success) {
      setShowAdd(null);
      setForm({ startTime: "09:00", endTime: "17:00" });
      await loadRules(selectedResourceId);
    } else {
      alert(res.error?.message || "Eroare la salvare");
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Ștergi acest interval?")) return;
    await api(`/api/v1/booking/availability/${id}`, { method: "DELETE" });
    await loadRules(selectedResourceId);
  }

  async function applyPreset(preset: { start: string; end: string }, mondayToFriday: boolean) {
    if (!selectedResourceId) return;
    const days = mondayToFriday ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
    // Avoid duplicates: check existing rules per day
    let added = 0;
    let skipped = 0;
    for (const dow of days) {
      const existing = rules.some(
        (r) =>
          r.resourceId === selectedResourceId &&
          r.dayOfWeek === dow &&
          normalizeTime(r.startTime) === preset.start &&
          normalizeTime(r.endTime) === preset.end,
      );
      if (existing) {
        skipped++;
        continue;
      }
      const res = await api(`/api/v1/booking/availability`, {
        method: "POST",
        body: JSON.stringify({
          resourceId: selectedResourceId,
          dayOfWeek: dow,
          startTime: preset.start,
          endTime: preset.end,
          isActive: true,
        }),
      });
      if (res.success) added++;
    }
    await loadRules(selectedResourceId);
    if (skipped > 0) {
      console.log(`Sărit peste ${skipped} duplicate, adăugat ${added}`);
    }
  }

  const rulesByDay = useMemo(() => {
    const map = new Map<number, Rule[]>();
    for (const r of rules) {
      if (!map.has(r.dayOfWeek)) map.set(r.dayOfWeek, []);
      map.get(r.dayOfWeek)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [rules]);

  const selectedResource = resources.find((r) => r.id === selectedResourceId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Program săptămânal
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Definește orarul de lucru pentru fiecare resursă. Sloturile booking online se generează din acest program.
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
              color: tab.href === "/booking/availability" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/booking/availability" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/booking/availability" ? 500 : 400,
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
      ) : resources.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-base font-medium mb-2" style={{ color: "var(--text)" }}>
            Nu ai nicio resursă activă
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Adaugă cel puțin un membru de personal pentru a putea defini programul.
          </p>
          <Link href="/booking/resources" className="btn-primary text-sm no-underline">
            Adaugă personal
          </Link>
        </div>
      ) : (
        <>
          {/* Resource picker */}
          <div className="mb-4">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--text)" }}>
              Resursă
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResourceId(r.id)}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors"
                  style={{
                    background:
                      selectedResourceId === r.id ? "var(--bg-hover)" : "var(--bg-surface)",
                    border: `1px solid ${selectedResourceId === r.id ? r.color : "var(--border)"}`,
                    color: "var(--text)",
                    fontWeight: selectedResourceId === r.id ? 500 : 400,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: r.color }}
                  />
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          {selectedResource && (
            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                Aplică rapid program luni-vineri pentru {selectedResource.name}:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p, true)}
                    className="btn-secondary text-xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weekly grid */}
          {selectedResource && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              {DAYS.map((d) => {
                const dayRules = rulesByDay.get(d.v) || [];
                const isAdding = showAdd === d.v;
                return (
                  <div
                    key={d.v}
                    className="flex items-stretch gap-4 px-4 py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div
                      className="font-medium text-sm pt-2 shrink-0"
                      style={{ color: "var(--text)", width: 100 }}
                    >
                      {d.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      {dayRules.length === 0 && !isAdding ? (
                        <div
                          className="text-xs pt-2"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          Închis
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          {dayRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
                              style={{
                                background: selectedResource.color + "22",
                                color: "var(--text)",
                              }}
                            >
                              <span className="font-mono font-medium">
                                {normalizeTime(rule.startTime)} – {normalizeTime(rule.endTime)}
                              </span>
                              <button
                                onClick={() => deleteRule(rule.id)}
                                className="text-xs ml-1"
                                style={{ color: "var(--text-tertiary)" }}
                                title="Șterge"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {isAdding && (
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                              style={{ background: "var(--bg-hover)" }}
                            >
                              <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="input text-xs"
                                style={{ width: 90 }}
                              />
                              <span style={{ color: "var(--text-tertiary)" }}>–</span>
                              <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="input text-xs"
                                style={{ width: 90 }}
                              />
                              <button onClick={() => addRule(d.v)} className="btn-primary text-xs">
                                Salvează
                              </button>
                              <button
                                onClick={() => setShowAdd(null)}
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Renunță
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {!isAdding && (
                        <button
                          onClick={() => setShowAdd(d.v)}
                          className="btn-secondary text-xs"
                        >
                          + Interval
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Blocked slots shortcut */}
          {selectedResource && (
            <div className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <strong>Notă:</strong> pentru pauze de zi, concedii sau închideri excepționale folosește
              endpoint-ul <code>/api/v1/booking/blocked-slots</code> (UI dedicat va veni separat).
              Intervalele de mai sus se aplică recurent în fiecare săptămână.
            </div>
          )}
        </>
      )}
    </div>
  );
}
