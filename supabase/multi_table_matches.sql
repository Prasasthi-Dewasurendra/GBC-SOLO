-- Run this migration for databases created before four-table scoring.
alter table public.matches add column if not exists table_number integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_table_number_check') then
    alter table public.matches
      add constraint matches_table_number_check
      check (table_number is null or table_number between 1 and 4);
  end if;
end;
$$;

create unique index if not exists one_live_match_per_table
  on public.matches (table_number)
  where status = 'live' and table_number is not null;