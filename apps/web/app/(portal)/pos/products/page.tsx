"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  status: string;
  categoryId: string | null;
  costPrice: string;
  sellingPrice: string;
  currency: string;
  vatRate: string;
  unitOfMeasure: string;
  trackInventory: boolean;
  stockQuantity: string;
  reorderPoint: string | null;
  imageUrl: string | null;
  isPosEnabled: boolean;
  isOnlineEnabled: boolean;
  totalSold: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const TABS = [
  { href: "/pos", label: "Terminal" },
  { href: "/pos/products", label: "Produse" },
  { href: "/pos/reports", label: "Rapoarte" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    sku: "",
    barcode: "",
    name: "",
    slug: "",
    description: "",
    type: "physical",
    status: "active",
    categoryId: "",
    costPrice: "0",
    sellingPrice: "0",
    vatRate: "19.00",
    unitOfMeasure: "buc",
    trackInventory: true,
    stockQuantity: "0",
    reorderPoint: "0",
    isPosEnabled: true,
    isOnlineEnabled: false,
  });

  const [catForm, setCatForm] = useState({ name: "", slug: "", color: "#6366F1" });

  useEffect(() => {
    const t = setTimeout(load, search || showLowStock ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showLowStock]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (search) params.append("search", search);
    if (showLowStock) params.append("lowStock", "true");

    const [prodRes, catRes] = await Promise.all([
      api(`/api/v1/pos/products?${params}`),
      api(`/api/v1/pos/categories`),
    ]);
    if (prodRes.success) setProducts(prodRes.data || []);
    if (catRes.success) setCategories(catRes.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      sku: "",
      barcode: "",
      name: "",
      slug: "",
      description: "",
      type: "physical",
      status: "active",
      categoryId: "",
      costPrice: "0",
      sellingPrice: "0",
      vatRate: "19.00",
      unitOfMeasure: "buc",
      trackInventory: true,
      stockQuantity: "0",
      reorderPoint: "0",
      isPosEnabled: true,
      isOnlineEnabled: false,
    });
    setEditing(null);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      barcode: p.barcode ?? "",
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      type: p.type,
      status: p.status,
      categoryId: p.categoryId ?? "",
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      vatRate: p.vatRate,
      unitOfMeasure: p.unitOfMeasure,
      trackInventory: p.trackInventory,
      stockQuantity: p.stockQuantity,
      reorderPoint: p.reorderPoint ?? "0",
      isPosEnabled: p.isPosEnabled,
      isOnlineEnabled: p.isOnlineEnabled,
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.sku.trim() || !form.name.trim()) return;

    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      categoryId: form.categoryId || undefined,
      barcode: form.barcode || undefined,
      description: form.description || undefined,
    };

    const res = editing
      ? await api(`/api/v1/pos/products/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await api(`/api/v1/pos/products`, { method: "POST", body: JSON.stringify(payload) });

    if (res.success) {
      setShowCreate(false);
      resetForm();
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi acest produs?")) return;
    await api(`/api/v1/pos/products/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleCategorySave() {
    if (!catForm.name.trim()) return;
    const res = await api(`/api/v1/pos/categories`, {
      method: "POST",
      body: JSON.stringify({
        name: catForm.name,
        slug: catForm.slug || slugify(catForm.name),
        color: catForm.color,
      }),
    });
    if (res.success) {
      setShowCategoryCreate(false);
      setCatForm({ name: "", slug: "", color: "#6366F1" });
      await load();
    } else {
      alert(res.error?.message || "Eroare");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Produse
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Catalog cu produse, stoc, preț cost și preț vânzare.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategoryCreate(true)} className="btn-secondary">
            + Categorie
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            className="btn-primary"
          >
            + Produs
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-sm px-3 py-1.5 rounded-md no-underline"
            style={{
              color: tab.href === "/pos/products" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/pos/products" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/pos/products" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume, SKU, barcode…"
          className="input flex-1 text-sm"
        />
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text)" }}>
          <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} />
          Stoc redus
        </label>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Se încarcă…
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Niciun produs găsit." : "Niciun produs încă. Adaugă primul produs."}
          </div>
        ) : (
          products.map((p) => {
            const stock = Number(p.stockQuantity);
            const reorderPoint = Number(p.reorderPoint || 0);
            const lowStock = p.trackInventory && stock <= reorderPoint;
            const category = categories.find((c) => c.id === p.categoryId);

            return (
              <div
                key={p.id}
                className="flex items-center gap-4 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {p.sku}
                    </span>
                    <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                      {p.name}
                    </span>
                    {category && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: category.color + "22", color: category.color }}
                      >
                        {category.name}
                      </span>
                    )}
                    {p.status === "out_of_stock" && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "#EF444422", color: "#EF4444" }}
                      >
                        epuizat
                      </span>
                    )}
                    {lowStock && p.status !== "out_of_stock" && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "#F59E0B22", color: "#F59E0B" }}
                      >
                        stoc redus
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {p.trackInventory
                      ? `Stoc: ${stock.toFixed(0)} ${p.unitOfMeasure}`
                      : "Fără urmărire stoc"}
                    {p.totalSold > 0 ? ` · vândute ${p.totalSold}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {Number(p.sellingPrice).toFixed(2)} {p.currency}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    cost {Number(p.costPrice).toFixed(2)} · TVA {p.vatRate}%
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="btn-secondary text-xs">
                    Editează
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs p-1.5 rounded"
                    style={{ color: "var(--text-tertiary)" }}
                    title="Șterge"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-lg my-8"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editing ? "Editare produs" : "Produs nou"}
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="SKU">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input w-full text-sm font-mono"
                    autoFocus
                  />
                </Field>
                <Field label="Barcode (opțional)">
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="input w-full text-sm font-mono"
                  />
                </Field>
              </div>

              <Field label="Nume">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })
                  }
                  className="input w-full text-sm"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Categorie">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="">Fără categorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Unitate măsură">
                  <input
                    type="text"
                    value={form.unitOfMeasure}
                    onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Preț cost">
                  <input
                    type="text"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="Preț vânzare">
                  <input
                    type="text"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="input w-full text-sm"
                  />
                </Field>
                <Field label="TVA %">
                  <select
                    value={form.vatRate}
                    onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="0.00">0%</option>
                    <option value="5.00">5%</option>
                    <option value="9.00">9%</option>
                    <option value="19.00">19%</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Stoc curent">
                  <input
                    type="text"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="input w-full text-sm"
                    disabled={!form.trackInventory}
                  />
                </Field>
                <Field label="Prag alertare">
                  <input
                    type="text"
                    value={form.reorderPoint}
                    onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                    className="input w-full text-sm"
                    disabled={!form.trackInventory}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input w-full text-sm"
                  >
                    <option value="active">Activ</option>
                    <option value="inactive">Inactiv</option>
                    <option value="archived">Arhivat</option>
                  </select>
                </Field>
              </div>

              <Field label="Descriere">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </Field>

              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.trackInventory}
                    onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
                  />
                  Urmărește stocul
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isPosEnabled}
                    onChange={(e) => setForm({ ...form, isPosEnabled: e.target.checked })}
                  />
                  Disponibil în POS
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={form.isOnlineEnabled}
                    onChange={(e) => setForm({ ...form, isOnlineEnabled: e.target.checked })}
                  />
                  Vandabil online
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={!form.sku.trim() || !form.name.trim()}
                className="btn-primary text-sm"
                style={{ opacity: !form.sku.trim() || !form.name.trim() ? 0.5 : 1 }}
              >
                {editing ? "Salvează" : "Creează"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCategoryCreate(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-sm"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Categorie nouă
            </h2>

            <div className="space-y-3">
              <Field label="Nume">
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) =>
                    setCatForm({ ...catForm, name: e.target.value, slug: catForm.slug || slugify(e.target.value) })
                  }
                  className="input w-full text-sm"
                  autoFocus
                />
              </Field>
              <Field label="Culoare">
                <input
                  type="color"
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                  className="input w-full"
                  style={{ height: 36 }}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCategoryCreate(false)} className="btn-secondary text-sm">
                Anulează
              </button>
              <button onClick={handleCategorySave} disabled={!catForm.name.trim()} className="btn-primary text-sm">
                Creează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1" style={{ color: "var(--text)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
