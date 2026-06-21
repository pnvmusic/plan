// ค่าคงที่ทั้งระบบ — ต้องตรงกับ enum ใน Postgres schema

export const STAGES = [
  { key: 'Idea',         label: 'ไอเดีย',       color: '#6b768f' },
  { key: 'Demo',         label: 'เดโม',         color: '#4aa8ff' },
  { key: 'Arrangement',  label: 'เรียบเรียง',   color: '#9d86ff' },
  { key: 'Recording',    label: 'บันทึกเสียง',  color: '#7c5cff' },
  { key: 'Editing',      label: 'ตัดต่อ',       color: '#36d1b7' },
  { key: 'Mixing',       label: 'มิกซ์',        color: '#2ec5d3' },
  { key: 'Mastering',    label: 'มาสเตอร์',     color: '#3ddc91' },
  { key: 'Artwork',      label: 'อาร์ตเวิร์ก',  color: '#ffb020' },
  { key: 'MV',           label: 'มิวสิควิดีโอ', color: '#ff8e3c' },
  { key: 'Distribution', label: 'จัดจำหน่าย',   color: '#ff6f91' },
  { key: 'Released',     label: 'ปล่อยแล้ว',    color: '#3ddc91' },
]
export const stage = (k) => STAGES.find((s) => s.key === k) || STAGES[0]
export const stageIdx = (k) => STAGES.findIndex((s) => s.key === k)
export const stageProgress = (k) => Math.round((stageIdx(k) / (STAGES.length - 1)) * 100)

// คอลัมน์บน Kanban board
export const BOARD_STAGES = ['Demo','Arrangement','Recording','Editing','Mixing','Mastering','Artwork','MV']

export const TYPES = ['Single', 'EP', 'Album', 'Acoustic', 'Cover']

export const ARTISTS = ['p n v .', 'p n v . feat.', 'อื่นๆ']

export const EXP_CATS = [
  'ค่า MV','ค่า Mix','ค่า Master','ค่า Arranger','ค่า Studio',
  'ค่า Musician','ค่า Artwork','ค่าเดินทาง','ค่าอุปกรณ์','อื่นๆ',
]
export const EXP_STATUS = { 'รอเบิก':'#ffb020', 'เบิกแล้ว':'#4aa8ff', 'จ่ายแล้ว':'#3ddc91', 'ยกเลิก':'#6b768f' }
export const PAY_METHODS = ['โอนธนาคาร', 'เงินสด', 'บัตรเครดิต', 'พร้อมเพย์']

export const DOC_TYPES = [
  'สัญญาจ้างทำเพลง','สัญญา MV','สัญญา Producer','สัญญา Session Musician',
  'ใบเสนอราคา','ใบแจ้งหนี้','เอกสารลิขสิทธิ์',
]
export const PRIORITY = { 'สูง':'#ff5a6e', 'กลาง':'#ffb020', 'ต่ำ':'#4aa8ff' }

export const EV_COLOR = { recording:'#7c5cff', meeting:'#4aa8ff', deadline:'#ff5a6e', release:'#3ddc91' }
export const EV_ICON  = { recording:'🎤', meeting:'💬', deadline:'🔥', release:'🚀' }
export const EV_LABEL = { recording:'อัดเพลง', meeting:'ประชุม', deadline:'Deadline', release:'Release' }

export const ROLES = {
  'Admin':       { label: 'Admin',       desc: 'จัดการทุกอย่างได้' },
  'Manager':     { label: 'Manager',     desc: 'ดู/แก้โปรเจกต์ ค่าใช้จ่าย ปฏิทิน' },
  'Team Member': { label: 'Team Member', desc: 'ดูงานตัวเอง อัปเดต task' },
  'Viewer':      { label: 'Viewer',      desc: 'ดูได้อย่างเดียว' },
}

// สิทธิ์ฝั่ง UI (RLS ใน DB คือด่านจริง — อันนี้ใช้ซ่อน/แสดงปุ่ม)
export const PERMS = {
  'Admin':       { projects:'edit', tasks:'edit', calendar:'edit', expenses:'edit', documents:'edit', users:'edit' },
  'Manager':     { projects:'edit', tasks:'edit', calendar:'edit', expenses:'edit', documents:'edit', users:'view' },
  'Team Member': { projects:'view', tasks:'edit', calendar:'view', expenses:'view', documents:'view', users:'view' },
  'Viewer':      { projects:'view', tasks:'view', calendar:'view', expenses:'view', documents:'view', users:'view' },
}
