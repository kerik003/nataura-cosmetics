"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { lines, removeLine, setQty, total } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="mb-4 font-display text-2xl text-ink">Кошик порожній</h1>
        <Link href="/" className="btn-primary">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-6 font-display text-2xl text-ink">Кошик</h1>

      <div className="flex flex-col gap-4">
        {lines.map((line) => (
          <div
            key={line.variantId}
            className="card flex items-center gap-4 p-4"
          >
            <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-sand" />
            <div className="flex-1">
              <div className="font-medium text-ink">{line.productName}</div>
              <div className="text-sm text-ink/50">{line.volumeLabel}</div>
            </div>
            <input
              type="number"
              min={1}
              value={line.qty}
              onChange={(e) =>
                setQty(line.variantId, Math.max(1, Number(e.target.value)))
              }
              className="w-16 rounded-lg border border-line px-2 py-1 text-center"
            />
            <div className="w-24 text-right font-semibold text-primary-dark">
              {line.price * line.qty} ₴
            </div>
            <button
              onClick={() => removeLine(line.variantId)}
              className="text-sm text-ink/40 hover:text-red-500"
            >
              Видалити
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4">
        <div className="font-display text-2xl text-ink">
          Разом: <span className="text-primary-dark">{total} ₴</span>
        </div>
        <Link href="/checkout" className="btn-primary">
          Оформити замовлення
        </Link>
      </div>
    </div>
  );
}
