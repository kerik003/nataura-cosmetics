export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  volume_label: string;
  volume_ml: number | null;
  price: number;
  old_price: number | null;
  sku: string | null;
  stock_qty: number;
  in_stock: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  is_hit: boolean;
  country: string | null;
  product_variants?: ProductVariant[];
};

export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  volumeLabel: string;
  price: number;
  qty: number;
  image?: string;
};

export type NovaPoshtaCity = {
  Ref: string;
  Description: string;
  AreaDescription?: string;
};

export type NovaPoshtaWarehouse = {
  Ref: string;
  Description: string;
  Number: string;
  CityRef: string;
};
