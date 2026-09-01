alter table public.projects
  add column if not exists report_aliases text[] not null default '{}';

comment on column public.projects.report_aliases is
  'Alternative statement titles that map revenue rows to this project';

update public.projects
set report_aliases = array(
  select distinct alias
  from unnest(report_aliases || array[
    'p n v . - ไวต่อความรู้สึก (Sensitive) | Original by Kiss Me Five',
    'p n v . - ไวต่อความรู้สึก Colored (Original by Kiss me five)'
  ]) as alias
)
where id = 'f738bcd3-1140-425a-88ea-ae1376dac43f';
