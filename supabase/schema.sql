-- GBC Solo Tournament database schema
-- Run this once in Supabase Dashboard -> SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  photo_url text,
  seed integer check (seed is null or seed between 1 and 32),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  round integer not null check (round between 1 and 5),
  slot integer not null check (slot >= 0),
  player1_id uuid references public.players(id) on delete set null,
  player2_id uuid references public.players(id) on delete set null,
  p1_racks integer not null default 0 check (p1_racks >= 0),
  p2_racks integer not null default 0 check (p2_racks >= 0),
  best_of integer not null check (best_of in (3, 5)),
  table_number integer check (table_number is null or table_number between 1 and 4),
  status text not null default 'pending' check (status in ('pending', 'live', 'done')),
  winner_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (round, slot),
  check ((round = 5 and best_of = 5) or (round < 5 and best_of = 3)),
  check (winner_id is null or winner_id = player1_id or winner_id = player2_id),
  check (status <> 'done' or winner_id is not null)
);

create unique index if not exists one_live_match_per_table
  on public.matches (table_number)
  where status = 'live' and table_number is not null;

create table if not exists public.tournament (
  id integer primary key default 1 check (id = 1),
  name text not null default 'GBC Solo Tournament',
  state text not null default 'registration' check (state in ('registration', 'drawn', 'live', 'finished')),
  live_match_id uuid references public.matches(id) on delete set null
);

insert into public.tournament (id, name, state)
values (1, 'GBC Solo Tournament', 'registration')
on conflict (id) do nothing;

-- Once the draw is confirmed, roster membership cannot change.
create or replace function public.prevent_roster_changes_after_draw()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tournament_state text;
begin
  select state into tournament_state from public.tournament where id = 1;
  if tournament_state is distinct from 'registration' then
    raise exception 'The player roster is locked after the draw is confirmed';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists prevent_roster_changes_after_draw on public.players;
create trigger prevent_roster_changes_after_draw
  before insert or delete on public.players
  for each row execute function public.prevent_roster_changes_after_draw();

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.tournament enable row level security;

drop policy if exists "Anyone can view players" on public.players;
create policy "Anyone can view players"
  on public.players for select
  using (true);

drop policy if exists "Authenticated users manage players" on public.players;
create policy "Authenticated users manage players"
  on public.players for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Anyone can view matches" on public.matches;
create policy "Anyone can view matches"
  on public.matches for select
  using (true);

drop policy if exists "Authenticated users manage matches" on public.matches;
create policy "Authenticated users manage matches"
  on public.matches for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Anyone can view tournament" on public.tournament;
create policy "Anyone can view tournament"
  on public.tournament for select
  using (true);

drop policy if exists "Authenticated users manage tournament" on public.tournament;
create policy "Authenticated users manage tournament"
  on public.tournament for all
  to authenticated
  using (true)
  with check (true);

-- Realtime sends row changes to the public display and the admin view.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then
    execute 'alter publication supabase_realtime add table public.players';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches') then
    execute 'alter publication supabase_realtime add table public.matches';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournament') then
    execute 'alter publication supabase_realtime add table public.tournament';
  end if;
end;
$$;

-- Public read access lets the display and player cards load photos.
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view player photos" on storage.objects;
create policy "Anyone can view player photos"
  on storage.objects for select
  using (bucket_id = 'player-photos');

drop policy if exists "Authenticated users upload player photos" on storage.objects;
create policy "Authenticated users upload player photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'player-photos');

drop policy if exists "Authenticated users update player photos" on storage.objects;
create policy "Authenticated users update player photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'player-photos')
  with check (bucket_id = 'player-photos');

drop policy if exists "Authenticated users delete player photos" on storage.objects;
create policy "Authenticated users delete player photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'player-photos');

create or replace function public.score_match(
  p_match_id uuid,
  p_player_number integer,
  p_delta integer default 1
)
returns setof public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  current_match public.matches;
  next_match public.matches;
  next_slot integer;
  new_p1_racks integer;
  new_p2_racks integer;
  new_winner_id uuid;
  race_target integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_player_number not in (1, 2) or p_delta not in (-1, 1) then
    raise exception 'Invalid scoring request';
  end if;

  select * into current_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if current_match.status <> 'live' then
    raise exception 'Only live matches can be scored';
  end if;

  new_p1_racks := current_match.p1_racks + case when p_player_number = 1 then p_delta else 0 end;
  new_p2_racks := current_match.p2_racks + case when p_player_number = 2 then p_delta else 0 end;

  if new_p1_racks < 0 or new_p2_racks < 0 then
    raise exception 'Rack score cannot be negative';
  end if;

  race_target := ceil(current_match.best_of::numeric / 2)::integer;
  new_winner_id := null;

  if new_p1_racks >= race_target and new_p1_racks > new_p2_racks then
    new_winner_id := current_match.player1_id;
  elsif new_p2_racks >= race_target and new_p2_racks > new_p1_racks then
    new_winner_id := current_match.player2_id;
  end if;

  update public.matches
  set p1_racks = new_p1_racks,
      p2_racks = new_p2_racks,
      status = case when new_winner_id is null then 'live' else 'done' end,
      winner_id = new_winner_id
  where id = p_match_id;

  if new_winner_id is not null then
    if current_match.round < 5 then
      next_slot := floor(current_match.slot / 2.0)::integer;

      select * into next_match
      from public.matches
      where round = current_match.round + 1 and slot = next_slot
      for update;

      if not found then
        raise exception 'Next-round match does not exist';
      end if;

      if next_match.status <> 'pending' then
        raise exception 'Next-round match has already started';
      end if;

      if mod(current_match.slot, 2) = 0 then
        update public.matches set player1_id = new_winner_id where id = next_match.id;
      else
        update public.matches set player2_id = new_winner_id where id = next_match.id;
      end if;

      update public.tournament
      set live_match_id = null
      where id = 1 and live_match_id = p_match_id;
    else
      update public.tournament
      set state = 'finished', live_match_id = null
      where id = 1;
    end if;
  end if;

  return query select * from public.matches where id = p_match_id;
end;
$$;

grant execute on function public.score_match(uuid, integer, integer) to authenticated;
