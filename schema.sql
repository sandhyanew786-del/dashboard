-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists public.dashboard_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security: this table is meant to back a PUBLIC dashboard,
-- so anyone with the anon key (i.e. anyone who loads the site) can
-- read it. Writes are also left open here because the app currently
-- ships with editing disabled in the UI. If you ever re-enable the
-- Edit Data tab for a public deployment, either:
--   (a) tighten the insert/update policy below to authenticated users
--       only, or
--   (b) move writes behind a server route / Supabase Edge Function
--       that checks auth before calling the database.
alter table public.dashboard_state enable row level security;

create policy "Public read access"
  on public.dashboard_state for select
  using (true);

create policy "Public write access"
  on public.dashboard_state for insert
  with check (true);

create policy "Public update access"
  on public.dashboard_state for update
  using (true);

create policy "Public delete access"
  on public.dashboard_state for delete
  using (true);
