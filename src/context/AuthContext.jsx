import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { PERMS } from '../lib/constants'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess)
      await loadProfile(sess?.user?.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  // สมัครสมาชิกด้วย email + password (ส่ง name ไปเก็บใน profile ผ่าน trigger)
  const signUp = (email, password, name) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split('@')[0] } },
    })

  // เข้าสู่ระบบด้วย email + password
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  // เปลี่ยนรหัสผ่านของตัวเอง
  const changePassword = (newPassword) =>
    supabase.auth.updateUser({ password: newPassword })

  const refreshProfile = () => loadProfile(session?.user?.id)

  // ตรวจสิทธิ์ฝั่ง UI
  const can = (area, level = 'edit') => {
    const p = PERMS[profile?.role]?.[area]
    if (level === 'edit') return p === 'edit'
    return p === 'edit' || p === 'view'
  }

  return (
    <AuthCtx.Provider
      value={{ session, profile, loading, signIn, signOut, changePassword, refreshProfile, can }}
    >
      {children}
    </AuthCtx.Provider>
  )
}
