import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { stage, EV_COLOR, EV_ICON } from '../lib/constants'
import { fmtMoney, daysBetween, thDate, todayISO } from '../lib/format'
import { Badge, Progress } from '../components/ui'

const Stat = ({ ico, color, val, label, trend }) => (
  <div className="stat">
    <div className="stat-ico" style={{ background: color + '22', color }}>{ico}</div>
    <div className="stat-val">{val}</div>
    <div className="stat-label">{label}</div>
    {trend}
  </div>
)

export default function Dashboard() {
  const nav = useNavigate()
  const { projects, tasks, events, expenses, projectProgress, profiles } = useData()
  const today = todayISO()

  const active = projects.filter((p) => p.status !== 'Released').length
  const released = projects.filter((p) => p.status === 'Released').length
  const nearDeadline = projects.filter((p) => p.status !== 'Released'
    && daysBetween(today, p.deadline) >= 0 && daysBetween(today, p.deadline) <= 7)
  const openTasks = tasks.filter((t) => !t.done).length
  const overdue = tasks.filter((t) => !t.done && daysBetween(today, t.deadline) < 0).length
  const totalSpent = expenses.filter((x) => x.status !== 'ยกเลิก').reduce((s, x) => s + Number(x.amount), 0)
  const pending = expenses.filter((x) => x.status === 'รอเบิก').reduce((s, x) => s + Number(x.amount), 0)
  const upcomingRec = events.filter((e) => e.type === 'recording' && daysBetween(today, e.date) >= 0).length

  const upcoming = events.filter((e) => daysBetween(today, e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)

  const costByProj = projects.map((p) => ({
    p, cost: expenses.filter((x) => x.project_id === p.id && x.status !== 'ยกเลิก')
      .reduce((s, x) => s + Number(x.amount), 0),
  })).filter((o) => o.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 5)
  const maxCost = Math.max(...costByProj.map((o) => o.cost), 1)

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <Stat ico="🎼" color="#7c5cff" val={active} label="เพลงที่กำลังทำอยู่"
          trend={<div className="stat-trend" style={{ color: 'var(--txt-2)' }}>จากทั้งหมด {projects.length} เพลง</div>} />
        <Stat ico="✅" color="#3ddc91" val={released} label="เพลงที่เสร็จแล้ว / ปล่อยแล้ว" />
        <Stat ico="🔥" color="#ff5a6e" val={nearDeadline.length} label="ใกล้ deadline (ภายใน 7 วัน)" />
        <Stat ico="📝" color="#4aa8ff" val={openTasks} label="งานที่ค้างอยู่"
          trend={overdue ? <div className="stat-trend" style={{ color: 'var(--danger)' }}>⚠ เลยกำหนด {overdue} งาน</div> : null} />
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <Stat ico="💰" color="#36d1b7" val={fmtMoney(totalSpent)} label="ค่าใช้จ่ายรวมทุกโปรเจกต์" />
        <Stat ico="🧾" color="#ff8e3c" val={fmtMoney(pending)} label="รอเบิก" />
        <Stat ico="🎤" color="#ff6f91" val={upcomingRec} label="นัดอัดที่กำลังจะมาถึง" />
        <Stat ico="👥" color="#9d86ff" val={profiles.length} label="สมาชิกในทีม" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-head"><h3>โปรเจกต์ที่กำลังดำเนินการ</h3><div className="spacer" />
            <button className="btn btn-sm" onClick={() => nav('/projects')}>ดูทั้งหมด →</button></div>
          <table className="table">
            <thead><tr><th>เพลง</th><th>สถานะ</th><th>Release / Deadline</th><th>Progress</th></tr></thead>
            <tbody>
              {projects.filter((p) => p.status !== 'Released')
                .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')).slice(0, 6).map((p) => {
                  const pr = projectProgress(p.id)
                  const dd = daysBetween(today, p.deadline)
                  const ddTxt = dd < 0 ? <span style={{ color: 'var(--danger)' }}>เลย {-dd} วัน</span>
                    : dd <= 7 ? <span style={{ color: 'var(--warn)' }}>อีก {dd} วัน</span>
                    : <>อีก {dd} วัน</>
                  const s = stage(p.status)
                  return (
                    <tr key={p.id} className="clickable" onClick={() => nav('/projects?open=' + p.id)}>
                      <td><div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{p.artist}</div></td>
                      <td><Badge text={s.label} color={s.color} /></td>
                      <td><div style={{ fontSize: 12 }}>🚀 {thDate(p.release_date)}</div>
                        <div style={{ fontSize: 12 }}>🔥 {thDate(p.deadline)}</div>
                        <div style={{ fontSize: 11 }}>{ddTxt}</div></td>
                      <td style={{ minWidth: 120 }}><Progress value={pr} />
                        <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 3 }}>{pr}%</div></td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-head"><h3>นัดหมายที่กำลังจะมาถึง</h3><div className="spacer" />
              <button className="btn btn-sm" onClick={() => nav('/calendar')}>ปฏิทิน →</button></div>
            {upcoming.length ? upcoming.map((e) => (
              <div key={e.id} className="list-row" style={{ cursor: 'pointer' }}
                onClick={() => nav('/calendar?open=' + e.id)}>
                <div className="stat-ico" style={{ width: 34, height: 34, margin: 0, fontSize: 15,
                  background: EV_COLOR[e.type] + '22', color: EV_COLOR[e.type] }}>{EV_ICON[e.type]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{thDate(e.date)} · {e.time}{e.studio ? ' · ' + e.studio : ''}</div>
                </div>
              </div>
            )) : <div className="empty"><div className="ico">📅</div>ยังไม่มีนัดหมาย</div>}
          </div>

          <div className="card">
            <div className="section-head"><h3>ค่าใช้จ่ายตามโปรเจกต์</h3></div>
            {costByProj.map((o) => (
              <div key={o.p.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{o.p.title}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtMoney(o.cost)}</span>
                </div>
                <Progress value={o.cost / maxCost * 100} gradient="linear-gradient(90deg,#36d1b7,#3ddc91)" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
