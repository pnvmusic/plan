// UI primitives ที่ใช้ซ้ำทั่วแอป
import { useEffect, useState } from 'react'
import { getFileUrl } from '../lib/api'

export function Avatar({ user, size = 34 }) {
  const u = user || { initials: '?', color: '#666' }
  return (
    <div className="avatar" style={{
      background: u.color, width: size, height: size, fontSize: size * 0.38,
    }}>{u.initials}</div>
  )
}

export function Badge({ text, color }) {
  return (
    <span className="badge" style={{ background: color + '22', color }}>
      <span className="dot" style={{ background: color }} />{text}
    </span>
  )
}

export function Progress({ value, gradient }) {
  return (
    <div className="progress">
      <div className="progress-bar" style={{
        width: value + '%',
        ...(gradient ? { background: gradient } : {}),
      }} />
    </div>
  )
}

export function Modal({ children, size, onClose }) {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (size === 'lg' ? ' lg' : '')}>{children}</div>
    </div>
  )
}

export function Empty({ icon = '📭', children }) {
  return <div className="empty"><div className="ico">{icon}</div>{children}</div>
}

const IMG_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp']
const ext = (path = '') => path.split('.').pop().toLowerCase()

export function FilePreviewModal({ path, name, onClose }) {
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    getFileUrl(path).then(setUrl).catch((e) => setErr(e.message))
  }, [path])

  const type = ext(path)
  const isImg = IMG_EXT.includes(type)
  const isPdf = type === 'pdf'

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}>
        <div className="modal-head">
          <span style={{ fontSize: 18 }}>{isImg ? '🖼️' : isPdf ? '📕' : '📄'}</span>
          <h3 style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h3>
          {url && (
            <a className="btn btn-sm" href={url} download={name} target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none' }}>⬇ ดาวน์โหลด</a>
          )}
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, minHeight: 200 }}>
          {err && <div className="empty"><div className="ico">⚠️</div>โหลดไฟล์ไม่สำเร็จ: {err}</div>}
          {!url && !err && <div className="spinner" />}
          {url && isImg && (
            <img src={url} alt={name}
              style={{ maxWidth: '100%', maxHeight: 'calc(90dvh - 120px)', objectFit: 'contain', borderRadius: 10 }} />
          )}
          {url && isPdf && (
            <iframe src={url} title={name} style={{ width: '100%', height: 'calc(90dvh - 120px)', border: 'none', borderRadius: 10 }} />
          )}
          {url && !isImg && !isPdf && (
            <div className="empty">
              <div className="ico">📎</div>
              <div style={{ marginBottom: 14 }}>ไม่รองรับ preview สำหรับไฟล์ .{type}</div>
              <a className="btn btn-primary" href={url} download={name} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none' }}>⬇ ดาวน์โหลดเพื่อเปิด</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
