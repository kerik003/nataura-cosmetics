import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddToCart from "@/components/AddToCart";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();
  const p = product as Product;

  return (
    <div className="container-x grid gap-10 py-10 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-xl2 bg-sand">
        {p.images?.[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            width={800}
            height={800}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30">
            NATAURA
          </div>
        )}
      </div>

      <div>
        <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">
          {p.name}
        </h1>

        <AddToCart product={p} />

        {p.description && (
          <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-ink/70">
            {p.description}
          </div>
        )}
      </div>
    </div>
  );
}
