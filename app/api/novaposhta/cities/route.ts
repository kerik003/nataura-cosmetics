import { NextRequest, NextResponse } from "next/server";

// Nova Poshta API: пошук міста за введеним текстом
// Документація: https://developers.novaposhta.ua/documentation
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ data: [] });

  const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      modelName: "Address",
      calledMethod: "searchSettlements",
      methodProperties: {
        CityName: q,
        Limit: 10,
        Page: 1,
      },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  const items = json?.data?.[0]?.Addresses ?? [];

  const cities = items.map((a: any) => ({
    Ref: a.DeliveryCity ?? a.Ref,
    Description: a.MainDescription ?? a.Present,
    AreaDescription: a.Area,
  }));

  return NextResponse.json({ data: cities });
}
