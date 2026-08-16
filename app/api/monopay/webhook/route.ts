import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Monobank Acquiring шлёт сюда статус оплаты после того, как клиент оплатил инвойс.
// Документация: https://monobank.ua/api-docs/acquiring/metody/webhook
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { invoiceId, status, reference } = body;

  if (status !== "success") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();
  await supabase
    .from("orders")
    .update({ payment_status: "paid", monopay_invoice_id: invoiceId })
    .eq("order_number", reference);

  return NextResponse.json({ ok: true });
}
