"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-wide text-primary-dark">
          NATAURA<span className="text-turquoise">.COSMETICS</span>
        </Link>

        <nav className="hidden gap-6 text-sm font-medium text-ink/80 md:flex">
          <Link href="/catalog/kosmetika-dlya-oblychchya" className="hover:text-primary">
            Для обличчя
          </Link>
          <Link href="/catalog/kosmetika-dlya-tila" className="hover:text-primary">
            Для тіла
          </Link>
          <Link href="/catalog/kosmetika-dlya-volossya" className="hover:text-primary">
            Для волосся
          </Link>
        </nav>

        <Link
          href="/cart"
          className="relative inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary-dark hover:border-primary/40"
        >
          Кошик
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-turquoise text-xs text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
