import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STAGES, TYPES, ARTISTS } from '../lib/constants'
import { shiftDateISO, todayISO } from '../lib/format'
import { normalizeReportAliases } from '../lib/projectAliases'
import * as api from '../lib/api'
import { Modal, parseRef } from './ui'

export default function ProjectForm({ id, onClose, onSaved }) {
  const { projects, profiles } = useData()
  const { profile: me } = useAuth()
  const toast = useToast()
  const existing = id ? projects.find((p) => p.id === id) : null
  const defaultReleaseDate = shiftDateISO(todayISO(), 14)
  const [f, setF] = useState(existing
    ? {
      ...existing,
      release_date: existing.release_date || shiftDateISO(existing.deadline, 14),
      report_aliases: existing.report_aliases || [],
    }
    : {
      title: '', artist: 'p n v .', type: 'Single', status: 'Idea',
      release_date: defaultReleaseDate, deadline: shiftDateISO(defaultReleaseDate, -14),
      owner_id: me.id, note: '', refs: [], report_aliases: [],
    })
  const [busy, setBusy] = useState(false)
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [aliasName, setAliasName] = useState('')
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const setReleaseDate = (v) => setF((s) => ({
    ...s,
    release_date: v,
    deadline: v ? shiftDateISO(v, -14) : '',
  }))

  const addLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    const ref = linkName.trim() ? `${linkName.trim()} — ${url}` : url
    setF((s) => ({ ...s, refs: [...(s.refs || []), ref] }))
    setLinkName(''); setLinkUrl('')
  }
  const refsWithPendingLink = () => {
    const url = linkUrl.trim()
    if (!url) return f.refs || []
    const ref = linkName.trim() ? `${linkName.trim()} — ${url}` : url
    return [...(f.refs || []), ref]
  }
  const removeLink = (i) =>
    setF((s) => ({ ...s, refs: (s.refs || []).filter((_, idx) => idx !== i) }))
  const addAlias = () => {
    const aliases = normalizeReportAliases(f.report_aliases, aliasName)
    if (aliases.length === (f.report_aliases || []).length) return
    setF((s) => ({ ...s, report_aliases: aliases }))
    setAliasName('')
  }
  const removeAlias = (i) =>
    setF((s) => ({ ...s, report_aliases: (s.report_aliases || []).filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!f.title.trim() || !f.artist.trim()) return toast('กรอกชื่อเพลงก่อน')
    setBusy(true)
    try {
      const row = {
        title: f.title.trim(), artist: f.artist.trim(), type: f.type, status: f.status,
        release_date: f.release_date || null, deadline: f.deadline || null,
        owner_id: f.owner_id, note: f.note || '', refs: refsWithPendingLink(),
        report_aliases: normalizeReportAliases(f.report_aliases, aliasName),
      }
      const saved = id ? await api.updateProject(id, row) : await api.createProject({ ...row, created_by: me.id })
      const baseMessage = id ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มเพลงใหม่แล้ว'
      toast(saved.appleSyncError
        ? `${baseMessage} แต่ sync Release ไป Apple ไม่สำเร็จ: ${saved.appleSyncError.message}`
        : f.release_date ? `${baseMessage} และ sync Release ไป Apple Calendar แล้ว` : baseMessage)
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
        <div className="form-grp"><label>ชื่อสำหรับจับคู่รายงาน</label>
          <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 7 }}>
            เพิ่มได้หลายชื่อ เช่น ชื่อใน YouTube Statement, Acoustic, Live หรือชื่อภาษาอังกฤษ
          </div>
          {f.report_aliases?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 9 }}>
              {f.report_aliases.map((alias, i) => (
                <span key={`${alias}-${i}`} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🔗 {alias}
                  <button type="button" onClick={() => removeAlias(i)}
                    style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={aliasName} placeholder="เช่น ชื่อเพลง (Acoustic Version)"
              onChange={(e) => setAliasName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAlias() } }} />
            <button type="button" className="btn btn-sm" onClick={addAlias}>＋ เพิ่มชื่อ</button>
          </div>
        </div>
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
          <div className="form-grp"><label>Release date</label>
            <input type="date" value={f.release_date || ''} onChange={(e) => setReleaseDate(e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-grp"><label>Deadline (14 วันก่อน Release)</label>
            <input type="date" value={f.deadline || ''} onChange={(e) => set('deadline', e.target.value)} /></div>
          <div className="form-grp"><label>ผู้รับผิดชอบ</label>
            <select value={f.owner_id || ''} onChange={(e) => set('owner_id', e.target.value)}>
              {profiles.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        </div>
        <div className="form-grp"><label>Note</label>
          <textarea value={f.note || ''} placeholder="รายละเอียดเพิ่มเติม หรือ [ชื่อไฟล์](https://drive.google.com/...)"
            onChange={(e) => set('note', e.target.value)} /></div>
        <div className="form-grp"><label>ลิงก์ไฟล์เพลง / Reference (YouTube, Google Drive, demo, lyrics, artwork)</label>
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
            <input style={{ flex: '2 1 180px' }} value={linkUrl} placeholder="วางลิงก์ เช่น YouTube หรือ Google Drive"
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
