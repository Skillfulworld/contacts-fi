-- ==============================================================================
-- ContactFi Database Migration (Final)
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Helper function to automatically update 'updated_at' column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================================================
-- Tables
-- ==============================================================================

-- Contacts Table
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  display_name text not null,
  avatar_color text check (avatar_color in ('blue', 'green', 'orange', 'purple', 'teal')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Wallets Table
create table wallets (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade not null,
  provider text not null,
  address text not null,
  is_default boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Validation: EVM Address (0x + 40 hex chars)
  constraint address_format check (address ~* '^0x[a-fA-F0-9]{40}$'),
  -- Constraint: Ensure unique address per contact
  constraint unique_address_per_contact unique (contact_id, address)
);

-- Transactions Table
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  contact_id uuid references contacts(id) not null,
  wallet_id uuid references wallets(id) not null,
  amount numeric not null,
  currency text default 'USDC' not null check (currency = 'USDC'),
  tx_hash text unique not null,
  status text not null check (status in ('pending', 'success', 'failed')),
  created_at timestamptz default now() not null
);

-- ==============================================================================
-- Indexes
-- ==============================================================================

create index idx_contacts_user_id on contacts(user_id);
create index idx_wallets_contact_id on wallets(contact_id);

-- Constraint: Ensure only ONE default wallet per contact
create unique index idx_wallets_one_default_per_contact 
on wallets(contact_id) where is_default = true;

create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_contact_id on transactions(contact_id);

-- ==============================================================================
-- Triggers
-- ==============================================================================

create trigger update_contacts_updated_at
before update on contacts
for each row execute function update_updated_at_column();

create trigger update_wallets_updated_at
before update on wallets
for each row execute function update_updated_at_column();

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================

alter table contacts enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;

-- Contacts: Users can only manage their own contacts
create policy "Users can manage their own contacts" on contacts
  for all using (auth.uid() = user_id);

-- Wallets: Users can only manage wallets for their own contacts
create policy "Users can manage wallets for their own contacts" on wallets
  for all using (
    exists (
      select 1 from contacts
      where contacts.id = wallets.contact_id
      and contacts.user_id = auth.uid()
    )
  );

-- Transactions: Users can only see/insert their own transactions
create policy "Users can view their own transactions" on transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on transactions
  for insert with check (auth.uid() = user_id);
