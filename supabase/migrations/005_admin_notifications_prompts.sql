-- Admin notifications (in-app) + Script prompts (DB-managed)
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- 1) Admin notifications log
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  title text not null,
  body text not null,
  audience text not null default 'all', -- all
  status text not null default 'sent', -- sent|draft
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.admin_notifications enable row level security;

-- Do not allow client access by default (admin uses service role via API)
drop policy if exists "admin_notifications_select_none" on public.admin_notifications;
create policy "admin_notifications_select_none"
  on public.admin_notifications
  for select
  using (false);

-- 2) User inbox notifications
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
  on public.user_notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
  on public.user_notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users cannot insert notifications themselves

drop policy if exists "user_notifications_insert_none" on public.user_notifications;
create policy "user_notifications_insert_none"
  on public.user_notifications
  for insert
  with check (false);


-- 3) Script prompts (niche-wise, admin-managed)
create table if not exists public.script_prompts (
  id uuid primary key default gen_random_uuid(),
  niche text not null,
  title text not null,
  prompt_text text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists script_prompts_niche_active_idx on public.script_prompts (niche, active);

alter table public.script_prompts enable row level security;

-- App can read only active prompts

drop policy if exists "script_prompts_select_active" on public.script_prompts;
create policy "script_prompts_select_active"
  on public.script_prompts
  for select
  using (active = true);

-- No client insert/update/delete; admin does via service role API

drop policy if exists "script_prompts_write_none" on public.script_prompts;
create policy "script_prompts_write_none"
  on public.script_prompts
  for insert
  with check (false);

create policy "script_prompts_update_none"
  on public.script_prompts
  for update
  using (false)
  with check (false);
