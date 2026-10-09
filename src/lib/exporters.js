import { fmtMoney, thDate, thDateLong, todayISO } from './format'
import { summarizeFinance } from './finance'

const DIR_LABEL = { in: 'เงินเข้า', out: 'เงินออก' }
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const projectTitle = (project, id) => (id ? project(id).title : '—')

// ---------- CSV (เปิดใน Excel ได้, มี BOM รองรับภาษาไทย) ----------
export function exportFinanceCSV(rows, project) {
  const head = ['วันที่', 'ประเภท', 'หมวดหมู่', 'โปรเจกต์', 'ที่มา/ผู้รับเงิน', 'วิธีรับ/จ่าย', 'สถานะ', 'จำนวนเงิน', 'Note']
  const lines = rows.map((x) => [
    x.date, DIR_LABEL[x.direction], x.category, projectTitle(project, x.project_id), x.counterparty, x.method, x.status,
    (x.direction === 'out' ? -1 : 1) * Number(x.amount), x.note,
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  const csv = [head.join(','), ...lines].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'finance_pnvplan.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

// ---------- PDF (เปิดหน้าใหม่ + window.print) ----------
export function exportFinancePDF(rows, project) {
  const sum = summarizeFinance(rows)
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
  <title>รายงานการเงิน pnvPlan</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai&display=swap" rel="stylesheet">
  <style>
    body{font-family:'IBM Plex Sans Thai',sans-serif;padding:30px;color:#222}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#666;font-size:13px;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ccc;padding:7px 9px;text-align:left}
    th{background:#f3f3f3}
    .r{text-align:right}
    .in{color:#15966f}.out{color:#c0392b}.x{text-decoration:line-through;color:#999}
    .tot{font-size:14px;margin-top:14px;text-align:right;line-height:1.8}
    .tot b{font-size:16px}
  </style></head><body>
  <h1>🎵 pnvPlan — รายงานการเงิน</h1>
  <div class="sub">วันที่ออกรายงาน: ${thDateLong(todayISO())}</div>
  <table><thead><tr>
    <th>วันที่</th><th>ประเภท</th><th>หมวด</th><th>โปรเจกต์</th><th>ที่มา/ผู้รับ</th><th>วิธีรับ/จ่าย</th><th>สถานะ</th><th class="r">จำนวน</th>
  </tr></thead><tbody>
  ${rows.map((x) => `<tr><td>${thDate(x.date)}</td><td>${DIR_LABEL[x.direction]}</td><td>${esc(x.category)}</td><td>${esc(projectTitle(project, x.project_id))}</td><td>${esc(x.counterparty)}</td><td>${esc(x.method)}</td><td>${esc(x.status)}</td><td class="r ${x.status === 'ยกเลิก' ? 'x' : x.direction}">${x.direction === 'out' ? '−' : '+'}${fmtMoney(x.amount)}</td></tr>`).join('')}
  </tbody></table>
  <div class="tot">เงินเข้ารวม: ${fmtMoney(sum.income)} · เงินออกรวม: ${fmtMoney(sum.expense)} (รอเบิก ${fmtMoney(sum.pending)})<br>
  <b>ยอดคงเหลือ: ${fmtMoney(sum.balance)}</b></div>
  <script>setTimeout(()=>window.print(),500)<\/script>
  </body></html>`)
  w.document.close()
}
