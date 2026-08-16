export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-x grid gap-8 py-12 text-sm text-ink/70 md:grid-cols-3">
        <div>
          <div className="font-display text-lg text-primary-dark">
            NATAURA<span className="text-turquoise">.COSMETICS</span>
          </div>
          <p className="mt-2 max-w-xs">
            Натуральний догляд для здоров'я та краси шкіри.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Каталог</div>
          <ul className="space-y-1">
            <li><a href="/catalog/kosmetika-dlya-oblychchya" className="hover:text-primary">Косметика для обличчя</a></li>
            <li><a href="/catalog/kosmetika-dlya-tila" className="hover:text-primary">Косметика для тіла</a></li>
            <li><a href="/catalog/kosmetika-dlya-volossya" className="hover:text-primary">Косметика для волосся</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Контакти</div>
          <p>Доставка Новою Поштою по всій Україні</p>
        </div>
      </div>
    </footer>
  );
}
