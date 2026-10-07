-- Phase 1: Database Migration for Final features
-- Run this in Supabase SQL Editor

-- 1. Add `kind` to matches
alter table public.matches add column if not exists kind text not null default 'winner' check (kind in ('winner', 'third_place', 'final'));

-- Allow round 6 for third place match, and best_of 5 for finals
alter table public.matches drop constraint if exists matches_round_check;
alter table public.matches add constraint matches_round_check check (round between 1 and 6);

-- Update existing matches so they satisfy the constraint
update public.matches set kind = 'final' where round = 5;

alter table public.matches drop constraint if exists matches_check;
alter table public.matches add constraint matches_check check ((kind = 'final' and best_of = 5) or (kind <> 'final' and best_of = 3));

-- 2. Create racks table for ball tracking
create table if not exists public.racks (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  rack_number integer not null,
  status text not null default 'playing' check (status in ('playing', 'done')),
  winner_id uuid references public.players(id) on delete set null,
  events jsonb not null default '[]'::jsonb, -- e.g. [{"ball": 1, "player_id": "uuid"}]
  created_at timestamptz not null default now(),
  unique(match_id, rack_number)
);

alter table public.racks enable row level security;

drop policy if exists "Anyone can view racks" on public.racks;
create policy "Anyone can view racks"
  on public.racks for select
  using (true);

drop policy if exists "Authenticated users manage racks" on public.racks;
create policy "Authenticated users manage racks"
  on public.racks for all
  to authenticated
  using (true)
  with check (true);

-- Realtime for racks
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'racks') then
    execute 'alter publication supabase_realtime add table public.racks';
  end if;
end;
$$;

-- 3. RPCs for rack lifecycle

create or replace function public.start_rack(p_match_id uuid)
returns setof public.racks
language plpgsql
security definer
as $$
declare
  next_rack_number integer;
begin
  select coalesce(max(rack_number), 0) + 1 into next_rack_number from public.racks where match_id = p_match_id;
  
  return query insert into public.racks (match_id, rack_number, status)
  values (p_match_id, next_rack_number, 'playing')
  returning *;
end;
$$;

create or replace function public.pot_ball(p_rack_id uuid, p_ball integer, p_player_id uuid)
returns setof public.racks
language plpgsql
security definer
as $$
begin
  return query update public.racks
  set events = events || jsonb_build_object('ball', p_ball, 'player_id', p_player_id)
  where id = p_rack_id
  returning *;
end;
$$;

create or replace function public.undo_last(p_rack_id uuid)
returns setof public.racks
language plpgsql
security definer
as $$
begin
  return query update public.racks
  set events = (
    select jsonb_agg(elem)
    from (
      select elem, row_number() over() as rn
      from jsonb_array_elements(events) as elem
    ) s
    where rn < jsonb_array_length(events)
  )
  where id = p_rack_id
  returning *;
end;
$$;

create or replace function public.finish_rack(p_rack_id uuid, p_winner_id uuid, p_player_number integer)
returns void
language plpgsql
security definer
as $$
declare
  v_match_id uuid;
begin
  update public.racks
  set status = 'done', winner_id = p_winner_id
  where id = p_rack_id
  returning match_id into v_match_id;

  -- call existing score_match logic
  perform public.score_match(v_match_id, p_player_number, 1);
end;
$$;

grant execute on function public.start_rack(uuid) to authenticated;
grant execute on function public.pot_ball(uuid, integer, uuid) to authenticated;
grant execute on function public.undo_last(uuid) to authenticated;
grant execute on function public.finish_rack(uuid, uuid, integer) to authenticated;
