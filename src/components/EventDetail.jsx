import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { eventIcon, eventLabel, eventTitle } from '../lib/constants'
import { thDateLong } from '../lib/format'
import { Avatar, Modal, Linkify } from './ui'
import * as api from '../lib/api'

export default function EventDetail({ id, onClose, onEdit }) {
  const { events, project, profile, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const e = events.find((x) => x.id === id)
  if (!e) return null

  const openProject = () => {
    if (!e.project_id) return
    onClose()
    nav('/projects?open=' + e.project_id)
  }

  const remove = async () => {
    if (!window.confirm('ลบนัดหมายนี้?')) return
    let syncError = null
    try { await api.syncAppleEvent('delete', e) } catch (err) { syncError = err }
    await api.deleteEvent(id); await reload()
    toast(syncError ? 'ลบนัดหมายแล้ว แต่ลบใน Apple ไม่สำเร็จ: ' + syncError.message : 'ลบนัดหมายแล้ว และ sync ไป Apple Calendar แล้ว')
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><span style={{ fontSize: 20 }}>{eventIcon(e)}</span>
        <div style={{ flex: 1 }}><h3>{eventTitle(e)}</h3>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 2 }}>{eventLabel(e)}</div></div>
        {can('calendar') && <button className="btn btn-sm" onClick={() => onEdit(id)}>✏️</button>}
        {can('calendar') && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={remove}>🗑</button>}
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="kv"><span className="k">📅 วันที่</span><span>{thDateLong(e.date)}</span></div>
        <div className="kv"><span className="k">🕐 เวลา</span><span>{e.time}{e.end_time ? ' – ' + e.end_time : ''}</span></div>
        {e.studio && <div className="kv"><span className="k">📍 สถานที่</span><span>{e.studio}</span></div>}
        {e.project_id && <div className="kv"><span className="k">🎼 เพลง</span>
          <button type="button" className="btn btn-sm" onClick={openProject}>{project(e.project_id).title} →</button></div>}
        <div className="kv"><span className="k">👥 ผู้เข้าร่วม</span>
          <div className="av-stack">{(e.attendees || []).map((a) => <Avatar key={a} user={profile(a)} size={26} />)}</div></div>
        {e.note && <><div className="mini-label" style={{ marginTop: 12 }}>Note</div>
          <div style={{ fontSize: 13, marginTop: 5 }}><Linkify text={e.note} /></div></>}
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ปิด</button></div>
    </Modal>
  )
}
