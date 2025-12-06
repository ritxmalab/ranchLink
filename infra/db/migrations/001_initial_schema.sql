-- RanchLink Database Schema
-- Supabase Postgres Migrations

-- Owners (no PII on-chain)
create table if not exists owners(
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  basename text unique, -- owner alias (e.g., "OakHillRanch")
  created_at timestamptz default now()
);

-- Animals + device/tag
create table if not exists animals(
  public_id text primary key,                 -- e.g., AUS0001
  tag_id text,                                 -- printed tag serial
  owner_id uuid references owners(id),
  species text,
  sex text,
  birth_year int,
  breed text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Events (vaccination, movement, weight, photo, doc)
create table if not exists events(
  id uuid primary key default gen_random_uuid(),
  public_id text references animals(public_id),
  type text,                                   -- vaccination|movement|weight|photo|doc
  payload_json jsonb,
  attestation_txhash text,                     -- EAS attestation hash
  created_by uuid references owners(id),
  created_at timestamptz default now()
);

-- On-chain anchors (IPFS CIDs anchored to Base)
create table if not exists anchors(
  id uuid primary key default gen_random_uuid(),
  public_id text references animals(public_id),
  cid text,                                    -- IPFS CID
  sha256 text,                                 -- data hash
  chain_txhash text,                           -- Base L2 transaction hash
  created_at timestamptz default now()
);

-- Ownership transfers
create table if not exists transfers(
  id uuid primary key default gen_random_uuid(),
  public_id text references animals(public_id),
  from_owner uuid references owners(id),
  to_owner uuid references owners(id),
  txhash text,
  created_at timestamptz default now()
);

-- Super-admin "factory" batches
create table if not exists batches(
  id uuid primary key default gen_random_uuid(),
  name text,
  model text,                                  -- PETG|GPS
  color text,
  count int,
  created_by uuid,
  status text default 'draft',                 -- draft|printed|shipped|active
  created_at timestamptz default now()
);

-- Devices (tags or GPS devices)
create table if not exists devices(
  id uuid primary key default gen_random_uuid(),
  tag_id text unique,                          -- printed tag serial
  batch_id uuid references batches(id),
  type text,                                   -- petg|gps
  serial text,
  public_id text,                              -- assigned after claim
  token_id text,                               -- NFT token ID
  claim_token text unique,                     -- one-time claim token
  claim_exp timestamptz,
  base_qr_url text,
  owner_id uuid references owners(id),
  current_wallet text,
  status text default 'printed',               -- printed|qa|shipped|claimed|active
  activated_at timestamptz
);

-- QA tests
create table if not exists qa_tests(
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id),
  overlay_scan_ok bool,
  base_scan_ok bool,
  nfc_ok bool,
  operator_id uuid,
  ts timestamptz default now()
);

-- Custody log (factory -> partner -> ranch)
create table if not exists custody_log(
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id),
  from_entity text,
  to_entity text,
  ts timestamptz default now(),
  doc text
);

-- Contract addresses
create table if not exists contracts(
  id uuid primary key default gen_random_uuid(),
  chain_id int,
  name text,
  address text,
  version text,
  owner_wallet text
);

-- Wallets (treasury, server, cold storage)
create table if not exists wallets(
  id uuid primary key default gen_random_uuid(),
  role text,                                   -- treasury|server|cold
  address text unique,
  label text,
  cold text,                                   -- cold storage location
  notes text
);

-- RWA IoT devices (GPS tags)
create table if not exists rwa_iot(
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id),
  imei text,
  iccid text,
  vendor text,
  fw text,
  webhook_secret text,
  last_seen timestamptz,
  last_fix jsonb,                              -- GPS coordinates
  cfg_json jsonb,
  ack_ts timestamptz
);

-- Indexes
create index if not exists idx_animals_owner on animals(owner_id);
create index if not exists idx_animals_tag on animals(tag_id);
create index if not exists idx_events_animal on events(public_id);
create index if not exists idx_devices_batch on devices(batch_id);
create index if not exists idx_devices_owner on devices(owner_id);
create index if not exists idx_devices_claim_token on devices(claim_token);


