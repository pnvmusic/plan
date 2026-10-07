create table public.fund_transactions (
  id            uuid primary key default gen_random_uuid(),
  date          date not null default current_date,
  direction     text not null check (direction in ('in', 'out')),
  category      text not null default 'อื่นๆ',
  amount        numeric(12,2) not null check (amount > 0),
  project_id    uuid references public.projects(id) on delete set null,
  counterparty  text not null default '',
  method        text not null default '',
  note          text not null default '',
  evidence_path text not null default '',
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index fund_transactions_date_idx on public.fund_transactions (date);
create index fund_transactions_direction_idx on public.fund_transactions (direction);
create index fund_transactions_project_id_idx on public.fund_transactions (project_id);

alter table public.fund_transactions enable row level security;

create policy "fund_transactions_read" on public.fund_transactions
  for select using (auth.uid() is not null);

create policy "fund_transactions_write" on public.fund_transactions
  for all using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));
