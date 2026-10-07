-- ==============================================================================
-- SettleX Core Migration
-- Adds wallet-address-keyed profiles, SIWE sessions, on-chain tx index, and tasks
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- Helper: auto-update updated_at (safe to re-declare)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================================================
-- 1. PROFILES
-- Primary identity key: lowercase EVM wallet address (0x + 40 hex chars)
-- ==============================================================================
create table if not exists profiles (
  wallet_address  text primary key
                  check (wallet_address ~* '^0x[a-fA-F0-9]{40}$'),
  username        text unique
                  check (char_length(username) between 2 and 32),
  avatar_url      text,
  bio             text check (char_length(bio) <= 280),
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();

-- ==============================================================================
-- 2. SIWE SESSIONS
-- Nonce challenge + verified session JWT. One active session per wallet.
-- ==============================================================================
create table if not exists siwe_nonces (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text not null
                  check (wallet_address ~* '^0x[a-fA-F0-9]{40}$'),
  nonce           text not null unique,
  issued_at       timestamptz default now() not null,
  expires_at      timestamptz not null,
  used            boolean default false not null
);

-- Expire index: nonces older than 10 min are invalid
create index idx_siwe_nonces_wallet on siwe_nonces(wallet_address);
create index idx_siwe_nonces_expires on siwe_nonces(expires_at);

create table if not exists siwe_sessions (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text not null
                  check (wallet_address ~* '^0x[a-fA-F0-9]{40}$'),
  session_token   text not null unique,
  created_at      timestamptz default now() not null,
  expires_at      timestamptz not null,
  revoked         boolean default false not null
);

create index idx_siwe_sessions_wallet on siwe_sessions(wallet_address);
create index idx_siwe_sessions_token  on siwe_sessions(session_token);

-- ==============================================================================
-- 3. ON-CHAIN TRANSACTION INDEX
-- Indexed from Arc Mainnet events, enriched with contact names / notes.
-- tx_hash + chain_id is the natural unique key.
-- ==============================================================================
create table if not exists onchain_transactions (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text not null
                  check (wallet_address ~* '^0x[a-fA-F0-9]{40}$'),
  tx_hash         text not null,
  chain_id        integer not null default 5042,
  tx_type         text not null
                  check (tx_type in ('send', 'receive', 'swap', 'bridge', 'checkin', 'other')),
  amount          numeric,
  token_symbol    text,
  from_address    text,
  to_address      text,
  block_number    bigint,
  block_timestamp timestamptz,
  status          text default 'success'
                  check (status in ('pending', 'success', 'failed')),
  -- enrichment (off-chain metadata)
  contact_name    text,
  note            text,
  metadata        jsonb default '{}',
  created_at      timestamptz default now() not null,

  constraint unique_tx_per_chain unique (tx_hash, chain_id)
);

create index idx_onchain_tx_wallet    on onchain_transactions(wallet_address);
create index idx_onchain_tx_type      on onchain_transactions(wallet_address, tx_type);
create index idx_onchain_tx_timestamp on onchain_transactions(block_timestamp desc);

-- ==============================================================================
-- 4. TASKS
-- Definitions are managed server-side (service role only). Users cannot edit.
-- ==============================================================================
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,          -- e.g. 'SWAP_001'
  title       text not null,
  description text,
  points      integer not null check (points > 0),
  icon        text,                           -- lucide icon name
  status      text default 'coming_soon'
              check (status in ('live', 'coming_soon', 'archived')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create trigger trg_tasks_updated_at
before update on tasks
for each row execute function update_updated_at_column();

-- Seed initial tasks
insert into tasks (slug, title, description, points, icon, status) values
  ('SWAP_001',   'Make a Swap',        'Swap any token on SettleX DEX',                5,  'ArrowLeftRight', 'coming_soon'),
  ('BRIDGE_001', 'Bridge USDC',        'Bridge USDC to or from another chain',          5,  'Shuffle',        'coming_soon'),
  ('SEND_001',   'Send USDC',          'Send USDC to a contact',                        3,  'Send',           'coming_soon'),
  ('RECEIVE_001','Receive USDC',       'Receive USDC from any address',                 3,  'Download',       'coming_soon'),
  ('PROFILE_001','Complete Profile',   'Set a username and profile picture',            10, 'User',           'coming_soon'),
  ('REFER_001',  'Refer a Friend',     'Invite a friend who connects their wallet',     20, 'Users',          'coming_soon')
on conflict (slug) do nothing;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY
-- ==============================================================================

alter table profiles             enable row level security;
alter table siwe_nonces          enable row level security;
alter table siwe_sessions        enable row level security;
alter table onchain_transactions enable row level security;
alter table tasks                enable row level security;

-- profiles: public read (usernames/avatars visible), self-write only
create policy "profiles_select_all" on profiles
  for select using (true);

create policy "profiles_insert_own" on profiles
  for insert with check (true);  -- enforced at API layer via session token

create policy "profiles_update_own" on profiles
  for update using (true);  -- enforced at API layer via session token

-- siwe_nonces: service role only (API routes use service client)
create policy "siwe_nonces_service_only" on siwe_nonces
  for all using (false);  -- no direct client access; API uses service role key

-- siwe_sessions: service role only
create policy "siwe_sessions_service_only" on siwe_sessions
  for all using (false);

-- onchain_transactions: users read their own; service role writes
create policy "onchain_tx_select_own" on onchain_transactions
  for select using (true);  -- all readable (public tx data); filtered in API

create policy "onchain_tx_insert_service" on onchain_transactions
  for insert with check (false);  -- service role only via API

-- tasks: public read only; no direct writes
create policy "tasks_select_all" on tasks
  for select using (true);

create policy "tasks_no_direct_write" on tasks
  for insert with check (false);
