# 🎵 MuseFlow — ระบบวางแผนและติดตามงานเพลง

เว็บแอปสำหรับศิลปิน/ทีมโปรดักชันเพลง ใช้จัดการโปรเจกต์เพลงทั้งหมดในที่เดียว: ดูสถานะแต่ละเพลง, งานที่ค้าง, นัดอัด, ค่าใช้จ่าย, และเอกสาร/สัญญา

**Stack:** React + Vite (frontend) · Supabase (Postgres + Auth + Storage) · Username + Password login · Deploy บน GitHub Pages

> 🔐 **ระบบ Login ใช้ username + password** (ผู้ดูแลสร้างบัญชีให้ ไม่เปิดให้สมัครเอง)
> ผู้ใช้ล็อกอินด้วย username สั้นๆ (เช่น `pnv`) — ระบบเติมโดเมนภายใน `@museflow.local` ให้อัตโนมัติ
> เปลี่ยนรหัสผ่านได้ในหน้า "ทีม & สิทธิ์"

---

## ฟีเจอร์

- **Dashboard** — ภาพรวมเพลงที่ทำอยู่/เสร็จแล้ว, ใกล้ deadline, งานค้าง, ค่าใช้จ่ายรายโปรเจกต์, นัดอัดที่จะมาถึง
- **โปรเจกต์เพลง** — 11 สถานะ (Idea → Released), ศิลปิน, ประเภท, deadline, ผู้รับผิดชอบ, note, ไฟล์ reference
- **Task Board** — Kanban ลากการ์ดได้ (เพลง/งาน), checkbox, priority, assignee, progress %
- **ปฏิทิน** — Month/Week/Day, นัดอัด/ประชุม/deadline
- **ค่าใช้จ่าย** — 10 หมวด, สถานะเบิกเงิน, แนบใบเสร็จ, export CSV/PDF
- **เอกสาร** — สัญญา/ใบเสนอราคา/ลิขสิทธิ์ ผูกกับโปรเจกต์ ค้นหาได้
- **ค้นหา & กรอง** ทุกหน้า
- **User Roles** — Admin / Manager / Team Member / Viewer (บังคับใช้จริงด้วย Row Level Security)
- Responsive + Dark/Light mode

---

## 1. ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com) (free tier พอ)
2. ไปที่ **SQL Editor** → New query → วางเนื้อหาไฟล์ `supabase/migrations/0001_schema.sql` ทั้งหมด → **Run**
   - สร้างตาราง, enum, RLS policies, trigger สร้าง profile อัตโนมัติ, และ storage bucket
3. ไปที่ **Authentication → Providers** → เปิด **Email** (Magic Link เปิดอยู่โดยค่าเริ่มต้น)
4. ไปที่ **Project Settings → API** จดค่า:
   - `Project URL`
   - `anon public` key

> 🔑 **ผู้ใช้คนแรกที่ล็อกอินจะได้สิทธิ์ Admin อัตโนมัติ** คนถัดไปจะเป็น Team Member (Admin เปลี่ยนบทบาทให้ได้ในหน้า "ทีม & สิทธิ์")

### Seed ข้อมูลตัวอย่าง (ไม่บังคับ)

หลังล็อกอินเข้าแอปครั้งแรกแล้ว (เพื่อให้มี profile) ให้รัน `supabase/seed.sql` ใน SQL Editor — จะใส่เพลง 8 เพลง, tasks, นัดหมาย, ค่าใช้จ่าย และเอกสารตัวอย่าง ผูกกับบัญชีของคุณ

---

## 2. รันบนเครื่อง (Local)

```bash
npm install
cp .env.example .env       # แล้วใส่ค่า Supabase URL + anon key ลงใน .env
npm run dev                # เปิด http://localhost:5173
```

`.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 3. Deploy บน GitHub Pages

1. Push โค้ดขึ้น GitHub repo (เช่น `museflow-app`)
2. ไปที่ **Settings → Secrets and variables → Actions** → เพิ่ม 2 secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. ไปที่ **Settings → Pages** → Source = **GitHub Actions**
4. ไปที่ **Supabase → Authentication → URL Configuration** → เพิ่ม URL ของ GitHub Pages
   (เช่น `https://<user>.github.io/museflow-app/`) ใน **Redirect URLs** เพื่อให้ Magic Link ส่งกลับถูกที่
5. Push ไป branch `main` → GitHub Actions (`.github/workflows/deploy.yml`) จะ build และ deploy ให้อัตโนมัติ

> Workflow ตั้ง `VITE_BASE` เป็นชื่อ repo ให้อัตโนมัติ ถ้าใช้ custom domain หรือ user/org page (`<user>.github.io`) ให้แก้ `VITE_BASE` เป็น `/`

แอปใช้ **HashRouter** จึงทำงานบน GitHub Pages ได้โดยไม่ต้องตั้ง server rewrite

---

## โครงสร้างโปรเจกต์

```
museflow-app/
├─ supabase/
│  ├─ migrations/0001_schema.sql   # ตาราง + RLS + trigger + storage
│  └─ seed.sql                     # ข้อมูลตัวอย่าง
├─ src/
│  ├─ lib/        supabase.js, api.js, constants.js, format.js, exporters.js
│  ├─ context/    AuthContext, DataContext, ToastContext
│  ├─ components/ Layout, ui, *Form, *Detail
│  ├─ pages/      Login, Dashboard, Projects, Board, Calendar, Expenses, Documents, Team
│  ├─ App.jsx     routing
│  └─ main.jsx    entry
└─ .github/workflows/deploy.yml
```

---

## Database Schema (สรุป)

| ตาราง | ใช้ทำอะไร |
|-------|-----------|
| `profiles` | ผู้ใช้ + role (ผูก 1:1 กับ auth.users) |
| `projects` | โปรเจกต์เพลง (สถานะ, deadline, owner, refs) |
| `tasks` | งานย่อยในแต่ละเพลง (stage, assignee, priority, done) |
| `events` | นัดหมายในปฏิทิน (recording/meeting/deadline) |
| `expenses` | ค่าใช้จ่าย (หมวด, จำนวน, สถานะเบิก, ใบเสร็จ) |
| `documents` | สัญญา/เอกสารอ้างอิง ผูกกับโปรเจกต์ |

**Storage bucket:** `museflow-files` (ใบเสร็จ + เอกสาร) — อ่านได้ทุกคนที่ล็อกอิน, อัปโหลด/ลบเฉพาะ Admin/Manager

### สิทธิ์ตาม Role (บังคับใช้ที่ DB ด้วย RLS)

| พื้นที่ | Admin | Manager | Team Member | Viewer |
|--------|:--:|:--:|:--:|:--:|
| โปรเจกต์ | แก้ | แก้ | ดู | ดู |
| งาน/Task | แก้ | แก้ | แก้ | ดู |
| ปฏิทิน | แก้ | แก้ | ดู | ดู |
| ค่าใช้จ่าย | แก้ | แก้ | ดู | ดู |
| เอกสาร | แก้ | แก้ | ดู | ดู |
| ผู้ใช้ | แก้ | ดู | ดู | ดู |

---

สร้างด้วย React + Vite + Supabase
