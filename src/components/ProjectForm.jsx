import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STAGES, TYPES } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

export default function ProjectForm({ id, onClose, onSaved }) {
  const { projects, profiles } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const existing = id ? projects.find((p) => p.id === id) : null
  const [f, setF] = useState(existing || {
    title: '', artist: '', type: 'Single', status: 'Idea',
    deadline: '2026-07-01', owner_id: me.id, note: '', refs: [],
  })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    if (!f.title.trim() || !f.artist.trim()) return toast('กรอกชื่อเพลงและศิลปินก่อน')
    setBusy(true)
    try {
      const row = {
        title: f.title.trim(), artist: f.artist.trim(), type: f.type, status: f.status,
        deadline: f.deadline, owner_id: f.owner_id, note: f.note || '',
      }
      if (id) await api.updateProject(id, row)
      else await api.createProject({ ...row, refs: [], created_by: me.id })
      toast(id ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มเพลงใหม่แล้ว')
      onSaved()
    } catch (e) { toast('ผิดพลาด: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>{id ? 'แก้ไขเพลง' : 'เพิ่มเพลงใหม่'}</h3>
        <div style={{ flex: 1 }} /><button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-grp"><label>ชื่อเพลง *</label>
          <input value={f.title} placeholder="เช่น แสงสุดท้าย" onChange={(e) => set('title', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-grp"><label>ศิลปิน *</label>
            <input value={f.artist} onChange={(e) => set('artist', e.target.value)} /></div>
          <div className="form-grp"><label>ประเภทงาน</label>
            <select value={f.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>สถานะ</label>
            <select value={f.status} onChange={(e) => set('status', e.target.value)}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
          <div className="form-grp"><label>Deadline</label>
            <input type="date" value={f.deadline || ''} onChange={(e) => set('deadline', e.target.value)} /></div>
        </div>
        <div className="form-grp"><label>ผู้รับผิดชอบ</label>
          <select value={f.owner_id || ''} onChange={(e) => set('owner_id', e.target.value)}>
            {profiles.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div className="form-grp"><label>Note</label>
          <textarea value={f.note || ''} placeholder="รายละเอียดเพิ่มเติม..." onChange={(e) => set('note', e.target.value)} /></div>
        <div className="form-grp"><label>ไฟล์ Reference (demo, lyrics, guide vocal, artwork)</label>
          <div className="filedrop">📎 ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด
            <div style={{ fontSize: 11, marginTop: 4 }}>ไฟล์เดิม: {f.refs?.join(', ') || 'ไม่มี'}</div></div></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
