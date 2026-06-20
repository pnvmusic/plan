import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { BOARD_STAGES, stage, PRIORITY } from '../lib/constants'
import { thDate, daysBetween, todayISO } from '../lib/format'
import * as api from '../lib/api'
import { Avatar, Badge, Progress } from '../components/ui'
import TaskForm from '../components/TaskForm'
import ProjectDetail from '../components/ProjectDetail'

export default function Board() {
  const { projects, tasks, profile, projectProgress, setProjects, setTasks, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('project')
  const [drag, setDrag] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [taskForm, setTaskForm] = useState(undefined)
  const [detailId, setDetailId] = useState(null)
  const editable = can('tasks')
  const today = todayISO()

  const onDrop = async (newStage) => {
    if (!drag) return
    const { id, kind } = drag
    setDrag(null); setOverCol(null)
    if (kind === 'project') {
      setProjects((a) => a.map((p) => p.id === id ? { ...p, status: newStage } : p))
      await api.updateProject(id, { status: newStage })
    } else {
      setTasks((a) => a.map((t) => t.id === id ? { ...t, stage: newStage } : t))
      await api.updateTask(id, { stage: newStage })
    }
    toast('ย้ายไป "' + stage(newStage).label + '" แล้ว')
  }

  const toggle = async (t) => {
    if (!editable) return
    setTasks((a) => a.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))
    await api.updateTask(t.id, { done: !t.done })
  }

  return (
    <>
      <div className="toolbar">
        <div className="seg">
          <button className={mode === 'project' ? 'on' : ''} onClick={() => setMode('project')}>การ์ดเพลง</button>
          <button className={mode === 'task' ? 'on' : ''} onClick={() => setMode('task')}>การ์ดงาน (Task)</button>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{editable ? 'ลากการ์ดเพื่อย้ายสถานะ' : 'โหมดดูอย่างเดียว'}</span>
        {editable && mode === 'task' && <button className="btn btn-primary btn-sm" onClick={() => setTaskForm(null)}>＋ เพิ่ม Task</button>}
      </div>

      <div className="kanban">
        {BOARD_STAGES.map((sk) => {
          const s = stage(sk)
          const items = mode === 'project'
            ? projects.filter((p) => p.status === sk)
            : tasks.filter((t) => t.stage === sk)
          return (
            <div key={sk} className={'kcol' + (overCol === sk ? ' dragover' : '')}
              onDragOver={(e) => { e.preventDefault(); setOverCol(sk) }}
              onDragLeave={() => setOverCol((c) => c === sk ? null : c)}
              onDrop={() => onDrop(sk)}>
              <div className="kcol-head"><span className="dot" style={{ background: s.color }} />
                <span className="t">{s.label}</span><span className="kcol-count">{items.length}</span></div>
              <div className="kcol-body">
                {items.length === 0 && <div style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', padding: 14 }}>—</div>}
                {mode === 'project' ? items.map((p) => {
                  const pr = projectProgress(p.id)
                  const tn = tasks.filter((t) => t.project_id === p.id)
                  return (
                    <div key={p.id} className="kcard" draggable={editable}
                      onDragStart={() => setDrag({ id: p.id, kind: 'project' })}
                      onClick={() => setDetailId(p.id)}>
                      <div className="kcard-title">{p.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{p.artist} · {p.type}</div>
                      <div style={{ marginTop: 9 }}><Progress value={pr} /></div>
                      <div className="kcard-meta"><span>{pr}%</span>
                        {tn.length ? <span>· {tn.filter((t) => t.done).length}/{tn.length} งาน</span> : null}
                        <div style={{ flex: 1 }} /><Avatar user={profile(p.owner_id)} size={22} /></div>
                    </div>
                  )
                }) : items.map((t) => {
                  const dd = daysBetween(today, t.deadline)
                  return (
                    <div key={t.id} className="kcard" draggable={editable}
                      onDragStart={() => setDrag({ id: t.id, kind: 'task' })}
                      onClick={() => setTaskForm(t.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div className={'checkbox' + (t.done ? ' on' : '')}
                          onClick={(e) => { e.stopPropagation(); toggle(t) }}>{t.done ? '✓' : ''}</div>
                        <div className="kcard-title" style={{ flex: 1, ...(t.done ? { textDecoration: 'line-through', color: 'var(--txt-2)' } : {}) }}>{t.title}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4 }}>🎼 {projects.find((p) => p.id === t.project_id)?.title}</div>
                      <div className="kcard-meta"><Badge text={t.priority} color={PRIORITY[t.priority]} />
                        <span style={dd < 0 && !t.done ? { color: 'var(--danger)' } : {}}>📅 {thDate(t.deadline)}</span>
                        <div style={{ flex: 1 }} /><Avatar user={profile(t.assignee_id)} size={22} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {taskForm !== undefined && <TaskForm id={taskForm}
        onClose={() => setTaskForm(undefined)} onSaved={() => { setTaskForm(undefined); reload() }} />}
      {detailId && <ProjectDetail id={detailId} onClose={() => setDetailId(null)}
        onEdit={() => {}} onDelete={async (id) => { await api.deleteProject(id); reload(); setDetailId(null) }} />}
    </>
  )
}
