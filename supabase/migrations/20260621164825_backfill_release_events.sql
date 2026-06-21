insert into public.events (
  title,
  type,
  date,
  time,
  end_time,
  studio,
  project_id,
  attendees,
  note
)
select
  'Release: ' || p.title,
  'release'::event_type,
  p.release_date,
  '',
  '',
  '',
  p.id,
  case when p.owner_id is null then '{}'::uuid[] else array[p.owner_id] end,
  ''
from public.projects p
where p.release_date is not null
  and not exists (
    select 1
    from public.events e
    where e.project_id = p.id
      and e.type = 'release'::event_type
  );
