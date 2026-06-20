import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { STAGES, PRIORITY } from '../lib/constants'
import * as api from '../lib/api'
import { Modal } from './ui'

export default function TaskForm({ id, onClose, onSaved }) {
  const { tasks, projects, profiles } = useData()
  const toast = useToast()
  const existing = id ? tasks.find((t) => t.id === id) : null
  const [f, setF] = useState(existing || {
    title: '', project_id: projects[0]?.id, stage: 'Recording',
    deadline: '2026-07-01', assignee_id: profiles[0]?.id, priority: 'กลาง',
  })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    if (!f.title.trim()) return toast('กรอกชื่องานก่อน')
    setBusy(true)
    try {
      const row = {
        title: f.title.trim(), project_id: f.project_id, stage: f.stage,
        deadline: f.deadline, assignee_id: f.assignee_id, priority: f.priority,
      }
      if (id) await api.updateTask(id, row)
      else await api.createTask({ ...row, done: false })
      toast(id ? 'บันทึกแล้ว' : 'เพิ่ม Task แล้ว'); onSaved()
    } catch (e) { toast('ผิดพลาด: ' + e.message) } finally { setBusy(false) }
  }
  const remove = async () => { await api.deleteTask(id); toast('ลบ Task แล้ว'); onSaved() }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>{id ? 'แก้ไข Task' : 'เพิ่ม Task'}</h3><div style={{ flex: 1 }} />
        {id && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={remove}>🗑 ลบ</button>}
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-grp"><label>ชื่องาน *</label>
          <input value={f.title} placeholder="เช่น มิกซ์เสียงร้องหลัก" onChange={(e) => set('title', e.target.value)} /></div>
        <div className="form-grp"><label>เพลงที่เกี่ยวข้อง</label>
          <select value={f.project_id} onChange={(e) => set('project_id', e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div className="form-row">
          <div className="form-grp"><label>ขั้นตอน (คอลัมน์)</label>
            <select value={f.stage} onChange={(e) => set('stage', e.target.value)}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
          <div className="form-grp"><label>ความสำคัญ</label>
            <select value={f.priority} onChange={(e) => set('priority', e.target.value)}>
              {Object.keys(PRIORITY).map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>ผู้รับผิดชอบ</label>
            <select value={f.assignee_id || ''} onChange={(e) => set('assignee_id', e.target.value)}>
              {profiles.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <div className="form-grp"><label>Deadline</label>
            <input type="date" value={f.deadline || ''} onChange={(e) => set('deadline', e.target.value)} /></div>
        </div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
