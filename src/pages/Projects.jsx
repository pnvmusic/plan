import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STAGES, TYPES, stage } from '../lib/constants'
import { thDate, daysBetween, todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Avatar, Badge, Progress } from '../components/ui'
import ProjectDetail from '../components/ProjectDetail'
import ProjectForm from '../components/ProjectForm'

export default function Projects() {
  const { projects, tasks, profiles, profile, projectProgress, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState({ q: '', status: '', owner: '', type: '' })
  const [detailId, setDetailId] = useState(null)
  const [formFor, setFormFor] = useState(undefined) // undefined=closed, null=new, id=edit
  const today = todayISO()

  // เปิดจาก query (?q= ค้นหา / ?open= เปิด detail)
  useEffect(() => {
    const q = params.get('q'); const open = params.get('open')
    if (q) setFilters((f) => ({ ...f, q }))
    if (open) setDetailId(open)
    if (q || open) { params.delete('q'); params.delete('open'); setParams(params, { replace: true }) }
  }, []) // eslint-disable-line

  const list = projects.filter((p) => {
    if (filters.q && !(p.title + p.artist + (p.note || '')).toLowerCase().includes(filters.q.toLowerCase())) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.owner && p.owner_id !== filters.owner) return false
    if (filters.type && p.type !== filters.type) return false
    return true
  }).sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))

  const editable = can('projects')
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const hasFilter = filters.q || filters.status || filters.owner || filters.type

  const removeProject = async (id) => {
    await api.deleteProject(id); await reload(); setDetailId(null); toast('ลบโปรเจกต์แล้ว')
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-box"><span>🔎</span>
          <input value={filters.q} placeholder="ค้นหาชื่อเพลง / ศิลปิน"
            onChange={(e) => set('q', e.target.value)} /></div>
        <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">ทุกประเภท</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.owner} onChange={(e) => set('owner', e.target.value)}>
          <option value="">ทุกผู้รับผิดชอบ</option>
          {profiles.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {hasFilter && <button className="btn btn-sm btn-ghost"
          onClick={() => setFilters({ q: '', status: '', owner: '', type: '' })}>✕ ล้าง</button>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{list.length} เพลง</span>
        {editable && <button className="btn btn-primary btn-sm" onClick={() => setFormFor(null)}>＋ เพิ่มเพลง</button>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))' }}>
        {list.length ? list.map((p) => {
          const pr = projectProgress(p.id), s = stage(p.status)
          const ts = tasks.filter((t) => t.project_id === p.id)
          const dd = daysBetween(today, p.deadline)
          const ddTxt = dd < 0 ? <span style={{ color: 'var(--danger)' }}>เลย {-dd} วัน</span>
            : (dd <= 7 && p.status !== 'Released') ? <span style={{ color: 'var(--warn)' }}>อีก {dd} วัน</span>
            : thDate(p.deadline)
          return (
            <div key={p.id} className="card clickable" style={{ cursor: 'pointer' }}
              onClick={() => setDetailId(p.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>{p.artist} · <span className="tag">{p.type}</span></div>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><Badge text={s.label} color={s.color} /></div>
              <Progress value={pr} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt-2)', margin: '6px 0 12px' }}>
                <span>{pr}% เสร็จ</span><span>{ts.filter((t) => t.done).length}/{ts.length} งาน</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Avatar user={profile(p.owner_id)} size={28} />
                <div style={{ fontSize: 11, color: 'var(--txt-2)', flex: 1 }}>
                  🚀 {thDate(p.release_date)} · 🔥 {ddTxt}
                </div>
                {p.refs?.length ? <span className="tag">📎 {p.refs.length}</span> : null}
              </div>
            </div>
          )
        }) : <div className="empty" style={{ gridColumn: '1/-1' }}><div className="ico">🎼</div>ไม่พบโปรเจกต์ที่ตรงเงื่อนไข</div>}
      </div>

      {detailId && <ProjectDetail id={detailId} onClose={() => setDetailId(null)}
        onEdit={(id) => { setDetailId(null); setFormFor(id) }} onDelete={removeProject} />}
      {formFor !== undefined && <ProjectForm id={formFor}
        onClose={() => setFormFor(undefined)} onSaved={() => { setFormFor(undefined); reload() }} />}
    </>
  )
}
