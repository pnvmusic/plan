-- ============================================================================
-- MuseFlow — Seed Data (ตัวอย่างสำหรับทดสอบระบบ)
-- ----------------------------------------------------------------------------
-- วิธีใช้:
--   1) สมัคร/ล็อกอินเข้าแอปอย่างน้อย 1 ครั้ง เพื่อให้มี profile ในระบบ
--   2) เปิด Supabase SQL Editor แล้วรันไฟล์นี้
-- สคริปต์จะผูกข้อมูลตัวอย่างทั้งหมดกับ profile แรกที่มีอยู่ (เจ้าของบัญชี)
-- ปลอดภัยต่อการรันซ้ำ: ล้างข้อมูลตัวอย่างเดิมก่อน insert ใหม่
-- ============================================================================

do $$
declare
  me uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid;
begin
  select id into me from public.profiles order by created_at limit 1;
  if me is null then
    raise notice 'ยังไม่มี profile — กรุณาล็อกอินเข้าแอปก่อน แล้วรัน seed อีกครั้ง';
    return;
  end if;

  -- ล้างข้อมูลตัวอย่างเดิม (เฉพาะที่ seed สร้าง — ระวังถ้ามีข้อมูลจริงปนอยู่)
  delete from public.documents;
  delete from public.expenses;
  delete from public.events;
  delete from public.tasks;
  delete from public.projects;

  -- ---------- PROJECTS ----------
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values
   ('แสงสุดท้าย','The Lantern','Single','Mixing','2026-07-04', me,'ซิงเกิลนำของ EP ตั้งใจปล่อยก่อนทัวร์', array['demo_v3.mp3','lyrics_final.pdf','guide_vocal.wav'], me) returning id into p1;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('ทะเลไม่เคยหลับ','Niran','EP','Recording','2026-06-28', me,'EP 5 เพลง อัดสดทั้งวง', array['arrangement.pdf','reference_track.mp3'], me) returning id into p2;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('เมืองที่ไม่มีเธอ','Plawan','Single','Mastering','2026-06-24', me,'รอมาสเตอร์รอบสุดท้าย', array['mix_v5.wav'], me) returning id into p3;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('ดาวคนละดวง','The Lantern','Album','Arrangement','2026-09-12', me,'อัลบั้มเต็ม 10 เพลง — งานใหญ่', array['album_concept.pdf','demo_track1.mp3'], me) returning id into p4;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('คำว่ารัก (Acoustic)','Mali','Acoustic','Artwork','2026-06-22', me,'เวอร์ชันอะคูสติก รออาร์ตเวิร์ก', array['acoustic_mix.wav','cover_draft.png'], me) returning id into p5;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('ฝนเดือนหก','Niran','Cover','Released','2026-05-30', me,'คัฟเวอร์เพลงเก่า ปล่อยแล้วบน Spotify', array['final_master.wav','artwork_final.png'], me) returning id into p6;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('ปลายทางเดียวกัน','Plawan','Single','Demo','2026-08-15', me,'เพิ่งเริ่มทำเดโม', array['idea_voice_memo.m4a'], me) returning id into p7;
  insert into public.projects (title, artist, type, status, deadline, owner_id, note, refs, created_by)
  values ('ลมหายใจของเมือง','The Lantern','Single','MV','2026-07-18', me,'ถ่าย MV สัปดาห์หน้า', array['mv_storyboard.pdf','master.wav'], me) returning id into p8;

  -- ---------- TASKS ----------
  insert into public.tasks (project_id, title, stage, done, deadline, assignee_id, priority) values
   (p1,'มิกซ์เสียงร้องหลัก','Mixing',false,'2026-06-25', me,'สูง'),
   (p1,'บาลานซ์เครื่องดนตรี','Mixing',false,'2026-06-27', me,'กลาง'),
   (p1,'อนุมัติมิกซ์ v4','Mixing',true,'2026-06-20', me,'กลาง'),
   (p2,'อัดกลองชุดที่ 2','Recording',false,'2026-06-23', me,'สูง'),
   (p2,'อัดเบส','Recording',true,'2026-06-19', me,'กลาง'),
   (p2,'อัดกีตาร์โซโล','Recording',false,'2026-06-26', me,'กลาง'),
   (p3,'มาสเตอร์รอบสุดท้าย','Mastering',false,'2026-06-24', me,'สูง'),
   (p4,'เรียบเรียงเพลงที่ 3','Arrangement',false,'2026-07-01', me,'กลาง'),
   (p4,'เรียบเรียงเพลงที่ 4','Arrangement',false,'2026-07-10', me,'ต่ำ'),
   (p5,'ออกแบบปกอัลบั้ม','Artwork',false,'2026-06-21', me,'สูง'),
   (p5,'รีทัชภาพศิลปิน','Artwork',true,'2026-06-18', me,'ต่ำ'),
   (p8,'เตรียมโลเคชันถ่าย MV','MV',false,'2026-06-29', me,'สูง'),
   (p8,'คัดเลือกนักแสดง','MV',true,'2026-06-16', me,'กลาง'),
   (p7,'เขียนเนื้อท่อนฮุก','Demo',false,'2026-06-30', me,'กลาง');

  -- ---------- EVENTS ----------
  insert into public.events (title, type, date, time, end_time, studio, project_id, attendees, note) values
   ('อัดเสียงร้อง — ทะเลไม่เคยหลับ','recording','2026-06-22','13:00','17:00','Studio 28 ห้อง A', p2, array[me], 'เตรียม guide vocal มาด้วย'),
   ('ประชุมทีม — วางแผนอัลบั้ม','meeting','2026-06-23','10:00','11:30','ออนไลน์ (Zoom)', p4, array[me], 'รีวิวเดโม 4 เพลงแรก'),
   ('Deadline: มาสเตอร์ เมืองที่ไม่มีเธอ','deadline','2026-06-24','18:00','','', p3, array[me], ''),
   ('อัดกลอง — ทะเลไม่เคยหลับ','recording','2026-06-25','09:00','13:00','Karma Sound', p2, array[me], 'เซ็ตกลอง 2 ชุด'),
   ('ถ่าย MV — ลมหายใจของเมือง','recording','2026-06-27','06:00','20:00','โลเคชัน: เยาวราช', p8, array[me], 'เริ่มเช้ามาก'),
   ('รีวิวอาร์ตเวิร์ก — คำว่ารัก','meeting','2026-06-21','15:00','16:00','ออนไลน์', p5, array[me], ''),
   ('Deadline: ปล่อยซิงเกิล แสงสุดท้าย','deadline','2026-07-04','00:00','','', p1, array[me], 'ส่ง distributor ก่อน 3 วัน');

  -- ---------- EXPENSES ----------
  insert into public.expenses (date, category, amount, project_id, vendor, method, status, note, created_by) values
   ('2026-06-15','ค่า Studio',8000, p2,'Studio 28','โอนธนาคาร','เบิกแล้ว','จองห้อง A 2 วัน', me),
   ('2026-06-12','ค่า Mix',15000, p1,'จูน มิกซ์','พร้อมเพย์','จ่ายแล้ว','มิกซ์ 1 เพลง', me),
   ('2026-06-10','ค่า Master',6000, p3,'Sterling Studio','โอนธนาคาร','รอเบิก','', me),
   ('2026-06-08','ค่า MV',120000, p8,'Frame House','โอนธนาคาร','รอเบิก','มัดจำ 50%', me),
   ('2026-06-05','ค่า Arranger',12000, p4,'โอม โปรดิวเซอร์','พร้อมเพย์','จ่ายแล้ว','เรียบเรียง 2 เพลง', me),
   ('2026-06-03','ค่า Musician',9000, p2,'วงเซสชัน 3 คน','เงินสด','เบิกแล้ว','มือกลอง+เบส+กีตาร์', me),
   ('2026-06-01','ค่า Artwork',7000, p5,'ฟ้า อาร์ตเวิร์ก','พร้อมเพย์','จ่ายแล้ว','ปก + visual', me),
   ('2026-05-28','ค่าเดินทาง',2400, p8,'แท็กซี่/น้ำมัน','เงินสด','รอเบิก','สำรวจโลเคชัน', me),
   ('2026-05-20','ค่าอุปกรณ์',3500, p2,'Music World','บัตรเครดิต','จ่ายแล้ว','สายแจ็ค+ไมค์สำรอง', me),
   ('2026-05-18','ค่า Studio',5000, p1,'Studio 28','โอนธนาคาร','ยกเลิก','ยกเลิกคิว เลื่อนวัน', me);

  -- ---------- DOCUMENTS ----------
  insert into public.documents (name, type, project_id, size, note, uploaded_by) values
   ('สัญญาจ้างทำเพลง_แสงสุดท้าย.pdf','สัญญาจ้างทำเพลง', p1,'1.2 MB','เซ็นครบทั้ง 2 ฝ่าย', me),
   ('สัญญา_MV_ลมหายใจของเมือง.pdf','สัญญา MV', p8,'880 KB','Frame House — มัดจำ 50%', me),
   ('invoice_studio28_jun.pdf','ใบแจ้งหนี้', p2,'320 KB','ค่าห้องอัด', me),
   ('quote_mastering_sterling.pdf','ใบเสนอราคา', p3,'210 KB','รออนุมัติ', me),
   ('สัญญา_Producer_โอม.pdf','สัญญา Producer', p4,'1.5 MB','โปรดิวเซอร์อัลบั้ม', me),
   ('session_musician_agreement.pdf','สัญญา Session Musician', p2,'640 KB','วงเซสชัน 3 คน', me),
   ('copyright_ฝนเดือนหก.pdf','เอกสารลิขสิทธิ์', p6,'430 KB','เคลียร์ลิขสิทธิ์คัฟเวอร์', me);

  raise notice 'Seed สำเร็จ — ผูกข้อมูลกับ profile: %', me;
end $$;
