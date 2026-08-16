"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type VariantDraft = {
  volume_label: string;
  price: string;
  stock_qty: string;
  in_stock: boolean;
};

function slugify(text: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("Україна");
  const [isHit, setIsHit] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([
    { volume_label: "", price: "", stock_qty: "0", in_stock: false },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function updateVariant(i: number, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const slug = slugify(name) + "-" + Date.now().toString().slice(-5);

      // 1. Загружаем фото в Storage (bucket "products" должен быть создан заранее, публичный)
      const imageUrls: string[] = [];
      for (const file of files) {
        const path = `${slug}/${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("products")
          .upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }

      // 2. Создаём товар
      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          slug,
          name,
          description,
          country,
          is_hit: isHit,
          images: imageUrls,
          is_active: true,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // 3. Создаём варианты
      const rows = variants
        .filter((v) => v.volume_label && v.price)
        .map((v, i) => ({
          product_id: product.id,
          volume_label: v.volume_label,
          price: Number(v.price),
          stock_qty: Number(v.stock_qty),
          in_stock: v.in_stock,
          sort_order: i,
        }));
      if (rows.length > 0) {
        const { error: vErr } = await supabase.from("product_variants").insert(rows);
        if (vErr) throw vErr;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-ink">Новий товар</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Назва *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Опис</label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Країна виробництва</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
          <label className="mt-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isHit}
              onChange={(e) => setIsHit(e.target.checked)}
              className="accent-primary"
            />
            Хіт продажів
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Фото товару</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Об'єми та наявність
          </label>
          <div className="flex flex-col gap-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="200 мл"
                  value={v.volume_label}
                  onChange={(e) =>
                    updateVariant(i, { volume_label: e.target.value })
                  }
                  className="w-28 rounded-lg border border-line px-2 py-1.5"
                />
                <input
                  placeholder="Ціна"
                  type="number"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: e.target.value })}
                  className="w-24 rounded-lg border border-line px-2 py-1.5"
                />
                <input
                  placeholder="К-сть"
                  type="number"
                  value={v.stock_qty}
                  onChange={(e) =>
                    updateVariant(i, { stock_qty: e.target.value })
                  }
                  className="w-20 rounded-lg border border-line px-2 py-1.5"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={v.in_stock}
                    onChange={(e) =>
                      updateVariant(i, { in_stock: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  В наявності
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { volume_label: "", price: "", stock_qty: "0", in_stock: false },
                ])
              }
              className="btn-outline w-fit text-xs"
            >
              + Додати об'єм
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button disabled={loading} className="btn-primary w-fit">
          {loading ? "Збереження..." : "Зберегти товар"}
        </button>
      </form>
    </div>
  );
}
