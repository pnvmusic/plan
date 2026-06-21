import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { BOARD_STAGES, stage } from '../lib/constants'
import * as api from '../lib/api'
import { Avatar, Progress } from '../components/ui'
import ProjectDetail from '../components/ProjectDetail'
import ProjectForm from '../components/ProjectForm'

export default function Board() {
  const { projects, tasks, profile, projectProgress, setProjects, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [drag, setDrag] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [formFor, setFormFor] = useState(undefined) // undefined=ปิด, id=แก้ไข
  const canEditProjects = can('projects')

  const onDrop = async (newStage) => {
    if (!drag) return
    const { id } = drag
    setDrag(null); setOverCol(null)
    if (!canEditProjects) return
    setProjects((a) => a.map((p) => p.id === id ? { ...p, status: newStage } : p))
    await api.updateProject(id, { status: newStage })
    toast('ย้ายไป "' + stage(newStage).label + '" แล้ว')
  }

  const editProject = (id) => {
    if (!canEditProjects || !id) return
    setDetailId(null)
    setFormFor(id)
  }

  return (
    <>
      <div className="toolbar">
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{canEditProjects ? 'ลากการ์ดเพลงเพื่อย้ายสถานะ' : 'โหมดดูอย่างเดียว'}</span>
      </div>

      <div className="kanban">
        {BOARD_STAGES.map((sk) => {
          const s = stage(sk)
          const items = projects.filter((p) => p.status === sk)
          return (
            <div key={sk} className={'kcol' + (overCol === sk ? ' dragover' : '')}
              onDragOver={(e) => { e.preventDefault(); setOverCol(sk) }}
              onDragLeave={() => setOverCol((c) => c === sk ? null : c)}
              onDrop={() => onDrop(sk)}>
              <div className="kcol-head"><span className="dot" style={{ background: s.color }} />
                <span className="t">{s.label}</span><span className="kcol-count">{items.length}</span></div>
              <div className="kcol-body">
                {items.length === 0 && <div style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', padding: 14 }}>—</div>}
                {items.map((p) => {
                  const pr = projectProgress(p.id)
                  const tn = tasks.filter((t) => t.project_id === p.id)
                  return (
                    <div key={p.id} className="kcard" draggable={canEditProjects}
                      onDragStart={() => setDrag({ id: p.id })}
                      onClick={() => setDetailId(p.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="kcard-title">{p.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{p.artist} · {p.type}</div>
                        </div>
                        {canEditProjects && (
                          <button type="button" className="btn btn-sm btn-ghost" title="แก้ไขเพลง"
                            onClick={(e) => { e.stopPropagation(); editProject(p.id) }}>✏️</button>
                        )}
                      </div>
                      <div style={{ marginTop: 9 }}><Progress value={pr} /></div>
                      <div className="kcard-meta"><span>{pr}%</span>
                        {tn.length ? <span>· {tn.filter((t) => t.done).length}/{tn.length} งาน</span> : null}
                        <div style={{ flex: 1 }} /><Avatar user={profile(p.owner_id)} size={22} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {detailId && <ProjectDetail id={detailId} onClose={() => setDetailId(null)}
        onEdit={editProject}
        onDelete={async (id) => { await api.deleteProject(id); reload(); setDetailId(null) }} />}
      {formFor !== undefined && <ProjectForm id={formFor}
        onClose={() => setFormFor(undefined)} onSaved={() => { setFormFor(undefined); reload() }} />}
    </>
  )
}
