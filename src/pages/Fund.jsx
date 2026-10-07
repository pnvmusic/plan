import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { fmtMoney, thDate } from '../lib/format'
import { summarizeFundTransactions } from '../lib/fund'
import { Badge, FilePreviewModal } from '../components/ui'
import FundTransactionForm from '../components/FundTransactionForm'

export default function Fund() {
  const { fundTransactions, projects, project, reload } = useData()
  const { can } = useAuth()
  const [filters, setFilters] = useState({ direction: '', project: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const editable = can('fund')
  const summary = summarizeFundTransactions(fundTransactions)

  const list = fundTransactions.filter((item) => {
    if (filters.direction && item.direction !== filters.direction) return false
    if (filters.project && item.project_id !== filters.project) return false
    return true
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[
          ['🏦', '#7c5cff', fmtMoney(summary.balance), 'ยอดเงินกองกลาง'],
          ['↘', '#3ddc91', fmtMoney(summary.income), 'เงินเข้ารวม'],
          ['↗', '#ff6f91', fmtMoney(summary.withdrawals), 'เงินออกจากกองกลาง'],
          ['📋', '#4aa8ff', summary.count, 'รายการทั้งหมด'],
        ].map(([icon, color, value, label]) => (
          <div key={label} className="stat">
            <div className="stat-ico" style={{ background: color + '22', color }}>{icon}</div>
            <div className="stat-val" style={{ fontSize: 22 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <select value={filters.direction}
          onChange={(event) => setFilters((current) => ({ ...current, direction: event.target.value }))}>
          <option value="">เงินเข้าและเงินออก</option>
          <option value="in">เงินเข้า</option>
          <option value="out">เงินออก</option>
        </select>
        <select value={filters.project}
          onChange={(event) => setFilters((current) => ({ ...current, project: event.target.value }))}>
          <option value="">ทุกโปรเจกต์</option>
          {projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        {editable && <button className="btn btn-primary btn-sm" onClick={() => setFormOpen(true)}>＋ บันทึกเงินเข้า/ออก</button>}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวด</th><th>โปรเจกต์</th><th>ที่มา/ผู้รับ</th><th>วิธีรับ/จ่าย</th><th>หลักฐาน</th><th style={{ textAlign: 'right' }}>จำนวน</th></tr></thead>
          <tbody>
            {list.length ? list.map((item) => {
              const incoming = item.direction === 'in'
              return (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{thDate(item.date)}</td>
                  <td><Badge text={incoming ? 'เงินเข้า' : 'เงินออก'} color={incoming ? '#3ddc91' : '#ff6f91'} /></td>
                  <td><span className="tag">{item.category}</span></td>
                  <td style={{ fontSize: 12 }}>{item.project_id ? project(item.project_id).title : '—'}</td>
                  <td style={{ fontSize: 12 }}>{item.counterparty || '—'}</td>
                  <td style={{ fontSize: 12 }}>{item.method || '—'}</td>
                  <td onClick={(event) => {
                    if (item.evidence_path) {
                      event.stopPropagation()
                      setPreview(item)
                    }
                  }}>
                    {item.evidence_path
                      ? <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }}>📎 ดู</button>
                      : <span style={{ color: 'var(--txt-3)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: incoming ? '#15966f' : 'var(--danger)' }}>
                    {incoming ? '+' : '−'}{fmtMoney(item.amount)}
                  </td>
                </tr>
              )
            }) : <tr><td colSpan={8}><div className="empty"><div className="ico">🏦</div>ยังไม่มีรายการเงินกองกลาง</div></td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && <FundTransactionForm
        onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload() }} />}
      {preview && <FilePreviewModal path={preview.evidence_path}
        name={`หลักฐานเงินกองกลาง_${preview.date}`} onClose={() => setPreview(null)} />}
    </>
  )
}
