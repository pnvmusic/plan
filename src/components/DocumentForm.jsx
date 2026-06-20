import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DOC_TYPES } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

const humanSize = (bytes) => {
  if (!bytes) return '—'
  const kb = bytes / 1024
  return kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'
}

export default function DocumentForm({ onClose, onSaved }) {
  const { projects } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ name: '', type: DOC_TYPES[0], project_id: '', note: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    const name = f.name.trim() || file?.name || 'เอกสารใหม่.pdf'
    setBusy(true)
    try {
      let file_path = ''
      if (file) file_path = await api.uploadFile(file, 'documents')
      await api.createDocument({
        name, type: f.type, project_id: f.project_id || null, file_path,
        size: humanSize(file?.size), note: f.note, uploaded_by: me.id, uploaded_at: todayISO(),
      })
      toast('อัปโหลดเอกสารแล้ว'); onSaved()
    } catch (e) { toast('ผิดพลาด: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>อัปโหลดเอกสาร</h3><div style={{ flex: 1 }} />
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-grp"><label>ไฟล์เอกสาร</label>
          <label className="filedrop">
            {file ? `📎 ${file.name} (${humanSize(file.size)})` : '📎 คลิกเพื่ออัปโหลด — PDF, DOCX, รูปภาพ'}
            <input type="file" onChange={(e) => { setFile(e.target.files[0]); if (!f.name) set('name', e.target.files[0]?.name || '') }} />
          </label></div>
        <div className="form-grp"><label>ชื่อไฟล์</label>
          <input value={f.name} placeholder="เช่น สัญญาจ้างทำเพลง.pdf" onChange={(e) => set('name', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-grp"><label>ประเภทเอกสาร</label>
            <select value={f.type} onChange={(e) => set('type', e.target.value)}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="form-grp"><label>โปรเจกต์ (ไม่บังคับ)</label>
            <select value={f.project_id || ''} onChange={(e) => set('project_id', e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select></div>
        </div>
        <div className="form-grp"><label>Note</label>
          <textarea value={f.note} placeholder="เช่น เซ็นครบแล้ว" onChange={(e) => set('note', e.target.value)} /></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
