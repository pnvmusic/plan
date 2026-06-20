import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROLES, PERMS } from '../lib/constants'
import { toUsername } from '../lib/username'
import { Avatar } from '../components/ui'
import * as api from '../lib/api'

const AREAS = [
  ['projects', 'โปรเจกต์'], ['tasks', 'งาน/Task'], ['calendar', 'ปฏิทิน'],
  ['expenses', 'ค่าใช้จ่าย'], ['documents', 'เอกสาร'], ['users', 'ผู้ใช้'],
]

export default function Team() {
  const { profiles, reload } = useData()
  const { profile: me, can, refreshProfile, changePassword } = useAuth()
  const toast = useToast()
  const isAdmin = me?.role === 'Admin'
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const changeRole = async (id, role) => {
    await api.updateProfile(id, { role })
    if (id === me.id) await refreshProfile()
    await reload()
    toast('อัปเดตบทบาทแล้ว')
  }

  const savePassword = async () => {
    if (pw1.length < 6) return toast('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร')
    if (pw1 !== pw2) return toast('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setPwBusy(true)
    const { error } = await changePassword(pw1)
    setPwBusy(false)
    if (error) return toast('ผิดพลาด: ' + error.message)
    setPw1(''); setPw2(''); toast('เปลี่ยนรหัสผ่านแล้ว')
  }

  return (
    <div className="two-col">
      <div className="card">
        <div className="section-head"><h3>สมาชิกในทีม</h3>
          <div className="spacer" /><span className="tag">{profiles.length} คน</span></div>
        {profiles.map((u) => (
          <div key={u.id} className="list-row">
            <Avatar user={u} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}{u.id === me.id && <span className="tag" style={{ marginLeft: 6 }}>คุณ</span>}</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>@{toUsername(u.email)}</div>
            </div>
            {isAdmin ? (
              <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                style={{ padding: '6px 9px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--txt)', fontSize: 12 }}>
                {Object.keys(ROLES).map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
              </select>
            ) : <span className="tag">{ROLES[u.role].label}</span>}
          </div>
        ))}
        {isAdmin && <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 10 }}>
          ในฐานะ Admin คุณเปลี่ยนบทบาทของสมาชิกได้ที่นี่
        </div>}
      </div>

      <div className="card">
        <div className="section-head"><h3>สิทธิ์การเข้าถึงแต่ละบทบาท</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: 12 }}>
            <thead><tr><th>พื้นที่</th>{Object.keys(ROLES).map((r) => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}</tr></thead>
            <tbody>
              {AREAS.map(([k, lbl]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 600 }}>{lbl}</td>
                  {Object.keys(ROLES).map((r) => {
                    const p = PERMS[r][k]
                    return <td key={r} style={{ textAlign: 'center' }}>
                      {p === 'edit' ? <span style={{ color: 'var(--ok)' }}>✏️ แก้ไข</span>
                        : p === 'view' ? <span style={{ color: 'var(--info)' }}>👁 ดู</span>
                        : <span style={{ color: 'var(--txt-3)' }}>✕</span>}
                    </td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 12 }}>
          บทบาทปัจจุบันของคุณ: <b style={{ color: 'var(--brand-2)' }}>{ROLES[me?.role]?.label}</b> — {ROLES[me?.role]?.desc}
          <br />หมายเหตุ: สิทธิ์เหล่านี้บังคับใช้จริงด้วย Row Level Security ในฐานข้อมูล (Postgres)
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
          <div className="section-head"><h3 style={{ fontSize: 14 }}>🔑 เปลี่ยนรหัสผ่านของฉัน</h3></div>
          <div className="form-row">
            <div className="form-grp"><label>รหัสผ่านใหม่</label>
              <input type="password" value={pw1} placeholder="อย่างน้อย 6 ตัวอักษร"
                onChange={(e) => setPw1(e.target.value)} /></div>
            <div className="form-grp"><label>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" value={pw2} placeholder="พิมพ์ซ้ำอีกครั้ง"
                onChange={(e) => setPw2(e.target.value)} /></div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={pwBusy} onClick={savePassword}>
            {pwBusy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </div>
      </div>
    </div>
  )
}
