"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product, ProductVariant } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const variants = (product.product_variants ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const firstAvailable = variants.find((v) => v.in_stock && v.stock_qty > 0);
  const [selected, setSelected] = useState<ProductVariant | undefined>(
    firstAvailable ?? variants[0]
  );
  const [added, setAdded] = useState(false);
  const { addLine } = useCart();

  function handleAdd() {
    if (!selected || !selected.in_stock || selected.stock_qty < 1) return;
    addLine({
      variantId: selected.id,
      productSlug: product.slug,
      productName: product.name,
      volumeLabel: selected.volume_label,
      price: selected.price,
      qty: 1,
      image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {variants.map((v) => {
          const disabled = !v.in_stock || v.stock_qty < 1;
          const isSelected = selected?.id === v.id;
          return (
            <button
              key={v.id}
              disabled={disabled}
              onClick={() => setSelected(v)}
              title={disabled ? "Немає в наявності" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition
                ${isSelected ? "border-primary bg-primary text-white" : "border-line bg-white text-ink"}
                ${disabled ? "cursor-not-allowed opacity-40 line-through" : "hover:border-primary"}
              `}
            >
              {v.volume_label}
            </button>
          );
        })}
      </div>

      <div className="mb-4 font-display text-3xl text-primary-dark">
        {selected ? `${selected.price} ₴` : "—"}
      </div>

      <button
        onClick={handleAdd}
        disabled={!selected || !selected.in_stock || selected.stock_qty < 1}
        className="btn-primary w-full sm:w-auto"
      >
        {!selected || !selected.in_stock || selected.stock_qty < 1
          ? "Немає в наявності"
          : added
          ? "Додано ✓"
          : "Додати в кошик"}
      </button>
    </div>
  );
}
