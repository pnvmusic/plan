import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { EV_COLOR, EV_ICON, EV_LABEL } from '../lib/constants'
import { thDate, thDateLong, ymd, todayISO } from '../lib/format'
import { getAppleCalendarEvents } from '../lib/ical'
import { Linkify, Modal } from '../components/ui'
import EventDetail from '../components/EventDetail'
import EventForm from '../components/EventForm'

const DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const APPLE_COLOR = '#CB30E0'
const APPLE_ICON = '☁️'
const APPLE_LABEL = 'Apple Calendar'

const evColor = (e) => e.external ? APPLE_COLOR : EV_COLOR[e.type]
const evIcon = (e) => e.external ? APPLE_ICON : EV_ICON[e.type]

export default function Calendar() {
  const { events } = useData()
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(todayISO())
  const [detailId, setDetailId] = useState(null)
  const [externalDetail, setExternalDetail] = useState(null)
  const [appleEvents, setAppleEvents] = useState([])
  const [appleState, setAppleState] = useState({ loading: true, error: '' })
  const [form, setForm] = useState(undefined) // undefined=closed; {} or {date} = new; id string = edit
  const today = todayISO()

  useEffect(() => {
    const open = params.get('open')
    if (open) { setDetailId(open); params.delete('open'); setParams(params, { replace: true }) }
  }, []) // eslint-disable-line

  useEffect(() => {
    let alive = true
    setAppleState({ loading: true, error: '' })
    getAppleCalendarEvents()
      .then((items) => {
        if (!alive) return
        setAppleEvents(items)
        setAppleState({ loading: false, error: '' })
      })
      .catch((e) => {
        if (!alive) return
        setAppleEvents([])
        setAppleState({ loading: false, error: e.message || 'โหลดปฏิทิน Apple ไม่สำเร็จ' })
      })
    return () => { alive = false }
  }, [])

  const evOn = (ds) => [...events, ...appleEvents]
    .filter((e) => e.date === ds)
    .sort((a, b) => ((a.time || '00:00') + a.title).localeCompare((b.time || '00:00') + b.title))

  const openEvent = (e) => e.external ? setExternalDetail(e) : setDetailId(e.id)

  const nav = (dir) => {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else d.setDate(d.getDate() + dir)
    setCursor(ymd(d))
  }

  const c = new Date(cursor)
  let label = ''
  if (view === 'month') label = c.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  else if (view === 'week') {
    const st = new Date(c); st.setDate(c.getDate() - c.getDay())
    const en = new Date(st); en.setDate(st.getDate() + 6)
    label = `${thDate(ymd(st))} – ${thDate(ymd(en))}`
  } else label = thDateLong(cursor)

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-sm" onClick={() => nav(-1)}>‹</button>
        <button className="btn btn-sm" onClick={() => setCursor(today)}>วันนี้</button>
        <button className="btn btn-sm" onClick={() => nav(1)}>›</button>
        <div style={{ fontWeight: 600, fontSize: 15, marginLeft: 6 }}>{label}</div>
        <div style={{ flex: 1 }} />
        <div className="seg">
          <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>เดือน</button>
          <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>สัปดาห์</button>
          <button className={view === 'day' ? 'on' : ''} onClick={() => setView('day')}>วัน</button>
        </div>
        {can('calendar') && <button className="btn btn-primary btn-sm" onClick={() => setForm({ date: cursor })}>＋ เพิ่มนัด</button>}
      </div>

      <div className="card">
        {view === 'month' && <MonthView c={c} today={today} evOn={evOn}
          onOpen={openEvent} onAdd={(ds) => can('calendar') && setForm({ date: ds })} />}
        {view === 'week' && <WeekView c={c} today={today} evOn={evOn}
          onOpen={openEvent} onAdd={(ds) => can('calendar') && setForm({ date: ds })} />}
        {view === 'day' && <DayView ds={cursor} evOn={evOn} onOpen={openEvent} />}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--txt-2)', flexWrap: 'wrap' }}>
        {Object.keys(EV_COLOR).map((k) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: EV_COLOR[k] }} />{EV_LABEL[k]}</span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="dot" style={{ background: APPLE_COLOR }} />{APPLE_LABEL}
          {appleState.loading ? ' (กำลังโหลด...)' : appleState.error ? ' (โหลดไม่สำเร็จ)' : ` (${appleEvents.length})`}
        </span>
      </div>
      {appleState.error && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warn)' }}>{appleState.error}</div>}

      {detailId && <EventDetail id={detailId} onClose={() => setDetailId(null)}
        onEdit={(id) => { setDetailId(null); setForm(id) }} />}
      {externalDetail && <ExternalEventDetail event={externalDetail} onClose={() => setExternalDetail(null)} />}
      {form !== undefined && <EventForm initial={form}
        onClose={() => setForm(undefined)} onSaved={() => setForm(undefined)} />}
    </>
  )
}

function MonthView({ c, today, evOn, onOpen, onAdd }) {
  const first = new Date(c.getFullYear(), c.getMonth(), 1)
  const start = new Date(first); start.setDate(1 - first.getDay())
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const ds = ymd(d), dim = d.getMonth() !== c.getMonth(), isToday = ds === today
    const evs = evOn(ds)
    cells.push(
      <div key={i} className={'cal-cell' + (dim ? ' dim' : '') + (isToday ? ' today' : '')}
        onDoubleClick={() => onAdd(ds)}>
        <span className="cal-num">{d.getDate()}</span>
        {evs.slice(0, 3).map((e) => (
          <button key={e.id} className="cal-ev" style={{ background: evColor(e) + '22', color: evColor(e) }}
            onClick={() => onOpen(e)}>{evIcon(e)} {e.time} {e.title}</button>
        ))}
        {evs.length > 3 && <div style={{ fontSize: 10, color: 'var(--txt-2)' }}>+{evs.length - 3} เพิ่มเติม</div>}
      </div>
    )
  }
  return <div className="cal-grid">{DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}{cells}</div>
}

function WeekView({ c, today, evOn, onOpen, onAdd }) {
  const start = new Date(c); start.setDate(c.getDate() - c.getDay())
  const cells = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const ds = ymd(d), evs = evOn(ds), isToday = ds === today
    cells.push(
      <div key={i} className={'cal-cell' + (isToday ? ' today' : '')} style={{ minHeight: 300 }}
        onDoubleClick={() => onAdd(ds)}>
        <div style={{ fontSize: 11, color: 'var(--txt-2)', textAlign: 'center', marginBottom: 4 }}>{DOW[i]} {d.getDate()}</div>
        {evs.map((e) => (
          <button key={e.id} className="cal-ev" style={{ background: evColor(e) + '22', color: evColor(e), whiteSpace: 'normal' }}
            onClick={() => onOpen(e)}>{e.time} {evIcon(e)}<br />{e.title}</button>
        ))}
      </div>
    )
  }
  return <div className="cal-grid">{cells}</div>
}

function DayView({ ds, evOn, onOpen }) {
  const { profile } = useData()
  const evs = evOn(ds)
  if (!evs.length) return <div className="empty"><div className="ico">📅</div>ไม่มีนัดหมายในวันนี้</div>
  return evs.map((e) => (
    <div key={e.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => onOpen(e)}>
      <div style={{ width: 60, fontWeight: 600, fontSize: 13 }}>{e.time}</div>
      <div className="stat-ico" style={{ width: 36, height: 36, margin: 0, background: evColor(e) + '22', color: evColor(e) }}>{evIcon(e)}</div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
        <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>{e.external ? (e.location || APPLE_LABEL) : (e.studio || '—')}</div></div>
      {!e.external && <div className="av-stack">{(e.attendees || []).map((a) => (
        <div key={a} className="avatar" style={{ width: 26, height: 26, fontSize: 10, background: profile(a).color }}>{profile(a).initials}</div>
      ))}</div>}
    </div>
  ))
}

function ExternalEventDetail({ event, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><span style={{ fontSize: 20 }}>{APPLE_ICON}</span>
        <div style={{ flex: 1 }}><h3>{event.title}</h3>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 2 }}>{APPLE_LABEL}</div></div>
        <button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="kv"><span className="k">📅 วันที่</span><span>{thDateLong(event.date)}</span></div>
        <div className="kv"><span className="k">🕐 เวลา</span><span>{event.allDay ? 'ทั้งวัน' : `${event.time}${event.endTime ? ' – ' + event.endTime : ''}`}</span></div>
        {event.location && <div className="kv"><span className="k">📍 สถานที่</span><span>{event.location}</span></div>}
        {event.url && <div className="kv"><span className="k">🔗 ลิงก์</span><a href={event.url} target="_blank" rel="noreferrer">เปิดลิงก์</a></div>}
        {event.note && <><div className="mini-label" style={{ marginTop: 12 }}>Note</div>
          <div style={{ fontSize: 13, marginTop: 5 }}><Linkify text={event.note} /></div></>}
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>ปิด</button></div>
    </Modal>
  )
}
