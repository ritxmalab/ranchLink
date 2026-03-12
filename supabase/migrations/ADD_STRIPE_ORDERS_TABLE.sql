create table if not exists public.stripe_orders (
  id bigint generated always as identity primary key,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  tier text,
  amount_total bigint,
  currency text,
  payment_status text not null default 'unpaid',
  status text not null default 'created',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_orders_status_idx
  on public.stripe_orders (status, payment_status, created_at desc);
