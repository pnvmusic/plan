// ฟังก์ชันช่วยจัดรูปแบบ + คำนวณ

export const fmtMoney = (n) => '฿' + Number(n || 0).toLocaleString('th-TH')

export const daysBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000)

export const thDate = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'

export const thDateLong = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

export const ymd = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const todayISO = () => ymd(new Date())

export const shiftDateISO = (iso, days) => {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() + days)
  return ymd(d)
}

export const initialsOf = (name = '') => (name.trim().slice(0, 2) || '?')
