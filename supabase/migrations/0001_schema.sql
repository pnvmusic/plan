-- ============================================================================
-- MuseFlow — Database Schema (PostgreSQL / Supabase)
-- รัน migration นี้ใน Supabase SQL Editor หรือผ่าน Supabase CLI
-- ============================================================================

-- ---------- ENUM TYPES ----------
create type user_role     as enum ('Admin', 'Manager', 'Team Member', 'Viewer');
create type project_type  as enum ('Single', 'EP', 'Album', 'Acoustic', 'Cover');
create type project_stage as enum (
  'Idea','Demo','Arrangement','Recording','Editing',
  'Mixing','Mastering','Artwork','MV','Distribution','Released'
);
create type task_priority as enum ('สูง','กลาง','ต่ำ');
create type event_type    as enum ('recording','meeting','deadline');
create type expense_status as enum ('รอเบิก','เบิกแล้ว','จ่ายแล้ว','ยกเลิก');
create type document_type as enum (
  'สัญญาจ้างทำเพลง','สัญญา MV','สัญญา Producer','สัญญา Session Musician',
  'ใบเสนอราคา','ใบแจ้งหนี้','เอกสารลิขสิทธิ์'
);

-- ============================================================================
-- PROFILES  (1:1 กับ auth.users)
-- ============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'ผู้ใช้ใหม่',
  email       text,
  role        user_role not null default 'Team Member',
  color       text not null default '#7c5cff',
  initials    text,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- PROJECTS
-- ============================================================================
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text not null,
  type        project_type not null default 'Single',
  status      project_stage not null default 'Idea',
  release_date date,
  deadline    date,
  owner_id    uuid references public.profiles(id) on delete set null,
  note        text default '',
  refs        text[] not null default '{}',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.projects (status);
create index on public.projects (owner_id);
create index on public.projects (release_date);
create index on public.projects (deadline);

-- ============================================================================
-- TASKS
-- ============================================================================
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  stage       project_stage not null default 'Recording',
  done        boolean not null default false,
  deadline    date,
  assignee_id uuid references public.profiles(id) on delete set null,
  priority    task_priority not null default 'กลาง',
  created_at  timestamptz not null default now()
);
create index on public.tasks (project_id);
create index on public.tasks (assignee_id);
create index on public.tasks (stage);

-- ============================================================================
-- EVENTS (ปฏิทิน)
-- ============================================================================
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        event_type not null default 'recording',
  date        date not null,
  time        text default '',
  end_time    text default '',
  studio      text default '',
  project_id  uuid references public.projects(id) on delete set null,
  task_id     uuid references public.tasks(id) on delete cascade,
  attendees   uuid[] not null default '{}',
  note        text default '',
  created_at  timestamptz not null default now()
);
create index on public.events (date);
create index on public.events (project_id);
create index on public.events (task_id);

-- ============================================================================
-- EXPENSES
-- ============================================================================
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  category    text not null,
  amount      numeric(12,2) not null default 0,
  project_id  uuid references public.projects(id) on delete set null,
  vendor      text default '',
  method      text default '',
  status      expense_status not null default 'รอเบิก',
  note        text default '',
  receipt_path text default '',           -- path ใน storage bucket
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on public.expenses (project_id);
create index on public.expenses (status);
create index on public.expenses (date);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        document_type not null,
  project_id  uuid references public.projects(id) on delete set null,
  file_path   text default '',            -- path ใน storage bucket
  size        text default '',
  note        text default '',
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create index on public.documents (project_id);
create index on public.documents (type);

-- ============================================================================
-- updated_at trigger สำหรับ projects
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- AUTO-CREATE PROFILE เมื่อมีผู้ใช้สมัครใหม่ (จาก auth)
-- ผู้ใช้คนแรกของระบบจะได้ role 'Admin' โดยอัตโนมัติ
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  uname    text;
begin
  select count(*) = 0 into is_first from public.profiles;
  uname := coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
  insert into public.profiles (id, name, email, role, initials)
  values (
    new.id,
    uname,
    new.email,
    case when is_first then 'Admin'::user_role else 'Team Member'::user_role end,
    upper(left(uname, 2))
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- HELPER: ดึง role ของผู้ใช้ปัจจุบัน (ใช้ใน RLS)
-- ============================================================================
create or replace function public.my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- กติกาสิทธิ์:
--   Admin            -> ทำได้ทุกอย่าง
--   Manager          -> แก้ projects / tasks / calendar / expenses / documents
--   Team Member      -> อ่านทุกอย่าง, แก้เฉพาะ tasks
--   Viewer           -> อ่านอย่างเดียว
-- ทุกคนที่ล็อกอินอ่านข้อมูลได้ (ทีมเดียวกัน)
-- ============================================================================

-- ---------- PROFILES ----------
alter table public.profiles enable row level security;

create policy "profiles_read_all" on public.profiles
  for select using (auth.uid() is not null);

create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = auth.uid() or my_role() = 'Admin');

-- ---------- PROJECTS ----------
alter table public.projects enable row level security;

create policy "projects_read" on public.projects
  for select using (auth.uid() is not null);

create policy "projects_write" on public.projects
  for all using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

-- ---------- TASKS (Team Member แก้ได้) ----------
alter table public.tasks enable row level security;

create policy "tasks_read" on public.tasks
  for select using (auth.uid() is not null);

create policy "tasks_write" on public.tasks
  for all using (my_role() in ('Admin','Manager','Team Member'))
  with check (my_role() in ('Admin','Manager','Team Member'));

-- ---------- EVENTS ----------
alter table public.events enable row level security;

create policy "events_read" on public.events
  for select using (auth.uid() is not null);

create policy "events_write" on public.events
  for all using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

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

-- ---------- EXPENSES ----------
alter table public.expenses enable row level security;

create policy "expenses_read" on public.expenses
  for select using (auth.uid() is not null);

create policy "expenses_write" on public.expenses
  for all using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

-- ---------- DOCUMENTS ----------
alter table public.documents enable row level security;

create policy "documents_read" on public.documents
  for select using (auth.uid() is not null);

create policy "documents_write" on public.documents
  for all using (my_role() in ('Admin','Manager'))
  with check (my_role() in ('Admin','Manager'));

-- ============================================================================
-- STORAGE: bucket สำหรับใบเสร็จ + เอกสาร + ไฟล์ reference
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('museflow-files', 'museflow-files', false)
on conflict (id) do nothing;

-- อ่านไฟล์ได้ทุกคนที่ล็อกอิน
create policy "files_read" on storage.objects
  for select using (bucket_id = 'museflow-files' and auth.uid() is not null);

-- อัปโหลด/แก้/ลบ เฉพาะ Admin/Manager
create policy "files_write" on storage.objects
  for insert with check (bucket_id = 'museflow-files' and public.my_role() in ('Admin','Manager'));
create policy "files_update" on storage.objects
  for update using (bucket_id = 'museflow-files' and public.my_role() in ('Admin','Manager'));
create policy "files_delete" on storage.objects
  for delete using (bucket_id = 'museflow-files' and public.my_role() in ('Admin','Manager'));
