-- Private link key for customer order page (?k=) — run if column missing from manual deploys
alter table if exists public.stripe_orders
  add column if not exists order_view_secret uuid;

update public.stripe_orders
  set order_view_secret = gen_random_uuid()
  where order_view_secret is null;

NOTIFY pgrst, 'reload schema';
