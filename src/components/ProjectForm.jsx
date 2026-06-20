import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STAGES, TYPES, ARTISTS } from '../lib/constants'
import { todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Modal, parseRef } from './ui'

export default function ProjectForm({ id, onClose, onSaved }) {
  const { projects, profiles } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const existing = id ? projects.find((p) => p.id === id) : null
  const [f, setF] = useState(existing || {
    title: '', artist: 'p n v .', type: 'Single', status: 'Idea',
    deadline: '2026-07-01', owner_id: me.id, note: '', refs: [],
  })
  const [busy, setBusy] = useState(false)
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const addLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    const ref = linkName.trim() ? `${linkName.trim()} — ${url}` : url
    setF((s) => ({ ...s, refs: [...(s.refs || []), ref] }))
    setLinkName(''); setLinkUrl('')
  }
  const removeLink = (i) =>
    setF((s) => ({ ...s, refs: (s.refs || []).filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!f.title.trim() || !f.artist.trim()) return toast('กรอกชื่อเพลงก่อน')
    setBusy(true)
    try {
      const row = {
        title: f.title.trim(), artist: f.artist.trim(), type: f.type, status: f.status,
        deadline: f.deadline, owner_id: f.owner_id, note: f.note || '', refs: f.refs || [],
      }
      if (id) await api.updateProject(id, row)
      else await api.createProject({ ...row, created_by: me.id })
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
          <div className="form-grp"><label>ศิลปิน</label>
            <select value={f.artist} onChange={(e) => set('artist', e.target.value)}>
              {ARTISTS.map((a) => <option key={a}>{a}</option>)}
            </select></div>
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
          <textarea value={f.note || ''} placeholder="รายละเอียดเพิ่มเติม หรือ [ชื่อไฟล์](https://drive.google.com/...)"
            onChange={(e) => set('note', e.target.value)} /></div>
        <div className="form-grp"><label>ลิงก์ไฟล์เพลง / Reference (Google Drive, demo, lyrics, artwork)</label>
          {f.refs?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 9 }}>
              {f.refs.map((r, i) => {
                const { label } = parseRef(r)
                return (
                  <span key={i} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    📎 {label}
                    <button type="button" onClick={() => removeLink(i)}
                      style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                  </span>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ flex: '1 1 120px' }} value={linkName} placeholder="ชื่อ (ไม่บังคับ)"
              onChange={(e) => setLinkName(e.target.value)} />
            <input style={{ flex: '2 1 180px' }} value={linkUrl} placeholder="วางลิงก์ เช่น https://drive.google.com/..."
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }} />
            <button type="button" className="btn btn-sm" onClick={addLink}>＋ เพิ่ม</button>
          </div></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
    </Modal>
  )
}
