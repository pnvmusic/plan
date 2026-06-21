create policy "events_task_deadline_insert" on public.events
  for insert with check (
    my_role() in ('Admin','Manager','Team Member')
    and type = 'deadline'
    and task_id is not null
  );

create policy "events_task_deadline_update" on public.events
  for update using (
    my_role() in ('Admin','Manager','Team Member')
    and type = 'deadline'
    and task_id is not null
  )
  with check (
    my_role() in ('Admin','Manager','Team Member')
    and type = 'deadline'
    and task_id is not null
  );

create policy "events_task_deadline_delete" on public.events
  for delete using (
    my_role() in ('Admin','Manager','Team Member')
    and type = 'deadline'
    and task_id is not null
  );
