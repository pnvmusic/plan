import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toEmail } from '../lib/username'

export default function Login() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (!username.trim() || !pass) return
    setBusy(true)
    try {
      const { error } = await signIn(toEmail(username.trim()), pass)
      if (error) throw error
    } catch (e) {
      const msg = e?.message || e?.error_description || e?.msg ||
        (typeof e === 'string' ? e : 'เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง')
      setErr(translateErr(msg))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="brandmark">
          <div className="brand-logo">🎵</div>
          <div>
            <div className="brand-name">pnvPlan</div>
            <div className="brand-tag">ระบบวางแผนงานของ p n v</div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>ชื่อผู้ใช้ (Username)</label>
            <input value={username} autoFocus required placeholder="เช่น pnv"
              autoCapitalize="off" autoCorrect="off"
              onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>รหัสผ่าน</label>
            <input type="password" value={pass} required placeholder="••••••••"
              onChange={(e) => setPass(e.target.value)} />
          </div>

          {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>{err}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--txt-2)', marginTop: 14 }}>
          เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่ได้รับ
        </div>
      </div>
    </div>
  )
}

function translateErr(msg = '') {
  if (/Invalid login credentials/i.test(msg)) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
  if (/Email not confirmed/i.test(msg)) return 'บัญชียังไม่ถูกยืนยัน — ติดต่อผู้ดูแลระบบ'
  return msg
}
