import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer, city, warehouse, comment, paymentMethod, lines, total } = body;

  if (!customer?.name || !customer?.phone) {
    return NextResponse.json({ error: "Вкажіть ім'я та телефон" }, { status: 400 });
  }
  if (!city || !warehouse) {
    return NextResponse.json({ error: "Оберіть місто та відділення" }, { status: 400 });
  }
  if (!lines || lines.length === 0) {
    return NextResponse.json({ error: "Кошик порожній" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1. Проверяем актуальное наличие каждого варианта перед созданием заказа
  const variantIds = lines.map((l: any) => l.variantId);
  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select("id, price, stock_qty, in_stock, volume_label")
    .in("id", variantIds);

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

  for (const line of lines) {
    const v = variants?.find((x) => x.id === line.variantId);
    if (!v || !v.in_stock || v.stock_qty < line.qty) {
      return NextResponse.json(
        {
          error: `На жаль, "${line.productName} (${line.volumeLabel})" вже немає в потрібній кількості. Оновіть кошик.`,
        },
        { status: 409 }
      );
    }
  }

  // 2. Генерируем номер заказа
  const orderNumber = `NC-${Date.now().toString().slice(-8)}`;

  // 3. Создаём заказ
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      np_city_ref: city.Ref,
      np_city_name: city.Description,
      np_warehouse_ref: warehouse.Ref,
      np_warehouse_name: warehouse.Description,
      comment: comment || null,
      payment_method: paymentMethod,
      status: "new",
      total,
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message ?? "Не вдалося створити замовлення" },
      { status: 500 }
    );
  }

  // 4. Создаём позиции заказа + списываем остаток
  for (const line of lines) {
    await supabase.from("order_items").insert({
      order_id: order.id,
      variant_id: line.variantId,
      product_name: line.productName,
      volume_label: line.volumeLabel,
      qty: line.qty,
      price: line.price,
    });

    const v = variants!.find((x) => x.id === line.variantId)!;
    const newQty = v.stock_qty - line.qty;
    await supabase
      .from("product_variants")
      .update({ stock_qty: newQty, in_stock: newQty > 0 })
      .eq("id", line.variantId);
  }

  // 5. Уведомление в Telegram (не блокирует ответ клиенту при ошибке)
  try {
    await sendTelegramNotification(order, lines, city, warehouse, paymentMethod);
  } catch (e) {
    console.error("Telegram notify failed", e);
  }

  // 6. Онлайн-оплата Monopay — создаём инвойс и возвращаем ссылку на оплату
  if (paymentMethod === "monopay") {
    try {
      const checkoutUrl = await createMonopayInvoice(order.id, orderNumber, total);
      return NextResponse.json({ orderNumber, checkoutUrl });
    } catch (e: any) {
      console.error("Monopay invoice failed", e);
      // заказ уже создан — сообщаем клиенту, что можно оплатить позже / уточнить
      return NextResponse.json({
        orderNumber,
        checkoutUrl: null,
        warning: "Замовлення створено, але онлайн-оплату наразі недоступно. Ми зв'яжемось з вами.",
      });
    }
  }

  return NextResponse.json({ orderNumber });
}

async function sendTelegramNotification(
  order: any,
  lines: any[],
  city: any,
  warehouse: any,
  paymentMethod: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const itemsText = lines
    .map((l: any) => `• ${l.productName} (${l.volumeLabel}) × ${l.qty} — ${l.price * l.qty} ₴`)
    .join("\n");

  const text = [
    `🛍 Нове замовлення ${order.order_number}`,
    ``,
    `👤 ${order.customer_name}`,
    `📞 ${order.customer_phone}`,
    `📍 ${city.Description} → ${warehouse.Description}`,
    `💳 ${paymentMethod === "monopay" ? "Онлайн-оплата Monopay" : "Накладений платіж"}`,
    order.comment ? `💬 ${order.comment}` : "",
    ``,
    itemsText,
    ``,
    `Разом: ${order.total} ₴`,
  ]
    .filter(Boolean)
    .join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function createMonopayInvoice(
  orderId: string,
  orderNumber: string,
  total: number
): Promise<string> {
  const token = process.env.MONOPAY_TOKEN;
  if (!token) throw new Error("MONOPAY_TOKEN не налаштований");

  const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
    },
    body: JSON.stringify({
      amount: Math.round(total * 100), // копійки
      ccy: 980, // UAH
      merchantPaymInfo: {
        reference: orderNumber,
        destination: `Оплата замовлення ${orderNumber}`,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order=${orderNumber}`,
      webHookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/monopay/webhook`,
    }),
  });

  if (!res.ok) throw new Error(`Monopay API error: ${res.status}`);
  const json = await res.json();
  return json.pageUrl;
}
