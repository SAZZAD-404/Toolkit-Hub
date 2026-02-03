-- Create profile + settings tables required by /dashboard/profile
-- Run this inside Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key, -- same as auth.users.id
  name text not null default '',
  bio text not null default '',
  avatar_url text null,

  theme text not null default 'dark', -- 'dark' | 'light' | 'system'
  language text not null default 'en', -- 'en' | 'bn'
  notifications boolean not null default true,
  auto_save boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
