import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DOC_TYPES } from '../lib/constants'
import { thDate } from '../lib/format'
import * as api from '../lib/api'
import { Avatar, FilePreviewModal, Linkify } from '../components/ui'
import DocumentForm from '../components/DocumentForm'

export default function Documents() {
  const { documents, projects, project, profile, reload } = useData()
  const { can } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState({ q: '', type: '', proj: '' })
  const [form, setForm] = useState(false)
  const [preview, setPreview] = useState(null)
  const editable = can('documents')
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const list = documents.filter((d) => {
    if (filters.q && !(d.name + (d.note || '')).toLowerCase().includes(filters.q.toLowerCase())) return false
    if (filters.type && d.type !== filters.type) return false
    if (filters.proj && d.project_id !== filters.proj) return false
    return true
  }).sort((a, b) => (b.uploaded_at || '').localeCompare(a.uploaded_at || ''))

  const remove = async (d) => {
    if (!window.confirm('ลบเอกสารนี้?')) return
    await api.deleteDocument(d.id); await reload(); toast('ลบเอกสารแล้ว')
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-box"><span>🔎</span>
          <input value={filters.q} placeholder="ค้นหาเอกสาร" onChange={(e) => set('q', e.target.value)} /></div>
        <select value={filters.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">ทุกประเภท</option>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={filters.proj} onChange={(e) => set('proj', e.target.value)}>
          <option value="">ทุกโปรเจกต์</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{list.length} เอกสาร</span>
        {editable && <button className="btn btn-primary btn-sm" onClick={() => setForm(true)}>＋ อัปโหลดเอกสาร</button>}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>ชื่อไฟล์</th><th>ประเภท</th><th>โปรเจกต์</th><th>ผู้อัปโหลด</th><th>วันที่</th><th>ขนาด</th><th></th></tr></thead>
          <tbody>
            {list.length ? list.map((d) => (
              <tr key={d.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{d.name.endsWith('.pdf') ? '📕' : '📄'}</span>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                    {d.note && <div style={{ fontSize: 11, color: 'var(--txt-2)' }}><Linkify text={d.note} /></div>}</div></div></td>
                <td><span className="tag">{d.type}</span></td>
                <td style={{ fontSize: 12 }}>{project(d.project_id).title}</td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar user={profile(d.uploaded_by)} size={24} /><span style={{ fontSize: 12 }}>{profile(d.uploaded_by).name}</span></div></td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{thDate(d.uploaded_at)}</td>
                <td style={{ fontSize: 12, color: 'var(--txt-2)' }}>{d.size || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm btn-ghost" title="Preview"
                    disabled={!d.file_path}
                    onClick={() => d.file_path ? setPreview(d) : toast('ยังไม่มีไฟล์จริง')}>👁</button>
                  {editable && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(d)}>🗑</button>}
                </td>
              </tr>
            )) : <tr><td colSpan={7}><div className="empty"><div className="ico">📄</div>ไม่พบเอกสาร</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form && <DocumentForm onClose={() => setForm(false)} onSaved={() => { setForm(false); reload() }} />}
      {preview && <FilePreviewModal path={preview.file_path} name={preview.name} onClose={() => setPreview(null)} />}
    </>
  )
}
