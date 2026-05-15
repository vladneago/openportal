"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Product {
  id: string;
  sku: string;
  name: string;
  sellingPrice: string;
  currency: string;
  vatRate: string;
  stockQuantity: string;
  trackInventory: boolean;
  status: string;
  imageUrl: string | null;
  categoryId: string | null;
  isPosEnabled: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CartLine {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: string;
  vatRate: string;
}

const TABS = [
  { href: "/pos", label: "Terminal" },
  { href: "/pos/products", label: "Produse" },
  { href: "/pos/reports", label: "Rapoarte" },
];

const PAYMENT_METHODS = [
  { v: "cash", label: "Cash" },
  { v: "card", label: "Card" },
  { v: "bank_transfer", label: "Transfer" },
  { v: "voucher", label: "Voucher" },
];

export default function PosTerminalPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      api(`/api/v1/pos/products?limit=200`),
      api(`/api/v1/pos/categories`),
    ]);
    if (prodRes.success) setProducts(prodRes.data || []);
    if (catRes.success) setCategories(catRes.data || []);
    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.isPosEnabled && p.status === "active");
    if (activeCategory) list = list.filter((p) => p.categoryId === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, activeCategory, search]);

  function addToCart(p: Product) {
    const existing = cart.find((l) => l.productId === p.id);
    if (existing) {
      setCart(cart.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l)));
    } else {
      setCart([
        ...cart,
        {
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          quantity: 1,
          unitPrice: p.sellingPrice,
          vatRate: p.vatRate,
        },
      ]);
    }
  }

  function updateQty(idx: number, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
    } else {
      const next = [...cart];
      next[idx] = { ...next[idx], quantity: qty };
      setCart(next);
    }
  }

  function clearCart() {
    setCart([]);
    setAmountTendered("");
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    let total = 0;
    for (const l of cart) {
      const sub = l.quantity * Number(l.unitPrice);
      const v = (sub * Number(l.vatRate)) / 100;
      subtotal += sub;
      vat += v;
      total += sub + v;
    }
    const change =
      paymentMethod === "cash" && amountTendered
        ? Math.max(0, Number(amountTendered) - total)
        : 0;
    return { subtotal, vat, total, change };
  }, [cart, paymentMethod, amountTendered]);

  async function checkout() {
    if (cart.length === 0 || processing) return;
    setProcessing(true);

    const res = await api(`/api/v1/pos/transactions`, {
      method: "POST",
      body: JSON.stringify({
        currency: "RON",
        paymentMethod,
        amountTendered: paymentMethod === "cash" && amountTendered ? amountTendered : undefined,
        completeOnCreate: true,
        lines: cart.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          productSku: l.productSku,
          quantity: String(l.quantity),
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
        })),
      }),
    });

    setProcessing(false);

    if (res.success) {
      clearCart();
      await load();
      const t = res.data;
      alert(
        `Bon emis: ${t?.receiptNumber}\nTotal: ${Number(t?.totalAmount || 0).toFixed(2)} RON${
          paymentMethod === "cash" && amountTendered
            ? `\nRest: ${Number(t?.changeGiven || 0).toFixed(2)} RON`
            : ""
        }`,
      );
    } else {
      alert(res.error?.message || "Eroare la finalizare bon");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            POS Terminal
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Vânzări la punctul de lucru cu scădere automată din stoc.
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
              color: tab.href === "/pos" ? "var(--text)" : "var(--text-tertiary)",
              background: tab.href === "/pos" ? "var(--bg-hover)" : "transparent",
              fontWeight: tab.href === "/pos" ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* PRODUCT GRID */}
        <div className="col-span-12 lg:col-span-7">
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută produs (nume / SKU / barcode)…"
              className="input w-full text-sm"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1 mb-3 overflow-x-auto">
              <button
                onClick={() => setActiveCategory("")}
                className="text-xs px-3 py-1.5 rounded-md whitespace-nowrap"
                style={{
                  background: !activeCategory ? "var(--bg-hover)" : "transparent",
                  color: !activeCategory ? "var(--text)" : "var(--text-tertiary)",
                  fontWeight: !activeCategory ? 500 : 400,
                }}
              >
                Toate
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className="text-xs px-3 py-1.5 rounded-md whitespace-nowrap"
                  style={{
                    background: activeCategory === c.id ? c.color + "22" : "transparent",
                    color: activeCategory === c.id ? c.color : "var(--text-tertiary)",
                    fontWeight: activeCategory === c.id ? 500 : 400,
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div
              className="rounded-lg p-8 text-center text-sm"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
            >
              Se încarcă…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              className="rounded-lg p-8 text-center text-sm"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
            >
              {products.length === 0 ? (
                <>
                  Niciun produs. <Link href="/pos/products" className="underline">Adaugă produse</Link> pentru a putea vinde.
                </>
              ) : (
                "Niciun produs nu se potrivește cu filtrele."
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredProducts.map((p) => {
                const stock = Number(p.stockQuantity);
                const outOfStock = p.trackInventory && stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !outOfStock && addToCart(p)}
                    disabled={outOfStock}
                    className="rounded-lg p-3 text-left transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      opacity: outOfStock ? 0.4 : 1,
                      cursor: outOfStock ? "not-allowed" : "pointer",
                    }}
                  >
                    <div className="text-[10px] mb-1 font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {p.sku}
                    </div>
                    <div className="text-sm font-medium line-clamp-2 mb-2" style={{ color: "var(--text)" }}>
                      {p.name}
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
                        {Number(p.sellingPrice).toFixed(2)}
                      </div>
                      {p.trackInventory && (
                        <div className="text-[10px]" style={{ color: stock <= 5 ? "#F59E0B" : "var(--text-tertiary)" }}>
                          stoc: {stock.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CART */}
        <div className="col-span-12 lg:col-span-5">
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Bon curent
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Golește
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Adaugă produse din grila din stânga.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {cart.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {line.productName}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {Number(line.unitPrice).toFixed(2)} × {line.quantity} = {(Number(line.unitPrice) * line.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(idx, line.quantity - 1)}
                        className="w-6 h-6 rounded text-sm"
                        style={{ background: "var(--bg-hover)", color: "var(--text)" }}
                      >
                        −
                      </button>
                      <span className="text-xs w-6 text-center" style={{ color: "var(--text)" }}>
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(idx, line.quantity + 1)}
                        className="w-6 h-6 rounded text-sm"
                        style={{ background: "var(--bg-hover)", color: "var(--text)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-tertiary)" }}>Subtotal</span>
                <span style={{ color: "var(--text)" }}>{totals.subtotal.toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-tertiary)" }}>TVA</span>
                <span style={{ color: "var(--text)" }}>{totals.vat.toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-1">
                <span style={{ color: "var(--text)" }}>Total</span>
                <span style={{ color: "#10B981" }}>{totals.total.toFixed(2)} RON</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>
                Metodă plată
              </div>
              <div className="grid grid-cols-4 gap-1">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setPaymentMethod(m.v)}
                    className="text-xs py-2 rounded transition-colors"
                    style={{
                      background: paymentMethod === m.v ? "var(--accent)" : "var(--bg-hover)",
                      color: paymentMethod === m.v ? "white" : "var(--text)",
                      fontWeight: paymentMethod === m.v ? 500 : 400,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && cart.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
                  Suma primită
                </label>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={totals.total.toFixed(2)}
                  step="0.01"
                  className="input w-full text-sm"
                />
                {amountTendered && Number(amountTendered) >= totals.total && (
                  <div className="text-xs mt-1" style={{ color: "#10B981" }}>
                    Rest: {totals.change.toFixed(2)} RON
                  </div>
                )}
              </div>
            )}

            <button
              onClick={checkout}
              disabled={cart.length === 0 || processing}
              className="btn-primary w-full text-base py-3"
              style={{ opacity: cart.length === 0 || processing ? 0.5 : 1 }}
            >
              {processing ? "Se procesează…" : `Finalizează (${totals.total.toFixed(2)} RON)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
