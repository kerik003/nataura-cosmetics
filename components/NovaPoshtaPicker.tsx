"use client";

import { useEffect, useRef, useState } from "react";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/lib/types";

export default function NovaPoshtaPicker({
  onChange,
}: {
  onChange: (v: {
    city: NovaPoshtaCity | null;
    warehouse: NovaPoshtaWarehouse | null;
  }) => void;
}) {
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<NovaPoshtaCity[]>([]);
  const [city, setCity] = useState<NovaPoshtaCity | null>(null);
  const [showCityList, setShowCityList] = useState(false);

  const [whQuery, setWhQuery] = useState("");
  const [whOptions, setWhOptions] = useState<NovaPoshtaWarehouse[]>([]);
  const [warehouse, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [showWhList, setShowWhList] = useState(false);

  const cityDebounce = useRef<ReturnType<typeof setTimeout>>();
  const whDebounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    onChange({ city, warehouse });
  }, [city, warehouse]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(cityDebounce.current);
    if (cityQuery.length < 2) {
      setCityOptions([]);
      return;
    }
    cityDebounce.current = setTimeout(async () => {
      const res = await fetch(
        `/api/novaposhta/cities?q=${encodeURIComponent(cityQuery)}`
      );
      const json = await res.json();
      setCityOptions(json.data ?? []);
    }, 300);
  }, [cityQuery]);

  useEffect(() => {
    clearTimeout(whDebounce.current);
    if (!city) return;
    whDebounce.current = setTimeout(async () => {
      const res = await fetch(
        `/api/novaposhta/warehouses?cityRef=${city.Ref}&q=${encodeURIComponent(
          whQuery
        )}`
      );
      const json = await res.json();
      setWhOptions(json.data ?? []);
    }, 300);
  }, [whQuery, city]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-ink">
          Місто *
        </label>
        <input
          value={city ? city.Description : cityQuery}
          onChange={(e) => {
            setCity(null);
            setWarehouse(null);
            setCityQuery(e.target.value);
            setShowCityList(true);
          }}
          onFocus={() => setShowCityList(true)}
          placeholder="Почніть вводити назву міста"
          className="w-full rounded-lg border border-line px-3 py-2 focus:border-primary focus:outline-none"
        />
        {showCityList && cityOptions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
            {cityOptions.map((c) => (
              <li
                key={c.Ref}
                onClick={() => {
                  setCity(c);
                  setCityQuery("");
                  setShowCityList(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/5"
              >
                {c.Description}
                {c.AreaDescription ? `, ${c.AreaDescription} обл.` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-ink">
          Відділення / поштомат *
        </label>
        <input
          value={warehouse ? warehouse.Description : whQuery}
          onChange={(e) => {
            setWarehouse(null);
            setWhQuery(e.target.value);
            setShowWhList(true);
          }}
          onFocus={() => setShowWhList(true)}
          disabled={!city}
          placeholder={
            city ? "Введіть номер або адресу відділення" : "Спочатку оберіть місто"
          }
          className="w-full rounded-lg border border-line px-3 py-2 focus:border-primary focus:outline-none disabled:bg-line/30"
        />
        {showWhList && whOptions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
            {whOptions.map((w) => (
              <li
                key={w.Ref}
                onClick={() => {
                  setWarehouse(w);
                  setWhQuery("");
                  setShowWhList(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/5"
              >
                {w.Description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
