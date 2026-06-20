import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const toast = useCallback((text) => {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2400)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {msg && <div className="toast">✓ {msg}</div>}
    </ToastCtx.Provider>
  )
}
