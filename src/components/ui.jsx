// UI primitives ที่ใช้ซ้ำทั่วแอป
import { useEffect } from 'react'

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
