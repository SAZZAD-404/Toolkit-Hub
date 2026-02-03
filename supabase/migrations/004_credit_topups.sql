-- Credit topups (manual admin approval)
-- Run in Supabase SQL editor.

-- 0) Extensions (gen_random_uuid)
create extension if not exists pgcrypto;

-- 1) Wallet balance table (paid credits)
create table if not exists public.user_wallet (
  user_id uuid primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists set_user_wallet_updated_at on public.user_wallet;
create trigger set_user_wallet_updated_at
before update on public.user_wallet
for each row
execute function public.set_updated_at();

alter table public.user_wallet enable row level security;

drop policy if exists "user_wallet_select_own" on public.user_wallet;
create policy "user_wallet_select_own"
  on public.user_wallet
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_wallet_insert_own" on public.user_wallet;
create policy "user_wallet_insert_own"
  on public.user_wallet
  for insert
  with check (auth.uid() = user_id);

-- NOTE: updates should generally be done by backend/admin.
-- We intentionally do NOT allow client updates by default.

drop policy if exists "user_wallet_update_own" on public.user_wallet;
create policy "user_wallet_update_own"
  on public.user_wallet
  for update
  using (false)
  with check (false);


-- 2) Credit packages
create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, -- 'pack_2', 'pack_5', 'pack_10'
  name text not null,
  usd_price integer not null,
  credits integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.credit_packages enable row level security;

drop policy if exists "credit_packages_select_all" on public.credit_packages;
create policy "credit_packages_select_all"
  on public.credit_packages
  for select
  using (true);

-- Seed packages (idempotent)
insert into public.credit_packages (code, name, usd_price, credits, active)
values
  ('pack_2',  'Crypto Topup $2',  2,  1000, true),
  ('pack_5',  'Crypto Topup $5',  5,  3000, true),
  ('pack_10', 'Crypto Topup $10', 10, 6000, true)
on conflict (code) do update
set name = excluded.name,
    usd_price = excluded.usd_price,
    credits = excluded.credits,
    active = excluded.active;


-- 3) Credit topup requests
create table if not exists public.credit_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  package_id uuid not null references public.credit_packages(id) on delete restrict,
  payment_method text not null default 'crypto',
  wallet_network text not null, -- e.g. 'USDT-TRC20'
  tx_hash text not null,
  from_address text,
  amount text,
  status text not null default 'pending', -- pending|approved|rejected
  admin_note text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists credit_topups_user_created_idx on public.credit_topups (user_id, created_at desc);
create index if not exists credit_topups_status_created_idx on public.credit_topups (status, created_at desc);

alter table public.credit_topups enable row level security;

drop policy if exists "credit_topups_select_own" on public.credit_topups;
create policy "credit_topups_select_own"
  on public.credit_topups
  for select
  using (auth.uid() = user_id);

drop policy if exists "credit_topups_insert_own" on public.credit_topups;
create policy "credit_topups_insert_own"
  on public.credit_topups
  for insert
  with check (auth.uid() = user_id);

-- Users cannot update status themselves

drop policy if exists "credit_topups_update_none" on public.credit_topups;
create policy "credit_topups_update_none"
  on public.credit_topups
  for update
  using (false)
  with check (false);
