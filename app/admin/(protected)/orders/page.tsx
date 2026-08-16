"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  packed: "Зібрано",
  shipped: "Відправлено",
  done: "Виконано",
  cancelled: "Скасовано",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Замовлення</h1>
      {loading ? (
        <p className="text-ink/50">Завантаження...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-ink">{o.order_number}</span>
                  <span className="ml-3 text-sm text-ink/50">
                    {new Date(o.created_at).toLocaleString("uk-UA")}
                  </span>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="rounded-lg border border-line px-2 py-1 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-ink/70">
                {o.customer_name} · {o.customer_phone}
              </div>
              <div className="text-sm text-ink/70">
                {o.np_city_name} → {o.np_warehouse_name}
              </div>
              <div className="mt-2 text-sm">
                {o.order_items.map((it: any) => (
                  <div key={it.id}>
                    {it.product_name} ({it.volume_label}) × {it.qty} — {it.price * it.qty} ₴
                  </div>
                ))}
              </div>
              <div className="mt-2 font-semibold text-primary-dark">
                Разом: {o.total} ₴ ·{" "}
                {o.payment_method === "monopay" ? "Monopay" : "Накладений платіж"} ·{" "}
                {o.payment_status === "paid" ? "Оплачено" : "Очікує оплати"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
