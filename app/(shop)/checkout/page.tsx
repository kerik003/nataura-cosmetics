"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import NovaPoshtaPicker from "@/components/NovaPoshtaPicker";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/lib/types";

export default function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState<"cod" | "monopay">("cod");
  const [city, setCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouse, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!city || !warehouse) {
      setError("Оберіть місто та відділення Нової Пошти");
      return;
    }
    if (lines.length === 0) {
      setError("Кошик порожній");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, email },
          city,
          warehouse,
          comment,
          paymentMethod: payment,
          lines,
          total,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Помилка оформлення замовлення");

      if (payment === "monopay" && json.checkoutUrl) {
        clear();
        window.location.href = json.checkoutUrl; // редирект на оплату Monopay
        return;
      }

      clear();
      router.push(`/checkout/success?order=${json.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-6 font-display text-2xl text-ink">Оформлення замовлення</h1>

      <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-ink">Контактні дані</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Ім'я та прізвище *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-line px-3 py-2"
              />
              <input
                required
                placeholder="Телефон *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-line px-3 py-2"
              />
              <input
                placeholder="Email (необов'язково)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-line px-3 py-2 sm:col-span-2"
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-ink">Доставка — Нова Пошта</h2>
            <NovaPoshtaPicker
              onChange={({ city, warehouse }) => {
                setCity(city);
                setWarehouse(warehouse);
              }}
            />
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-ink">Оплата</h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                  className="accent-primary"
                />
                Оплата при отриманні (накладений платіж)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "monopay"}
                  onChange={() => setPayment("monopay")}
                  className="accent-primary"
                />
                Онлайн-оплата Monopay
              </label>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-ink">Коментар до замовлення</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder="Побажання щодо замовлення"
            />
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-ink">Ваше замовлення</h2>
          <ul className="mb-4 flex flex-col gap-2 text-sm">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between">
                <span className="text-ink/70">
                  {l.productName} ({l.volumeLabel}) × {l.qty}
                </span>
                <span className="font-medium">{l.price * l.qty} ₴</span>
              </li>
            ))}
          </ul>
          <div className="mb-4 flex justify-between border-t border-line pt-4 font-display text-xl text-primary-dark">
            <span>Разом</span>
            <span>{total} ₴</span>
          </div>

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Оформлення..." : "Підтвердити замовлення"}
          </button>
        </div>
      </form>
    </div>
  );
}
