// ระบบใช้ username ล้วน แต่ Supabase Auth ต้องการรูปแบบอีเมล
// จึงแปลง username <-> internal email ด้วยโดเมนภายใน
export const USERNAME_DOMAIN = 'museflow.local'

// "pnv" -> "pnv@museflow.local"  (ถ้าใส่อีเมลเต็มมาแล้วก็ปล่อยผ่าน)
export const toEmail = (username) =>
  username.includes('@') ? username : `${username}@${USERNAME_DOMAIN}`

// "pnv@museflow.local" -> "pnv"
export const toUsername = (email = '') =>
  email.endsWith('@' + USERNAME_DOMAIN) ? email.split('@')[0] : email
