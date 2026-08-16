import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="mb-4 font-display text-3xl text-primary-dark">
        Дякуємо за замовлення!
      </h1>
      <p className="mb-8 text-ink/70">
        Номер вашого замовлення: <strong>{searchParams.order}</strong>
        <br />
        Наш менеджер зв'яжеться з вами найближчим часом для підтвердження.
      </p>
      <Link href="/" className="btn-primary">
        На головну
      </Link>
    </div>
  );
}
