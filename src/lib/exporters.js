import { fmtMoney, thDate, thDateLong, todayISO } from './format'

// ---------- CSV (เปิดใน Excel ได้, มี BOM รองรับภาษาไทย) ----------
export function exportExpensesCSV(rows, project) {
  const head = ['วันที่', 'หมวดหมู่', 'โปรเจกต์', 'ผู้รับเงิน', 'วิธีจ่าย', 'สถานะ', 'จำนวนเงิน', 'Note']
  const lines = rows.map((x) => [
    x.date, x.category, project(x.project_id).title, x.vendor, x.method, x.status, x.amount,
    (x.note || '').replace(/,/g, ';'),
  ].map((v) => `"${v ?? ''}"`).join(','))
  const csv = [head.join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'expenses_pnvplan.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

// ---------- PDF (เปิดหน้าใหม่ + window.print) ----------
export function exportExpensesPDF(rows, project) {
  const total = rows.filter((x) => x.status !== 'ยกเลิก').reduce((s, x) => s + Number(x.amount), 0)
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
  <title>รายงานค่าใช้จ่าย pnvPlan</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai&display=swap" rel="stylesheet">
  <style>
    body{font-family:'IBM Plex Sans Thai',sans-serif;padding:30px;color:#222}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#666;font-size:13px;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ccc;padding:7px 9px;text-align:left}
    th{background:#f3f3f3}
    .r{text-align:right}
    .tot{font-size:16px;font-weight:700;margin-top:14px;text-align:right}
  </style></head><body>
  <h1>🎵 pnvPlan — รายงานค่าใช้จ่าย</h1>
  <div class="sub">วันที่ออกรายงาน: ${thDateLong(todayISO())}</div>
  <table><thead><tr>
    <th>วันที่</th><th>หมวด</th><th>โปรเจกต์</th><th>ผู้รับเงิน</th><th>วิธีจ่าย</th><th>สถานะ</th><th class="r">จำนวน</th>
  </tr></thead><tbody>
  ${rows.map((x) => `<tr><td>${thDate(x.date)}</td><td>${x.category}</td><td>${project(x.project_id).title}</td><td>${x.vendor || ''}</td><td>${x.method || ''}</td><td>${x.status}</td><td class="r">${fmtMoney(x.amount)}</td></tr>`).join('')}
  </tbody></table>
  <div class="tot">รวมทั้งสิ้น: ${fmtMoney(total)}</div>
  <script>setTimeout(()=>window.print(),500)<\/script>
  </body></html>`)
  w.document.close()
}
