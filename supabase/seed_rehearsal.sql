-- Rehearsal-only seed. Run in Supabase SQL Editor before a dry run.
-- It removes only previous Practice Player rows and all existing matches.
update public.tournament set state = 'registration', live_match_id = null where id = 1;
delete from public.matches;
delete from public.players where name like 'Practice Player %';

insert into public.players (name, seed)
select 'Practice Player ' || lpad(number::text, 2, '0'), number
from generate_series(1, 32) as numbers(number);
