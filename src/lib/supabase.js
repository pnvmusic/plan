import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // ช่วยให้รู้ทันทีถ้าลืมตั้งค่า .env
  console.error(
    'ขาดค่า Supabase env — ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const isConfigured = Boolean(url && anonKey)
export const FILES_BUCKET = 'museflow-files'
