import { supabase, FILES_BUCKET, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

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

async function syncTaskDeadlineEvent(task) {
  let appleSyncError = null
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('title')
    .eq('id', task.project_id)
    .maybeSingle()
  if (projectError) throw projectError
  const calendarTitle = project?.title
    ? `Deadline: ${project.title} ${task.title}`
    : `Deadline: ${task.title}`

  const { data: existing, error: findError } = await supabase
    .from('events')
    .select('*')
    .eq('task_id', task.id)
    .maybeSingle()
  if (findError) throw findError

  if (!task.deadline) {
    if (existing?.id) {
      try { await syncAppleEvent('delete', existing) } catch (err) { appleSyncError = err }
      await deleteEvent(existing.id)
    }
    return { event: null, appleSyncError }
  }

  const eventRow = {
    title: calendarTitle,
    type: 'deadline',
    date: task.deadline,
    time: '',
    end_time: '',
    studio: '',
    project_id: task.project_id,
    task_id: task.id,
    attendees: task.assignee_id ? [task.assignee_id] : [],
    note: '',
  }

  const event = existing?.id
    ? await updateEvent(existing.id, eventRow)
    : await createEvent(eventRow)

  try {
    await syncAppleEvent(existing?.id ? 'update' : 'create', event)
  } catch (err) {
    appleSyncError = err
  }
  return { event, appleSyncError }
}

export const createTask = (row) =>
  supabase.from('tasks').insert(row).select().single().then(async (result) => {
    const task = handle(result)
    const { appleSyncError } = await syncTaskDeadlineEvent(task)
    if (appleSyncError) task.appleSyncError = appleSyncError
    return task
  })

export const updateTask = (id, patch) =>
  supabase.from('tasks').update(patch).eq('id', id).select().single().then(async (result) => {
    const task = handle(result)
    const { appleSyncError } = await syncTaskDeadlineEvent(task)
    if (appleSyncError) task.appleSyncError = appleSyncError
    return task
  })

export const deleteTask = async (id) => {
  let appleSyncError = null
  const { data: existing, error: findError } = await supabase
    .from('events')
    .select('*')
    .eq('task_id', id)
    .maybeSingle()
  if (findError) throw findError
  if (existing?.id) {
    try { await syncAppleEvent('delete', existing) } catch (err) { appleSyncError = err }
    await deleteEvent(existing.id)
  }
  await supabase.from('tasks').delete().eq('id', id).then(handle)
  return { appleSyncError }
}

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
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('กรุณาเข้าสู่ระบบใหม่ก่อน sync Apple Calendar')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/apple-event-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, event }),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.error || data?.message || text || 'Apple Calendar sync failed')
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
