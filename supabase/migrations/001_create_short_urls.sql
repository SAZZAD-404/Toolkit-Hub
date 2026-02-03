-- Create table required by /dashboard/tools/url-shortener
-- Run this inside Supabase SQL editor.

create table if not exists public.short_urls (
  id uuid primary key default gen_random_uuid(),
  original_url text not null,
  short_code text not null unique,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  user_id uuid null
);

create index if not exists short_urls_created_at_idx on public.short_urls (created_at desc);
create index if not exists short_urls_short_code_idx on public.short_urls (short_code);

-- Optional: simple RLS (adjust as needed)
-- alter table public.short_urls enable row level security;
-- create policy "short_urls_read_all" on public.short_urls
--   for select using (true);
-- create policy "short_urls_insert_all" on public.short_urls
--   for insert with check (true);
