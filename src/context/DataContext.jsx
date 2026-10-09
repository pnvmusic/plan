import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { useAuth } from './AuthContext'
import { stageProgress } from '../lib/constants'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

export function DataProvider({ children }) {
  const { session } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!session) return
    setLoading(true); setError(null)
    try {
      const [pr, pj, tk, ev, tx, dc] = await Promise.all([
        api.getProfiles(), api.getProjects(), api.getTasks(),
        api.getEvents(), api.getTransactions(), api.getDocuments(),
      ])
      setProfiles(pr); setProjects(pj); setTasks(tk)
      setEvents(ev); setTransactions(tx); setDocuments(dc)
    } catch (e) {
      setError(e.message || 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { reload() }, [reload])

  // helpers
  const profile = (id) => profiles.find((p) => p.id === id) ||
    { name: '—', initials: '?', color: '#666' }
  const project = (id) => projects.find((p) => p.id === id) || { title: '—' }

  const projectProgress = (pid) => {
    const ts = tasks.filter((t) => t.project_id === pid)
    if (ts.length) return Math.round((ts.filter((t) => t.done).length / ts.length) * 100)
    const st = projects.find((p) => p.id === pid)?.status
    return st ? stageProgress(st) : 0
  }

  return (
    <DataCtx.Provider value={{
      profiles, projects, tasks, events, transactions, documents,
      loading, error, reload,
      setProjects, setTasks, setEvents, setTransactions, setDocuments,
      profile, project, projectProgress,
    }}>
      {children}
    </DataCtx.Provider>
  )
}
