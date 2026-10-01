-- Run this migration if schema.sql was already run before Step 5.
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