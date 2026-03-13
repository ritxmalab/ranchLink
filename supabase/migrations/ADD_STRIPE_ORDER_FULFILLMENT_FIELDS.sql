alter table if exists public.stripe_orders
  add column if not exists order_number text unique,
  add column if not exists tag_count integer not null default 0,
  add column if not exists fulfillment_status text not null default 'pending_payment',
  add column if not exists shipping_name text,
  add column if not exists shipping_phone text,
  add column if not exists shipping_address_json jsonb,
  add column if not exists carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create index if not exists stripe_orders_order_number_idx
  on public.stripe_orders (order_number);

create index if not exists stripe_orders_fulfillment_status_idx
  on public.stripe_orders (fulfillment_status, created_at desc);
