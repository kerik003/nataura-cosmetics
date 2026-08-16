import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/login должен быть доступен без авторизации — пропускаем проверку через children,
  // т.к. серверные layout не знают текущий путь напрямую в App Router без параллельных маршрутов.
  // Поэтому здесь мы редиректим только если явно нет пользователя И запрошен НЕ /admin/login —
  // практически это решается тем, что страница логина не использует этот layout,
  // если её вынести из группы (см. структуру ниже).

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminRow) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="border-b border-line bg-white">
        <div className="container-x flex h-14 items-center gap-6 text-sm font-medium">
          <Link href="/admin/products" className="text-ink hover:text-primary">
            Товари
          </Link>
          <Link href="/admin/orders" className="text-ink hover:text-primary">
            Замовлення
          </Link>
        </div>
      </div>
      <div className="container-x py-8">{children}</div>
    </div>
  );
}
