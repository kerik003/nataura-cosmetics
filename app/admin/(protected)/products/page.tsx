"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStock(variantId: string, current: boolean) {
    await supabase
      .from("product_variants")
      .update({ in_stock: !current })
      .eq("id", variantId);
    load();
  }

  async function updateQty(variantId: string, qty: number) {
    await supabase
      .from("product_variants")
      .update({ stock_qty: qty, in_stock: qty > 0 })
      .eq("id", variantId);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Товари</h1>
        <Link href="/admin/products/new" className="btn-primary">
          + Додати товар
        </Link>
      </div>

      {loading ? (
        <p className="text-ink/50">Завантаження...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium text-ink">{p.name}</span>
                <span className="text-xs text-ink/40">/{p.slug}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(p.product_variants ?? []).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{v.volume_label}</span>
                    <span className="text-ink/50">{v.price} ₴</span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={v.stock_qty}
                      onBlur={(e) => updateQty(v.id, Number(e.target.value))}
                      className="w-16 rounded border border-line px-1 py-0.5 text-center"
                      title="Кількість на складі"
                    />
                    <button
                      onClick={() => toggleStock(v.id, v.in_stock)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        v.in_stock
                          ? "bg-primary/10 text-primary-dark"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {v.in_stock ? "В наявності" : "Немає"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
