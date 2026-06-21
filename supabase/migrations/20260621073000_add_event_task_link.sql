alter table public.events
  add column if not exists task_id uuid references public.tasks(id) on delete cascade;

create index if not exists events_task_id_idx
  on public.events (task_id);
