-- Dashboard: usage + credits (monthly quota)
-- Run in Supabase SQL editor.

-- 1) Credits (monthly quota)
create table if not exists public.user_credits (
  user_id uuid not null,
  month_start date not null, -- first day of month (UTC)
  monthly_quota integer not null default 100,
  used integer not null default 0,
  primary key (user_id, month_start),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_credits_month_start_idx on public.user_credits (month_start);

drop trigger if exists set_user_credits_updated_at on public.user_credits;
create trigger set_user_credits_updated_at
before update on public.user_credits
for each row
execute function public.set_updated_at();

alter table public.user_credits enable row level security;

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own"
  on public.user_credits
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_credits_insert_own" on public.user_credits;
create policy "user_credits_insert_own"
  on public.user_credits
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_credits_update_own" on public.user_credits;
create policy "user_credits_update_own"
  on public.user_credits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Usage events (recent activity + last 7 days)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tool text not null, -- e.g., 'text-to-speech'
  action text not null, -- e.g., 'run'
  status text not null default 'success', -- success|error
  credits integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "usage_events_insert_own" on public.usage_events;
create policy "usage_events_insert_own"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);
