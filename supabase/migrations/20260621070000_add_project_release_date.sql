alter table public.projects
  add column if not exists release_date date;

update public.projects
set release_date = deadline + 14
where release_date is null
  and deadline is not null;

create index if not exists projects_release_date_idx
  on public.projects (release_date);
