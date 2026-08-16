import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: hits } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .eq("is_hit", true)
    .limit(8);

  return (
    <div>
      <section className="border-b border-line bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-x flex flex-col items-start gap-4 py-16 md:py-24">
          <span className="rounded-full bg-turquoise/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
            Професійний догляд
          </span>
          <h1 className="max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
            Натуральна краса, підтверджена наукою
          </h1>
          <p className="max-w-xl text-ink/70">
            NATAURA.COSMETICS — професійна косметика для обличчя, тіла та волосся
            з доставкою по всій Україні.
          </p>
          <Link href="/catalog/kosmetika-dlya-oblychchya" className="btn-primary mt-2">
            Перейти до каталогу
          </Link>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="mb-6 font-display text-2xl text-ink">Хіти продажів</h2>
        {hits && hits.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(hits as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-ink/50">
            Товарів поки немає — додайте перші товари в адмін-панелі (/admin).
          </p>
        )}
      </section>
    </div>
  );
}
