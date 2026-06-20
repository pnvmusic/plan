import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { isConfigured } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Board from './pages/Board'
import Calendar from './pages/Calendar'
import Expenses from './pages/Expenses'
import Documents from './pages/Documents'
import Team from './pages/Team'

export default function App() {
  const { session, loading } = useAuth()

  if (!isConfigured) {
    return (
      <div className="center-screen">
        <div className="login-card" style={{ maxWidth: 460 }}>
          <div className="brandmark"><div className="brand-logo">🎵</div>
            <div><div className="brand-name">MuseFlow</div></div></div>
          <h3 style={{ marginBottom: 10 }}>ยังไม่ได้ตั้งค่า Supabase</h3>
          <p style={{ color: 'var(--txt-2)', fontSize: 13, lineHeight: 1.7 }}>
            สร้างไฟล์ <code>.env</code> จาก <code>.env.example</code> แล้วใส่ค่า
            <br /><code>VITE_SUPABASE_URL</code> และ <code>VITE_SUPABASE_ANON_KEY</code>
            <br />จากนั้นรัน <code>npm run dev</code> อีกครั้ง ดูขั้นตอนเต็มใน README
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="center-screen"><div className="spinner" /></div>
  if (!session) return <Login />

  return (
    <DataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/board" element={<Board />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/team" element={<Team />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </DataProvider>
  )
}
