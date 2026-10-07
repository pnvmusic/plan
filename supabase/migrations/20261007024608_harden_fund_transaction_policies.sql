create index fund_transactions_created_by_idx
  on public.fund_transactions (created_by);

drop policy "fund_transactions_read" on public.fund_transactions;
drop policy "fund_transactions_write" on public.fund_transactions;

create policy "fund_transactions_read" on public.fund_transactions
  for select to authenticated using (true);

create policy "fund_transactions_insert" on public.fund_transactions
  for insert to authenticated
  with check (my_role() in ('Admin','Manager'));

create policy "fund_transactions_update" on public.fund_transactions
  for update to authenticated
  using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

create policy "fund_transactions_delete" on public.fund_transactions
  for delete to authenticated
  using (my_role() in ('Admin','Manager'));
