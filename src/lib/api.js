import { supabase, FILES_BUCKET } from './supabase'

// ====================================================================
// API SERVICE LAYER — ทุกการอ่าน/เขียนผ่าน Supabase (Postgres + RLS)
// ====================================================================

const handle = ({ data, error }) => {
  if (error) throw error
  return data
}

// ---------- PROFILES ----------
export const getProfiles = () =>
  supabase.from('profiles').select('*').order('created_at').then(handle)

export const updateProfile = (id, patch) =>
  supabase.from('profiles').update(patch).eq('id', id).select().single().then(handle)

// ---------- PROJECTS ----------
export const getProjects = () =>
  supabase.from('projects').select('*').order('deadline', { ascending: true }).then(handle)

export const createProject = (row) =>
  supabase.from('projects').insert(row).select().single().then(handle)

export const updateProject = (id, patch) =>
  supabase.from('projects').update(patch).eq('id', id).select().single().then(handle)

export const deleteProject = (id) =>
  supabase.from('projects').delete().eq('id', id).then(handle)

// ---------- TASKS ----------
export const getTasks = () =>
  supabase.from('tasks').select('*').order('created_at').then(handle)

export const createTask = (row) =>
  supabase.from('tasks').insert(row).select().single().then(handle)

export const updateTask = (id, patch) =>
  supabase.from('tasks').update(patch).eq('id', id).select().single().then(handle)

export const deleteTask = (id) =>
  supabase.from('tasks').delete().eq('id', id).then(handle)

// ---------- EVENTS ----------
export const getEvents = () =>
  supabase.from('events').select('*').order('date').then(handle)

export const createEvent = (row) =>
  supabase.from('events').insert(row).select().single().then(handle)

export const updateEvent = (id, patch) =>
  supabase.from('events').update(patch).eq('id', id).select().single().then(handle)

export const deleteEvent = (id) =>
  supabase.from('events').delete().eq('id', id).then(handle)

export async function syncAppleEvent(action, event) {
  const { data, error } = await supabase.functions.invoke('apple-event-sync', {
    body: { action, event },
  })
  if (error) throw error
  if (data?.ok === false) throw new Error(data.error || 'Apple Calendar sync failed')
  return data
}

// ---------- EXPENSES ----------
export const getExpenses = () =>
  supabase.from('expenses').select('*').order('date', { ascending: false }).then(handle)

export const createExpense = (row) =>
  supabase.from('expenses').insert(row).select().single().then(handle)

export const updateExpense = (id, patch) =>
  supabase.from('expenses').update(patch).eq('id', id).select().single().then(handle)

export const deleteExpense = (id) =>
  supabase.from('expenses').delete().eq('id', id).then(handle)

// ---------- DOCUMENTS ----------
export const getDocuments = () =>
  supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).then(handle)

export const createDocument = (row) =>
  supabase.from('documents').insert(row).select().single().then(handle)

export const deleteDocument = (id) =>
  supabase.from('documents').delete().eq('id', id).then(handle)

// ---------- STORAGE (ไฟล์แนบ: ใบเสร็จ, เอกสาร, reference) ----------
export async function uploadFile(file, folder = 'misc') {
  const path = `${folder}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(FILES_BUCKET).upload(path, file)
  if (error) throw error
  return path
}

export async function getFileUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, 60 * 60) // ลิงก์อายุ 1 ชม.
  if (error) throw error
  return data.signedUrl
}
