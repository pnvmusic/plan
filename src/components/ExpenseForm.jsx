import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EXP_CATS, EXP_STATUS, PAY_METHODS } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

export default function ExpenseForm({ id, onClose, onSaved }) {
  const { expenses, projects } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const existing = id ? expenses.find((x) => x.id === id) : null
  const [f, setF] = useState(existing || {
    date: todayISO(), category: 'ค่า Studio', amount: '', project_id: projects[0]?.id || '',
    vendor: '', method: 'โอนธนาคาร', status: 'รอเบิก', note: '', receipt_path: '',
  })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    if (!Number(f.amount)) return toast('กรอกจำนวนเงินก่อน')
    setBusy(true)
    try {
      let receipt_path = f.receipt_path
      if (file) receipt_path = await api.uploadFile(file, 'receipts')
      const row = {
        date: f.date, category: f.category, amount: Number(f.amount), project_id: f.project_id || null,
        vendor: f.vendor, method: f.method, status: f.status, note: f.note, receipt_path,
      }
      if (id) await api.updateExpense(id, row)
      else await api.createExpense({ ...row, created_by: me.id })
      toast(id ? 'บันทึกแล้ว' : 'บันทึกค่าใช้จ่ายแล้ว'); onSaved()
    } catch (e) { toast('ผิดพลาด: ' + e.message) } finally { setBusy(false) }
  }
  const remove = async () => { await api.deleteExpense(id); toast('ลบรายการแล้ว'); onSaved() }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>{id ? 'แก้ไขค่าใช้จ่าย' : 'บันทึกค่าใช้จ่าย'}</h3><div style={{ flex: 1 }} />
        {id && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={remove}>🗑</button>}
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-grp"><label>วันที่จ่าย</label>
            <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div className="form-grp"><label>หมวดหมู่</label>
            <select value={f.category} onChange={(e) => set('category', e.target.value)}>{EXP_CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>จำนวนเงิน (บาท) *</label>
            <input type="number" value={f.amount} placeholder="0" onChange={(e) => set('amount', e.target.value)} /></div>
          <div className="form-grp"><label>โปรเจกต์เพลง</label>
            <select value={f.project_id || ''} onChange={(e) => set('project_id', e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>ผู้รับเงิน / Vendor</label>
            <input value={f.vendor} onChange={(e) => set('vendor', e.target.value)} /></div>
          <div className="form-grp"><label>วิธีจ่ายเงิน</label>
            <select value={f.method} onChange={(e) => set('method', e.target.value)}>{PAY_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="form-grp"><label>สถานะ</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}>{Object.keys(EXP_STATUS).map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="form-grp"><label>ใบเสร็จ / หลักฐานการโอน</label>
          <label className="filedrop">
            {file ? `📎 ${file.name}` : (f.receipt_path ? `📎 ${f.receipt_path.split('/').pop()}` : '📎 คลิกเพื่ออัปโหลดไฟล์')}
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
