import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EXP_CATS, EXP_STATUS } from '../lib/constants'
import { fmtMoney, thDate, thDateLong, todayISO } from '../lib/format'
import { Badge } from '../components/ui'
import ExpenseForm from '../components/ExpenseForm'
import { exportExpensesCSV, exportExpensesPDF } from '../lib/exporters'

export default function Expenses() {
  const { expenses, projects, project, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState({ cat: '', status: '', proj: '' })
  const [form, setForm] = useState(undefined)
  const editable = can('expenses')
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const list = expenses.filter((x) => {
    if (filters.cat && x.category !== filters.cat) return false
    if (filters.status && x.status !== filters.status) return false
    if (filters.proj && x.project_id !== filters.proj) return false
    return true
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const total = list.filter((x) => x.status !== 'ยกเลิก').reduce((s, x) => s + Number(x.amount), 0)
  const pending = list.filter((x) => x.status === 'รอเบิก').reduce((s, x) => s + Number(x.amount), 0)
  const paid = list.filter((x) => x.status === 'จ่ายแล้ว').reduce((s, x) => s + Number(x.amount), 0)

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[['💰', '#36d1b7', fmtMoney(total), 'รวม (ไม่นับยกเลิก)'],
          ['🧾', '#ffb020', fmtMoney(pending), 'รอเบิก'],
          ['✅', '#3ddc91', fmtMoney(paid), 'จ่ายแล้ว'],
          ['📋', '#4aa8ff', list.length, 'รายการทั้งหมด']].map(([ic, c, v, l]) => (
          <div key={l} className="stat"><div className="stat-ico" style={{ background: c + '22', color: c }}>{ic}</div>
            <div className="stat-val" style={{ fontSize: 22 }}>{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      <div className="toolbar">
        <select value={filters.cat} onChange={(e) => set('cat', e.target.value)}>
          <option value="">ทุกหมวด</option>{EXP_CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>{Object.keys(EXP_STATUS).map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.proj} onChange={(e) => set('proj', e.target.value)}>
          <option value="">ทุกโปรเจกต์</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={() => { exportExpensesCSV(list, project); toast('ดาวน์โหลด CSV แล้ว') }}>⬇ Excel (CSV)</button>
        <button className="btn btn-sm" onClick={() => { exportExpensesPDF(list, project); toast('เปิดหน้าพิมพ์ PDF') }}>⬇ PDF</button>
        {editable && <button className="btn btn-primary btn-sm" onClick={() => setForm(null)}>＋ บันทึกค่าใช้จ่าย</button>}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>วันที่</th><th>หมวด</th><th>โปรเจกต์</th><th>ผู้รับเงิน</th><th>วิธีจ่าย</th><th>สถานะ</th><th>หลักฐาน</th><th style={{ textAlign: 'right' }}>จำนวน</th></tr></thead>
          <tbody>
            {list.length ? list.map((x) => (
              <tr key={x.id} className={editable ? 'clickable' : ''} onClick={() => editable && setForm(x.id)}>
                <td style={{ whiteSpace: 'nowrap' }}>{thDate(x.date)}</td>
                <td><span className="tag">{x.category}</span></td>
                <td style={{ fontSize: 12 }}>{project(x.project_id).title}</td>
                <td style={{ fontSize: 12 }}>{x.vendor}</td>
                <td style={{ fontSize: 12 }}>{x.method}</td>
                <td><Badge text={x.status} color={EXP_STATUS[x.status]} /></td>
                <td>{x.receipt_path ? <span title={x.receipt_path}>📎</span> : <span style={{ color: 'var(--txt-3)' }}>—</span>}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, ...(x.status === 'ยกเลิก' ? { textDecoration: 'line-through', color: 'var(--txt-3)' } : {}) }}>{fmtMoney(x.amount)}</td>
              </tr>
            )) : <tr><td colSpan={8}><div className="empty"><div className="ico">💸</div>ไม่มีรายการ</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form !== undefined && <ExpenseForm id={form}
        onClose={() => setForm(undefined)} onSaved={() => { setForm(undefined); reload() }} />}
    </>
  )
}
