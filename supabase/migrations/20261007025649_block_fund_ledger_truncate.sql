revoke insert, update, delete, truncate on public.fund_transactions from anon;
revoke update, delete, truncate on public.fund_transactions from authenticated;
grant select, insert on public.fund_transactions to authenticated;

create trigger fund_transactions_prevent_truncate
  before truncate on public.fund_transactions
  for each statement execute function public.prevent_fund_transaction_mutation();
