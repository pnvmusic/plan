import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FIN_CATS, FIN_ALL_STATUS, FIN_DIRECTIONS, FIN_DIR_COLOR } from '../lib/constants'
import { fmtMoney, thDate } from '../lib/format'
import { summarizeFinance } from '../lib/finance'
import { Badge, FilePreviewModal } from '../components/ui'
import FinanceForm from '../components/FinanceForm'
import { exportFinanceCSV, exportFinancePDF } from '../lib/exporters'

const ALL_CATS = [...new Set([...FIN_CATS.in, ...FIN_CATS.out])]

export default function Finance() {
  const { transactions, projects, project, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState({ direction: '', cat: '', status: '', proj: '' })
  const [form, setForm] = useState(undefined) // undefined = ปิด, { direction } = ใหม่, { id } = แก้ไข
  const [preview, setPreview] = useState(null)
  const editable = can('finance')
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const list = transactions.filter((x) => {
    if (filters.direction && x.direction !== filters.direction) return false
    if (filters.cat && x.category !== filters.cat) return false
    if (filters.status && x.status !== filters.status) return false
    if (filters.proj && x.project_id !== filters.proj) return false
    return true
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || ''))

  const all = summarizeFinance(transactions)
  const filtered = summarizeFinance(list)
  const isFiltered = Object.values(filters).some(Boolean)

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[
          ['🏦', '#7c5cff', fmtMoney(all.balance), 'ยอดคงเหลือ',
            all.pending ? `หลังจ่ายรายการรอเบิก: ${fmtMoney(all.balance - all.pending)}` : null],
          ['↘', '#3ddc91', fmtMoney(filtered.income), 'เงินเข้ารวม', null],
          ['↗', '#ff6f91', fmtMoney(filtered.expense), 'เงินออกรวม (ไม่นับยกเลิก)', null],
          ['🧾', '#ffb020', fmtMoney(filtered.pending), 'รอเบิก', null],
        ].map(([ic, c, v, l, sub]) => (
          <div key={l} className="stat">
            <div className="stat-ico" style={{ background: c + '22', color: c }}>{ic}</div>
            <div className="stat-val" style={{ fontSize: 22 }}>{v}</div>
            <div className="stat-label">{l}</div>
            {sub && <div className="stat-trend" style={{ color: 'var(--txt-2)' }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div className="toolbar">
        <select value={filters.direction} onChange={(e) => set('direction', e.target.value)}>
          <option value="">เงินเข้าและเงินออก</option>
          <option value="in">เงินเข้า</option>
          <option value="out">เงินออก</option>
        </select>
        <select value={filters.cat} onChange={(e) => set('cat', e.target.value)}>
          <option value="">ทุกหมวด</option>
          {(filters.direction ? FIN_CATS[filters.direction] : ALL_CATS).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>
          {Object.keys(FIN_ALL_STATUS).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.proj} onChange={(e) => set('proj', e.target.value)}>
          <option value="">ทุกโปรเจกต์</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={() => { exportFinanceCSV(list, project); toast('ดาวน์โหลด CSV แล้ว') }}>⬇ Excel (CSV)</button>
        <button className="btn btn-sm" onClick={() => { exportFinancePDF(list, project); toast('เปิดหน้าพิมพ์ PDF') }}>⬇ PDF</button>
        {editable && <>
          <button className="btn btn-sm" style={{ color: '#15966f' }} onClick={() => setForm({ direction: 'in' })}>＋ เงินเข้า</button>
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ direction: 'out' })}>＋ เงินออก</button>
        </>}
      </div>
      {isFiltered && <div style={{ fontSize: 12, color: 'var(--txt-2)', margin: '-4px 0 10px' }}>
        ยอดเงินเข้า/ออก/รอเบิกด้านบนคำนวณตามตัวกรอง · ยอดคงเหลือคิดจากทุกรายการ</div>}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวด</th><th>โปรเจกต์</th><th>ที่มา/ผู้รับ</th><th>วิธีรับ/จ่าย</th><th>สถานะ</th><th>หลักฐาน</th><th style={{ textAlign: 'right' }}>จำนวน</th></tr></thead>
          <tbody>
            {list.length ? list.map((x) => {
              const incoming = x.direction === 'in'
              const cancelled = x.status === 'ยกเลิก'
              return (
                <tr key={x.id} className={editable ? 'clickable' : ''} onClick={() => editable && setForm({ id: x.id })}>
                  <td style={{ whiteSpace: 'nowrap' }}>{thDate(x.date)}</td>
                  <td><Badge text={FIN_DIRECTIONS[x.direction]} color={FIN_DIR_COLOR[x.direction]} /></td>
                  <td><span className="tag">{x.category}</span></td>
                  <td style={{ fontSize: 12 }}>{x.project_id ? project(x.project_id).title : '—'}</td>
                  <td style={{ fontSize: 12 }}>{x.counterparty || '—'}</td>
                  <td style={{ fontSize: 12 }}>{x.method || '—'}</td>
                  <td><Badge text={x.status} color={FIN_ALL_STATUS[x.status] || '#6b768f'} /></td>
                  <td onClick={(e) => { if (x.evidence_path) { e.stopPropagation(); setPreview(x) } }}>
                    {x.evidence_path
                      ? <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} title="ดูหลักฐาน">📎 ดู</button>
                      : <span style={{ color: 'var(--txt-3)' }}>—</span>}
                  </td>
                  <td style={{
                    textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap',
                    ...(cancelled
                      ? { textDecoration: 'line-through', color: 'var(--txt-3)' }
                      : { color: incoming ? '#15966f' : 'var(--danger)' }),
                  }}>{incoming ? '+' : '−'}{fmtMoney(x.amount)}</td>
                </tr>
              )
            }) : <tr><td colSpan={9}><div className="empty"><div className="ico">💰</div>ไม่มีรายการ</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form !== undefined && <FinanceForm id={form.id} direction={form.direction}
        onClose={() => setForm(undefined)} onSaved={() => { setForm(undefined); reload() }} />}
      {preview && <FilePreviewModal path={preview.evidence_path}
        name={`หลักฐาน${FIN_DIRECTIONS[preview.direction]}_${preview.counterparty || preview.category}_${preview.date}`}
        onClose={() => setPreview(null)} />}
    </>
  )
}
