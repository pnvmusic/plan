import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { ROLES } from '../lib/constants'
import { Avatar } from './ui'

const NAV = [
  { group: 'หลัก', items: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/projects', icon: '🎼', label: 'โปรเจกต์เพลง' },
    { path: '/board', icon: '🗂️', label: 'Task Board' },
    { path: '/calendar', icon: '📅', label: 'ปฏิทิน' },
  ]},
  { group: 'การเงิน & เอกสาร', items: [
    { path: '/expenses', icon: '💸', label: 'ค่าใช้จ่าย' },
    { path: '/documents', icon: '📄', label: 'สัญญา & เอกสาร' },
  ]},
  { group: 'ระบบ', items: [
    { path: '/team', icon: '👥', label: 'ทีม & สิทธิ์' },
  ]},
]
const META = {
  '/': { t: 'Dashboard', s: 'ภาพรวมโปรเจกต์เพลงทั้งหมด' },
  '/projects': { t: 'โปรเจกต์เพลง', s: 'จัดการโปรเจกต์เพลงทุกขั้นตอน' },
  '/board': { t: 'Task Board', s: 'ลากการ์ดเพื่ออัปเดตขั้นตอนการทำงาน' },
  '/calendar': { t: 'ปฏิทิน', s: 'นัดอัด ประชุม และ deadline ทั้งหมด' },
  '/expenses': { t: 'ค่าใช้จ่าย', s: 'บันทึกและติดตามค่าใช้จ่ายเพื่อเบิกเงิน' },
  '/documents': { t: 'สัญญา & เอกสาร', s: 'เอกสารอ้างอิงผูกกับโปรเจกต์' },
  '/team': { t: 'ทีม & สิทธิ์', s: 'ผู้ใช้และระดับการเข้าถึง' },
}

export default function Layout({ children }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile, signOut } = useAuth()
  const { tasks, expenses } = useData()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)

  const meta = META[loc.pathname] || { t: 'pnvPlan', s: '' }
  const openTasks = tasks.filter((t) => !t.done).length
  const pendingExp = expenses.filter((e) => e.status === 'รอเบิก').length

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    if (next) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', 'light')
  }

  const goSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      nav('/projects?q=' + encodeURIComponent(e.target.value.trim()))
      e.target.value = ''
    }
  }

  const badgeFor = (path) =>
    path === '/board' && openTasks ? openTasks :
    path === '/expenses' && pendingExp ? pendingExp : null

  return (
    <div className="layout">
      {open && <div className="sb-backdrop" onClick={() => setOpen(false)} />}
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="sb-top">
          <div className="brandmark" style={{ marginBottom: 0 }}>
            <div className="brand-logo" style={{ width: 34, height: 34, fontSize: 18 }}>🎵</div>
            <div className="brand-name" style={{ fontSize: 17 }}>pnvPlan</div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.items.map((it) => {
                const active = loc.pathname === it.path
                const b = badgeFor(it.path)
                return (
                  <button key={it.path} className={'nav-item' + (active ? ' active' : '')}
                    onClick={() => { nav(it.path); setOpen(false) }}>
                    <span className="nav-ico">{it.icon}</span>{it.label}
                    {b != null && <span className="nav-badge">{b}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="user-chip" onClick={() => nav('/team')}>
            <Avatar user={profile} size={34} />
            <div className="user-meta">
              <div className="user-name">{profile?.name}</div>
              <div className="user-role">{ROLES[profile?.role]?.label || profile?.role}</div>
            </div>
            <button className="btn btn-ghost btn-sm" title="ออกจากระบบ"
              onClick={(e) => { e.stopPropagation(); signOut() }}>⏏</button>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setOpen(true)}>☰</button>
          <div>
            <div className="page-title">{meta.t}</div>
            <div className="page-sub">{meta.s}</div>
          </div>
          <div className="topbar-search">
            🔎 <input placeholder="ค้นหาเพลง / ศิลปิน… (Enter)" onKeyDown={goSearch} />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} title="สลับธีม">{dark ? '🌙' : '☀️'}</button>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
