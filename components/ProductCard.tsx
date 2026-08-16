import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const variants = product.product_variants ?? [];
  const anyInStock = variants.some((v) => v.in_stock && v.stock_qty > 0);
  const minPrice = variants.length
    ? Math.min(...variants.map((v) => v.price))
    : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-sand">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30">
            NATAURA
          </div>
        )}
        {product.is_hit && (
          <span className="absolute left-3 top-3 rounded-full bg-turquoise px-3 py-1 text-xs font-semibold text-white">
            Хіт продажів
          </span>
        )}
        {!anyInStock && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
            Немає в наявності
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-ink">
          {product.name}
        </h3>

        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs text-ink/50">
            {variants.map((v) => (
              <span
                key={v.id}
                className={v.in_stock ? "" : "line-through opacity-50"}
              >
                {v.volume_label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 font-display text-lg text-primary-dark">
          {minPrice !== null ? `від ${minPrice} ₴` : "Ціна за запитом"}
        </div>
      </div>
    </Link>
  );
}
