import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { stage, PRIORITY, EV_ICON } from '../lib/constants'
import { fmtMoney, thDate, thDateLong } from '../lib/format'
import { Avatar, Badge, Progress, Modal, Linkify, parseRef } from './ui'
import TaskForm from './TaskForm'
import * as api from '../lib/api'

export default function ProjectDetail({ id, onClose, onEdit, onDelete }) {
  const { projects, tasks, expenses, documents, events, profile, projectProgress, setTasks, reload } = useData()
  const { can } = useAuth()
  const [taskForm, setTaskForm] = useState(undefined)
  const p = projects.find((x) => x.id === id)
  if (!p) return null

  const pr = projectProgress(id)
  const ts = tasks.filter((t) => t.project_id === id)
  const exp = expenses.filter((x) => x.project_id === id && x.status !== 'ยกเลิก')
  const docs = documents.filter((d) => d.project_id === id)
  const evs = events.filter((e) => e.project_id === id)
  const cost = exp.reduce((s, x) => s + Number(x.amount), 0)
  const s = stage(p.status)

  const toggle = async (t) => {
    if (!can('tasks')) return
    setTasks((arr) => arr.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))
    await api.updateTask(t.id, { done: !t.done })
  }

  return (
    <Modal size="lg" onClose={onClose}>
      <div className="modal-head">
        <div style={{ flex: 1 }}>
          <h3>{p.title}</h3>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 3 }}>{p.artist} · {p.type}</div>
        </div>
        {can('projects') && <button className="btn btn-sm" onClick={() => onEdit(id)}>✏️ แก้ไข</button>}
        {can('projects') && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}
          onClick={() => window.confirm('ลบโปรเจกต์นี้?') && onDelete(id)}>🗑</button>}
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <Badge text={s.label} color={s.color} />
          <div style={{ flex: 1, minWidth: 120 }}><Progress value={pr} /></div>
          <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{pr}%</span>
        </div>
        <div className="form-row" style={{ marginBottom: 8 }}>
          <div><div className="mini-label">ผู้รับผิดชอบ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Avatar user={profile(p.owner_id)} size={28} /><span style={{ fontSize: 13 }}>{profile(p.owner_id).name}</span></div></div>
          <div><div className="mini-label">Release date</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>🚀 {thDateLong(p.release_date)}</div></div>
          <div><div className="mini-label">Deadline</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>📅 {thDateLong(p.deadline)}</div></div>
        </div>
        {p.note && <><div className="mini-label" style={{ marginTop: 14 }}>Note</div>
          <div style={{ fontSize: 13, marginTop: 5 }}><Linkify text={p.note} /></div></>}

        <div className="mini-label" style={{ marginTop: 18 }}>ลิงก์ไฟล์ / Reference ({p.refs?.length || 0})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
          {p.refs?.length ? p.refs.map((r, i) => {
            const { label, url } = parseRef(r)
            return url
              ? <a key={i} className="tag" href={url} target="_blank" rel="noreferrer">📎 {label}</a>
              : <span key={i} className="tag">📎 {label}</span>
          }) : <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>— ไม่มี</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 18 }}>
          <div className="stat" style={{ padding: 12 }}><div className="stat-val" style={{ fontSize: 18 }}>{ts.filter((t) => t.done).length}/{ts.length}</div><div className="stat-label">งานเสร็จ</div></div>
          <div className="stat" style={{ padding: 12 }}><div className="stat-val" style={{ fontSize: 18 }}>{fmtMoney(cost)}</div><div className="stat-label">ค่าใช้จ่าย</div></div>
          <div className="stat" style={{ padding: 12 }}><div className="stat-val" style={{ fontSize: 18 }}>{docs.length}</div><div className="stat-label">เอกสาร</div></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <div className="mini-label">งาน (Tasks)</div>
          <div style={{ flex: 1 }} />
          {can('tasks') && <button className="btn btn-sm" onClick={() => setTaskForm(null)}>＋ เพิ่ม Task</button>}
        </div>
        {ts.length > 0 ? <>
          {ts.map((t) => (
            <div key={t.id} className="list-row" style={{ cursor: can('tasks') ? 'pointer' : 'default' }}
              onClick={() => can('tasks') && setTaskForm(t.id)}>
              <div className={'checkbox' + (t.done ? ' on' : '')}
                onClick={(e) => { e.stopPropagation(); toggle(t) }}>{t.done ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, ...(t.done ? { textDecoration: 'line-through', color: 'var(--txt-2)' } : {}) }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{stage(t.stage).label} · 📅 {thDate(t.deadline)}</div>
              </div>
              <Badge text={t.priority} color={PRIORITY[t.priority]} />
              <Avatar user={profile(t.assignee_id)} size={24} />
            </div>
          ))}
        </> : <div className="empty" style={{ marginTop: 8 }}><div className="ico">🧾</div>ยังไม่มี Task ในเพลงนี้</div>}

        {evs.length > 0 && <>
          <div className="mini-label" style={{ marginTop: 18 }}>นัดหมายที่เกี่ยวข้อง</div>
          {evs.map((e) => (
            <div key={e.id} className="list-row"><span>{EV_ICON[e.type]}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{thDate(e.date)} {e.time}</div></div></div>
          ))}
        </>}
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ปิด</button></div>
      {taskForm !== undefined && <TaskForm id={taskForm}
        initialProjectId={id}
        lockProject
        onClose={() => setTaskForm(undefined)}
        onSaved={() => { setTaskForm(undefined); reload() }} />}
    </Modal>
  )
}
