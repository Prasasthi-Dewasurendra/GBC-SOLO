alter table matches add column if not exists match_number int;
alter table matches add column if not exists table_number int check (table_number between 1 and 4);
-- match numbers: R32 slot s => s+1 (1-16), R16 => 17+slot, QF => 25+slot, SF => 29+slot, Final => 31
update matches set match_number = case round
  when 1 then slot+1 when 2 then 17+slot when 3 then 25+slot when 4 then 29+slot when 5 then 31 end
where match_number is null;
-- only ONE live match per table
create unique index if not exists one_live_per_table on matches(table_number) where status='live' and table_number is not null;
