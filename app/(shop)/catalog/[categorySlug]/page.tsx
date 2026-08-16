import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { categorySlug: string };
  searchParams: { skin?: string; sort?: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.categorySlug)
    .single();

  // Собираем id этой категории и всех дочерних (плоский каталог по подкатегории)
  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", category?.id ?? "");

  const categoryIds = [category?.id, ...(children?.map((c) => c.id) ?? [])].filter(
    Boolean
  );

  let query = supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .in("category_id", categoryIds.length ? categoryIds : ["-"]);

  if (searchParams.sort === "price_asc") {
    // сортировка по мин. цене делается на клиенте ниже, т.к. цена лежит в variants
  }

  const { data: products } = await query;

  const { data: skinTypeGroup } = await supabase
    .from("attribute_groups")
    .select("id")
    .eq("key", "skin_type")
    .single();

  const { data: skinValues } = await supabase
    .from("attribute_values")
    .select("*")
    .eq("group_id", skinTypeGroup?.id ?? "");

  let list = (products as Product[]) ?? [];
  if (searchParams.sort === "price_asc") {
    list = [...list].sort(
      (a, b) =>
        Math.min(...(a.product_variants?.map((v) => v.price) ?? [Infinity])) -
        Math.min(...(b.product_variants?.map((v) => v.price) ?? [Infinity]))
    );
  } else if (searchParams.sort === "price_desc") {
    list = [...list].sort(
      (a, b) =>
        Math.min(...(b.product_variants?.map((v) => v.price) ?? [0])) -
        Math.min(...(a.product_variants?.map((v) => v.price) ?? [0]))
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-6 font-display text-3xl text-ink">
        {category?.name ?? "Каталог"}
      </h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="card h-fit p-4">
          <div className="mb-4">
            <div className="mb-2 text-sm font-semibold text-ink">Сортування</div>
            <div className="flex flex-col gap-1 text-sm">
              <a href="?sort=price_asc" className="text-primary hover:underline">
                Від дешевих до дорогих
              </a>
              <a href="?sort=price_desc" className="text-primary hover:underline">
                Від дорогих до дешевих
              </a>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-ink">Тип шкіри</div>
            <div className="flex flex-col gap-1 text-sm text-ink/70">
              {skinValues?.map((v) => (
                <label key={v.id} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-primary" />
                  {v.value_uk}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/40">
              (Фільтрація за атрибутами підключається після наповнення каталогу товарами)
            </p>
          </div>
        </aside>

        <div>
          {list.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-ink/50">У цій категорії поки немає товарів.</p>
          )}
        </div>
      </div>
    </div>
  );
}
