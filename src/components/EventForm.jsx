import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EV_LABEL } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal } from './ui'

// initial = string id (edit) | { date } (new)
export default function EventForm({ initial, onClose, onSaved }) {
  const { events, projects, profiles, reload } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const isEdit = typeof initial === 'string'
  const existing = isEdit ? events.find((e) => e.id === initial) : null
  const [f, setF] = useState(existing || {
    title: '', type: 'recording', date: initial?.date || todayISO(),
    time: '13:00', end_time: '', studio: '', project_id: projects[0]?.id || '',
    attendees: [me.id], note: '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const toggleAtt = (uid) => setF((s) => ({
    ...s, attendees: s.attendees.includes(uid) ? s.attendees.filter((a) => a !== uid) : [...s.attendees, uid],
  }))

  const save = async () => {
    if (!f.title.trim()) return toast('กรอกชื่อกิจกรรมก่อน')
    setBusy(true)
    try {
      const row = {
        title: f.title.trim(), type: f.type, date: f.date, time: f.time, end_time: f.end_time,
        studio: f.studio, project_id: f.project_id || null, attendees: f.attendees, note: f.note,
      }
      const saved = isEdit ? await api.updateEvent(initial, row) : await api.createEvent(row)
      try {
        await api.syncAppleEvent(isEdit ? 'update' : 'create', saved)
        toast(isEdit ? 'บันทึกแล้ว และ sync ไป Apple Calendar แล้ว' : 'เพิ่มนัดหมายแล้ว และ sync ไป Apple Calendar แล้ว')
      } catch (syncError) {
        toast((isEdit ? 'บันทึกแล้ว' : 'เพิ่มนัดหมายแล้ว') + ' แต่ sync Apple ไม่สำเร็จ: ' + syncError.message)
      }
      await reload(); onSaved()
    } catch (e) { toast('ผิดพลาด: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><h3>{isEdit ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย'}</h3>
        <div style={{ flex: 1 }} /><button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-grp"><label>ชื่อกิจกรรม *</label>
          <input value={f.title} placeholder="เช่น อัดเสียงร้อง" onChange={(e) => set('title', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-grp"><label>ประเภท</label>
            <select value={f.type} onChange={(e) => set('type', e.target.value)}>
              {Object.keys(EV_LABEL).map((k) => <option key={k} value={k}>{EV_LABEL[k]}</option>)}</select></div>
          <div className="form-grp"><label>วันที่</label>
            <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>เวลาเริ่ม</label>
            <input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></div>
          <div className="form-grp"><label>เวลาสิ้นสุด</label>
            <input type="time" value={f.end_time || ''} onChange={(e) => set('end_time', e.target.value)} /></div>
        </div>
        <div className="form-grp"><label>สถานที่ / Studio</label>
          <input value={f.studio} placeholder="เช่น Studio 28 ห้อง A" onChange={(e) => set('studio', e.target.value)} /></div>
        <div className="form-grp"><label>เพลงที่เกี่ยวข้อง</label>
          <select value={f.project_id || ''} onChange={(e) => set('project_id', e.target.value)}>
            <option value="">— ไม่ระบุ —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div className="form-grp"><label>ผู้เข้าร่วม</label>
          <div className="role-pills">
            {profiles.map((u) => (
              <div key={u.id} className={'role-pill' + (f.attendees.includes(u.id) ? ' on' : '')}
                onClick={() => toggleAtt(u.id)}>{u.name}</div>
            ))}</div></div>
        <div className="form-grp"><label>Note</label>
          <textarea value={f.note || ''} onChange={(e) => set('note', e.target.value)} /></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
