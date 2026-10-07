import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FUND_CATS, PAY_METHODS } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

export default function FundTransactionForm({ onClose, onSaved }) {
  const { projects } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    date: todayISO(), direction: 'in', category: 'เติมเงินกองกลาง', amount: '',
    project_id: '', counterparty: '', method: 'โอนธนาคาร', note: '', evidence_path: '',
  })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const save = async () => {
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return toast('กรอกจำนวนเงินที่มากกว่า 0')
    setBusy(true)
    let uploadedEvidence = ''
    try {
      let evidence_path = form.evidence_path
      if (file) {
        evidence_path = await api.uploadFile(file, 'fund-evidence')
        uploadedEvidence = evidence_path
      }
      const row = {
        date: form.date,
        direction: form.direction,
        category: form.category,
        amount,
        project_id: form.project_id || null,
        counterparty: form.counterparty,
        method: form.method,
        note: form.note,
        evidence_path,
      }
      await api.createFundTransaction({ ...row, created_by: me.id })
      toast('บันทึกรายการเงินกองกลางแล้ว')
      onSaved()
    } catch (error) {
      if (uploadedEvidence) {
        try { await api.deleteFile(uploadedEvidence) } catch { /* keep original save error */ }
      }
      toast('ผิดพลาด: ' + error.message)
    } finally {
      setBusy(false)
    }
  }


  const incoming = form.direction === 'in'

  return (
    <Modal onClose={onClose}>
      <div className="modal-head">
        <h3>บันทึกรายการเงินกองกลาง</h3>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-grp"><label>ประเภทรายการ *</label>
            <select value={form.direction} onChange={(event) => set('direction', event.target.value)}>
              <option value="in">เงินเข้า</option>
              <option value="out">เงินออก</option>
            </select>
          </div>
          <div className="form-grp"><label>วันที่ *</label>
            <input type="date" value={form.date} onChange={(event) => set('date', event.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>จำนวนเงิน (บาท) *</label>
            <input type="number" min="0.01" step="0.01" value={form.amount} placeholder="0.00"
              onChange={(event) => set('amount', event.target.value)} />
          </div>
          <div className="form-grp"><label>หมวดหมู่</label>
            <select value={form.category} onChange={(event) => set('category', event.target.value)}>
              {FUND_CATS.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>โปรเจกต์เพลง (ถ้ามี)</label>
            <select value={form.project_id || ''} onChange={(event) => set('project_id', event.target.value)}>
              <option value="">ไม่ผูกกับโปรเจกต์</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </div>
          <div className="form-grp"><label>{incoming ? 'ที่มาของเงิน' : 'ผู้รับเงิน'}</label>
            <input value={form.counterparty} onChange={(event) => set('counterparty', event.target.value)} />
          </div>
        </div>
        <div className="form-grp"><label>วิธีรับ/จ่ายเงิน</label>
          <select value={form.method} onChange={(event) => set('method', event.target.value)}>
            {PAY_METHODS.map((method) => <option key={method}>{method}</option>)}
          </select>
        </div>
        <div className="form-grp"><label>หลักฐานการรับ/จ่ายเงิน</label>
          <label className="filedrop">
            {file ? `📎 ${file.name}` : (form.evidence_path ? `📎 ${form.evidence_path.split('/').pop()}` : '📎 คลิกเพื่ออัปโหลดไฟล์')}
            <input type="file" onChange={(event) => setFile(event.target.files[0])} />
          </label>
        </div>
        <div className="form-grp"><label>Note</label>
          <textarea value={form.note || ''} onChange={(event) => set('note', event.target.value)} />
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </Modal>
  )
}
