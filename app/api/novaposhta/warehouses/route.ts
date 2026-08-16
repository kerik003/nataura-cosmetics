import { NextRequest, NextResponse } from "next/server";

// Пошук відділень/поштоматів у вибраному місті.
// FindByString дозволяє шукати як за номером, так і за адресою відділення.
export async function GET(req: NextRequest) {
  const cityRef = req.nextUrl.searchParams.get("cityRef");
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!cityRef) {
    return NextResponse.json({ error: "cityRef is required" }, { status: 400 });
  }

  const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,
        FindByString: q || undefined,
        Limit: 30,
        Page: 1,
      },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  const items = json?.data ?? [];

  const warehouses = items.map((w: any) => ({
    Ref: w.Ref,
    Description: w.Description,
    Number: w.Number,
    CityRef: w.CityRef,
  }));

  return NextResponse.json({ data: warehouses });
}
