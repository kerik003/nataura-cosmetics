-- =========================================================
-- NATAURA.COSMETICS — схема базы данных
-- Выполнить в Supabase SQL Editor одним запуском
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- КАТЕГОРИИ (дерево, как у cosmeticus.com.ua) ----------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- БРЕНДЫ ----------
create table brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique
);

-- ---------- ТОВАРЫ ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  images text[] default '{}',           -- пути в Supabase Storage
  is_active boolean default true,
  is_hit boolean default false,          -- "Хіт продажів"
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- ФИЛЬТРЫ / АТРИБУТЫ (тип шкіри, призначення, інгредієнти...) ----------
create table attribute_groups (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,      -- 'skin_type' | 'purpose' | 'ingredient' | 'age' | 'spf' | 'product_type' | 'series'
  label_uk text not null
);

create table attribute_values (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references attribute_groups(id) on delete cascade,
  value_uk text not null,
  slug text not null,
  unique (group_id, slug)
);

create table product_attributes (
  product_id uuid references products(id) on delete cascade,
  attribute_value_id uuid references attribute_values(id) on delete cascade,
  primary key (product_id, attribute_value_id)
);

-- ---------- ВАРИАНТЫ (объём/мл + цена + наличие) ----------
-- Ключевая таблица: тут регулируется "200мл есть, 300мл нет".
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  volume_label text not null,         -- '200 мл', '30 мл', '25 грам' и т.п. (свободный текст, как на сайте-примере)
  volume_ml numeric,                  -- числовое значение для сортировки/фильтра, может быть null для 'грам'/'шт'
  price numeric(10,2) not null,
  old_price numeric(10,2),
  sku text,
  stock_qty int not null default 0,
  in_stock boolean not null default false,  -- админ явно включает/выключает наличие
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- ЗАКАЗЫ ----------
create type order_status as enum ('new','confirmed','packed','shipped','done','cancelled');
create type payment_method as enum ('cod','monopay');
create type payment_status as enum ('pending','paid','failed');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,     -- человекочитаемый номер, напр. NC-10001
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  np_city_ref text not null,             -- Ref города из Nova Poshta API
  np_city_name text not null,
  np_warehouse_ref text not null,        -- Ref отделения/почтомата
  np_warehouse_name text not null,
  comment text,
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  monopay_invoice_id text,
  status order_status not null default 'new',
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  variant_id uuid references product_variants(id),
  product_name text not null,       -- снимок названия на момент заказа
  volume_label text not null,
  qty int not null check (qty > 0),
  price numeric(10,2) not null      -- снимок цены на момент заказа
);

-- ---------- АДМИНЫ ----------
-- Роль admin выдаётся вручную через Supabase Auth -> user_metadata.role = 'admin'
-- либо через отдельную таблицу admin_users, если админов несколько:
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text
);

-- =========================================================
-- ИНДЕКСЫ
-- =========================================================
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_variants_product on product_variants(product_id);
create index idx_variants_in_stock on product_variants(in_stock);
create index idx_orders_status on orders(status);
create index idx_product_attrs_product on product_attributes(product_id);
create index idx_product_attrs_value on product_attributes(attribute_value_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table products enable row level security;
alter table product_variants enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table attribute_groups enable row level security;
alter table attribute_values enable row level security;
alter table product_attributes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table admin_users enable row level security;

-- Публичное чтение каталога (клиентам сайта)
create policy "public read products" on products for select using (is_active = true);
create policy "public read variants" on product_variants for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read brands" on brands for select using (true);
create policy "public read attr groups" on attribute_groups for select using (true);
create policy "public read attr values" on attribute_values for select using (true);
create policy "public read product attrs" on product_attributes for select using (true);

-- Заказы: гость может ТОЛЬКО создать заказ (insert), не читать чужие
create policy "public insert orders" on orders for insert with check (true);
create policy "public insert order items" on order_items for insert with check (true);

-- Админы: полный доступ ко всему (проверка через admin_users)
create policy "admin full access products" on products for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "admin full access variants" on product_variants for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "admin full access orders" on orders for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "admin full access order items" on order_items for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "admin full access categories" on categories for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- =========================================================
-- НАЧАЛЬНЫЕ КАТЕГОРИИ (структура повторяет cosmeticus.com.ua, без текстов/фото)
-- =========================================================
insert into categories (name, slug, sort_order) values
  ('Косметика для обличчя', 'kosmetika-dlya-oblychchya', 1),
  ('Косметика для тіла', 'kosmetika-dlya-tila', 2),
  ('Косметика для волосся', 'kosmetika-dlya-volossya', 3),
  ('Косметичні аксесуари', 'aksesuary', 4);

insert into categories (name, slug, parent_id, sort_order)
select 'Очищувальні засоби для обличчя', 'ochyshchuvalni-zasoby-dlya-oblychchya', id, 1 from categories where slug = 'kosmetika-dlya-oblychchya'
union all
select 'Креми для обличчя', 'kremy-dlya-oblychchya', id, 2 from categories where slug = 'kosmetika-dlya-oblychchya'
union all
select 'Маски для обличчя', 'masky-dlya-oblychchya', id, 3 from categories where slug = 'kosmetika-dlya-oblychchya'
union all
select 'Сироватки для обличчя', 'syrovatky-dlya-oblychchya', id, 4 from categories where slug = 'kosmetika-dlya-oblychchya';

insert into categories (name, slug, parent_id, sort_order)
select 'Креми для тіла', 'kremy-dlya-tila', id, 1 from categories where slug = 'kosmetika-dlya-tila'
union all
select 'Скраби для тіла', 'skraby-dlya-tila', id, 2 from categories where slug = 'kosmetika-dlya-tila'
union all
select 'Креми для рук', 'kremy-dlya-ruk', id, 3 from categories where slug = 'kosmetika-dlya-tila';

insert into categories (name, slug, parent_id, sort_order)
select 'Шампуні', 'shampuni', id, 1 from categories where slug = 'kosmetika-dlya-volossya'
union all
select 'Маски для волосся', 'masky-dlya-volossya', id, 2 from categories where slug = 'kosmetika-dlya-volossya';

-- =========================================================
-- НАЧАЛЬНЫЕ ГРУППЫ ФИЛЬТРОВ (как на сайте-примере)
-- =========================================================
insert into attribute_groups (key, label_uk) values
  ('product_type', 'Тип продукту'),
  ('purpose', 'Призначення'),
  ('skin_type', 'Тип шкіри'),
  ('age', 'Вік'),
  ('spf', 'Ступінь захисту'),
  ('ingredient', 'Інгредієнти у складі'),
  ('series', 'Серія');

-- Пример значений типа шкіри — остальные группы наполняются из админки по мере добавления товаров
insert into attribute_values (group_id, value_uk, slug)
select id, v.label, v.slug from attribute_groups, (values
  ('Нормальна','normalna'), ('Суха','suha'), ('Комбінована','kombinovana'),
  ('Жирна','zhyrna'), ('Чутлива','chutlyva'), ('Проблемна','problemna')
) as v(label, slug)
where attribute_groups.key = 'skin_type';
