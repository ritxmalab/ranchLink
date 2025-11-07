-- Add columns for overlay QR and metadata storage
alter table devices add column if not exists overlay_qr_url text;
alter table devices add column if not exists metadata jsonb;
alter table devices add column if not exists created_at timestamptz default now();
