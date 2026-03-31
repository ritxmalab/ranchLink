-- Prevent duplicate customer confirmation + internal ops emails on Stripe webhook retries
alter table if exists public.stripe_orders
  add column if not exists order_confirmation_sent_at timestamptz,
  add column if not exists internal_ops_notified_at timestamptz;

NOTIFY pgrst, 'reload schema';
