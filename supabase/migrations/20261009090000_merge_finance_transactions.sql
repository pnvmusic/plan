-- ============================================================================
-- รวม "ค่าใช้จ่าย" (expenses) + "เงินกองกลาง" (fund_transactions)
-- เป็นตารางเดียว: finance_transactions (เมนู "การเงิน")
--   - direction: 'in' = เงินเข้า, 'out' = เงินออก
--   - status: เงินออก = รอเบิก/เบิกแล้ว/จ่ายแล้ว/ยกเลิก, เงินเข้า = ได้รับแล้ว/ยกเลิก
--   - แก้ไข/ลบได้ (Admin, Manager)
-- ตาราง expenses เดิมถูกเปลี่ยนชื่อเป็น expenses_legacy เก็บไว้เป็นสำรอง (ลบทิ้งได้ภายหลัง)
-- ============================================================================

-- 1) ยกเลิกการล็อกแก้ไข/ลบของ ledger เดิม
drop trigger if exists fund_transactions_prevent_update_delete on public.fund_transactions;
drop trigger if exists fund_transactions_prevent_truncate on public.fund_transactions;
drop function if exists public.prevent_fund_transaction_mutation();

-- 2) เปลี่ยนชื่อตาราง + index
alter table public.fund_transactions rename to finance_transactions;
alter index if exists public.fund_transactions_date_idx rename to finance_transactions_date_idx;
alter index if exists public.fund_transactions_direction_idx rename to finance_transactions_direction_idx;
alter index if exists public.fund_transactions_project_id_idx rename to finance_transactions_project_id_idx;
alter index if exists public.fund_transactions_created_by_idx rename to finance_transactions_created_by_idx;

-- 3) เพิ่มสถานะ
alter table public.finance_transactions add column status text;
update public.finance_transactions
   set status = case when direction = 'in' then 'ได้รับแล้ว' else 'จ่ายแล้ว' end;
alter table public.finance_transactions
  alter column status set not null,
  add constraint finance_transactions_status_check check (
    (direction = 'out' and status in ('รอเบิก','เบิกแล้ว','จ่ายแล้ว','ยกเลิก'))
    or (direction = 'in' and status in ('ได้รับแล้ว','ยกเลิก'))
  );
create index finance_transactions_status_idx on public.finance_transactions (status);

-- 4) ย้ายค่าใช้จ่ายเดิมเข้ามาเป็น "เงินออก"
insert into public.finance_transactions
  (date, direction, category, amount, project_id, counterparty, method, note,
   evidence_path, status, created_by, created_at)
select e.date, 'out', e.category, e.amount, e.project_id,
       coalesce(e.vendor, ''), coalesce(e.method, ''), coalesce(e.note, ''),
       coalesce(e.receipt_path, ''), e.status::text, e.created_by, e.created_at
  from public.expenses e
 where e.amount > 0;

alter table public.expenses rename to expenses_legacy;

-- 5) สิทธิ์: อ่านได้ทุกคนที่ล็อกอิน, เพิ่ม/แก้/ลบได้เฉพาะ Admin/Manager
drop policy if exists "fund_transactions_read" on public.finance_transactions;
drop policy if exists "fund_transactions_insert" on public.finance_transactions;
drop policy if exists "fund_transactions_update" on public.finance_transactions;
drop policy if exists "fund_transactions_delete" on public.finance_transactions;

create policy "finance_transactions_read" on public.finance_transactions
  for select to authenticated using (true);

create policy "finance_transactions_insert" on public.finance_transactions
  for insert to authenticated
  with check (created_by = (select auth.uid()) and my_role() in ('Admin','Manager'));

create policy "finance_transactions_update" on public.finance_transactions
  for update to authenticated
  using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

create policy "finance_transactions_delete" on public.finance_transactions
  for delete to authenticated
  using (my_role() in ('Admin','Manager'));

revoke all on public.finance_transactions from anon;
grant select, insert, update, delete on public.finance_transactions to authenticated;
