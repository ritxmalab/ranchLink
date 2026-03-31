-- Internal fulfillment CRM fields on commercial orders (Superadmin Orders tab)
alter table if exists public.stripe_orders
  add column if not exists internal_notes text,
  add column if not exists assigned_to text;

NOTIFY pgrst, 'reload schema';
