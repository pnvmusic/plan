update public.events
set title = regexp_replace(title, '^Deadline:\s*', '')
where task_id is not null
  and title ~ '^Deadline:\s*';
