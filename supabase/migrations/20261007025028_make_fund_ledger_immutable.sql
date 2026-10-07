create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and public.my_role() <> 'Admin' then
    raise exception 'Only an Admin can change user roles';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_profile_role_escalation() from public, anon, authenticated;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

drop policy if exists "fund_transactions_insert" on public.fund_transactions;
drop policy if exists "fund_transactions_update" on public.fund_transactions;
drop policy if exists "fund_transactions_delete" on public.fund_transactions;

create policy "fund_transactions_insert" on public.fund_transactions
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and my_role() in ('Admin','Manager')
  );

create or replace function public.prevent_fund_transaction_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Fund transactions are immutable; record a compensating entry instead';
end;
$$;

revoke all on function public.prevent_fund_transaction_mutation() from public, anon, authenticated;

create trigger fund_transactions_prevent_update_delete
  before update or delete on public.fund_transactions
  for each row execute function public.prevent_fund_transaction_mutation();
