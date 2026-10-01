-- Run after schema.sql. This supports short-lived QR photo capture links.
create table if not exists public.capture_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.capture_sessions enable row level security;
