import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FIN_CATS, FIN_STATUS, FIN_DEFAULT_STATUS, FIN_DIR_COLOR, PAY_METHODS } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

export default function FinanceForm({ id, direction = 'out', onClose, onSaved }) {
  const { transactions, projects } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const existing = id ? transactions.find((x) => x.id === id) : null
  const [f, setF] = useState(() => existing ? { ...existing } : {
    date: todayISO(), direction, category: FIN_CATS[direction][0], amount: '',
    project_id: '', counterparty: '', method: 'โอนธนาคาร',
    status: FIN_DEFAULT_STATUS[direction], note: '', evidence_path: '',
  })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const incoming = f.direction === 'in'

  // เปลี่ยนประเภท → รีเซ็ตหมวด/สถานะถ้าใช้กับประเภทใหม่ไม่ได้
  const setDirection = (dir) => setF((s) => ({
    ...s, direction: dir,
    category: FIN_CATS[dir].includes(s.category) ? s.category : FIN_CATS[dir][0],
    status: FIN_STATUS[dir][s.status] ? s.status : FIN_DEFAULT_STATUS[dir],
  }))

  // ถ้าหมวดเดิมไม่อยู่ในรายการ (ข้อมูลเก่า) ยังแสดงให้เลือกได้
  const cats = FIN_CATS[f.direction].includes(f.category) ? FIN_CATS[f.direction] : [f.category, ...FIN_CATS[f.direction]]

  const save = async () => {
    const amount = Number(f.amount)
    if (!Number.isFinite(amount) || amount <= 0) return toast('กรอกจำนวนเงินที่มากกว่า 0')
    setBusy(true)
    let uploaded = ''
    try {
      let evidence_path = f.evidence_path || ''
      if (file) {
        evidence_path = await api.uploadFile(file, incoming ? 'income-evidence' : 'receipts')
        uploaded = evidence_path
      }
      const row = {
        date: f.date, direction: f.direction, category: f.category, amount,
        project_id: f.project_id || null, counterparty: f.counterparty || '', method: f.method || '',
        status: f.status, note: f.note || '', evidence_path,
      }
      if (id) await api.updateTransaction(id, row)
      else await api.createTransaction({ ...row, created_by: me.id })
      toast(id ? 'บันทึกการแก้ไขแล้ว' : `บันทึก${incoming ? 'เงินเข้า' : 'เงินออก'}แล้ว`)
      onSaved()
    } catch (e) {
      if (uploaded) { try { await api.deleteFile(uploaded) } catch { /* keep original error */ } }
      toast('ผิดพลาด: ' + e.message)
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!window.confirm('ลบรายการนี้?')) return
    try { await api.deleteTransaction(id); toast('ลบรายการแล้ว'); onSaved() }
    catch (e) { toast('ผิดพลาด: ' + e.message) }
  }

  const dirBtn = (dir, label) => {
    const active = f.direction === dir
    return (
      <button type="button" className="btn" onClick={() => setDirection(dir)}
        style={{ flex: 1, justifyContent: 'center', fontWeight: 600,
          ...(active ? { background: FIN_DIR_COLOR[dir] + '22', borderColor: FIN_DIR_COLOR[dir], color: dir === 'in' ? '#15966f' : 'var(--danger)' } : {}) }}>
        {label}
      </button>
    )
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>{id ? 'แก้ไขรายการการเงิน' : 'บันทึกรายการการเงิน'}</h3><div style={{ flex: 1 }} />
        {id && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={remove}>🗑</button>}
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-grp"><label>ประเภทรายการ *</label>
          <div style={{ display: 'flex', gap: 8 }}>{dirBtn('in', '↘ เงินเข้า')}{dirBtn('out', '↗ เงินออก')}</div></div>
        <div className="form-row">
          <div className="form-grp"><label>วันที่ *</label>
            <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div className="form-grp"><label>จำนวนเงิน (บาท) *</label>
            <input type="number" min="0.01" step="0.01" value={f.amount} placeholder="0.00"
              onChange={(e) => set('amount', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>หมวดหมู่</label>
            <select value={f.category} onChange={(e) => set('category', e.target.value)}>
              {cats.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="form-grp"><label>โปรเจกต์เพลง (ถ้ามี)</label>
            <select value={f.project_id || ''} onChange={(e) => set('project_id', e.target.value)}>
              <option value="">ไม่ผูกกับโปรเจกต์</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>{incoming ? 'ที่มาของเงิน' : 'ผู้รับเงิน / Vendor'}</label>
            <input value={f.counterparty || ''} onChange={(e) => set('counterparty', e.target.value)} /></div>
          <div className="form-grp"><label>{incoming ? 'วิธีรับเงิน' : 'วิธีจ่ายเงิน'}</label>
            <select value={f.method || ''} onChange={(e) => set('method', e.target.value)}>
              {(PAY_METHODS.includes(f.method) || !f.method ? PAY_METHODS : [f.method, ...PAY_METHODS]).map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="form-grp"><label>สถานะ</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}>
            {Object.keys(FIN_STATUS[f.direction]).map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="form-grp"><label>{incoming ? 'หลักฐานการรับเงิน' : 'ใบเสร็จ / หลักฐานการโอน'}</label>
          <label className="filedrop">
            {file ? `📎 ${file.name}` : (f.evidence_path ? `📎 ${f.evidence_path.split('/').pop()}` : '📎 คลิกเพื่ออัปโหลดไฟล์')}
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </label></div>
        <div className="form-grp"><label>Note</label>
          <textarea value={f.note || ''} onChange={(e) => set('note', e.target.value)} /></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
