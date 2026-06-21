import { createClient } from 'npm:@supabase/supabase-js@2'

const CALDAV_BASE = 'https://caldav.icloud.com'
const TZID = 'Asia/Bangkok'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const xml = (body: string) => `<?xml version="1.0" encoding="utf-8"?>${body}`
const appleUid = (id: string) => `museflow-${id}@museflow.app`
const authHeader = () => {
  const appleId = Deno.env.get('APPLE_ID')
  const password = Deno.env.get('APPLE_APP_PASSWORD')
  if (!appleId || !password) throw new Error('Missing APPLE_ID or APPLE_APP_PASSWORD')
  return `Basic ${btoa(`${appleId}:${password}`)}`
}

const unescapeXml = (s = '') => s
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")

const textOf = (block: string, name: string) =>
  unescapeXml(block.match(new RegExp(`<[^:>]*:?${name}[^>]*>([\\s\\S]*?)<\\/[^:>]*:?${name}>`, 'i'))?.[1] || '')
const hrefIn = (block: string, name: string) => textOf(textOf(block, name), 'href')

const responseBlocks = (body: string) => [...body.matchAll(/<[^:>]*:?response[\s\S]*?<\/[^:>]*:?response>/gi)].map((m) => m[0])

function absoluteUrl(href: string) {
  return new URL(unescapeXml(href), CALDAV_BASE).toString()
}

async function caldav(url: string, method: string, body?: string, extraHeaders = {}) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: {
      authorization: authHeader(),
      depth: ['PROPFIND', 'REPORT'].includes(method) ? '1' : '0',
      'content-type': 'application/xml; charset=utf-8',
      ...extraHeaders,
    },
    body,
  })
  if (!res.ok && !(method === 'DELETE' && res.status === 404)) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Apple CalDAV ${method} failed (${res.status})${errBody ? ' — ' + errBody.replace(/\s+/g, ' ').slice(0, 200) : ''}`)
  }
  return res
}

async function discoverCalendarUrl() {
  const wanted = Deno.env.get('APPLE_CALENDAR_NAME')?.trim()
  if (!wanted) throw new Error('Missing APPLE_CALENDAR_NAME')

  const principalRes = await caldav(
    `${CALDAV_BASE}/`,
    'PROPFIND',
    xml('<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal /></d:prop></d:propfind>'),
    { depth: '0' },
  )
  const principalHref = hrefIn(await principalRes.text(), 'current-user-principal')

  const homeRes = await caldav(
    absoluteUrl(principalHref),
    'PROPFIND',
    xml('<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set /></d:prop></d:propfind>'),
    { depth: '0' },
  )
  const homeHref = hrefIn(await homeRes.text(), 'calendar-home-set')

  const listRes = await caldav(
    absoluteUrl(homeHref),
    'PROPFIND',
    xml('<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/"><d:prop><d:displayname /><d:resourcetype /><cs:getctag /></d:prop></d:propfind>'),
  )
  const calendars = responseBlocks(await listRes.text())
    .map((block) => ({
      href: textOf(block, 'href'),
      name: textOf(block, 'displayname').trim(),
      isCalendar: /calendar/i.test(block),
    }))
    .filter((x) => x.href && x.name && x.isCalendar)

  const exact = calendars.find((x) => x.name === wanted)
  const loose = calendars.find((x) => x.name.toLowerCase() === wanted.toLowerCase())
  const found = exact || loose
  if (!found) throw new Error(`Apple calendar "${wanted}" not found. Available: ${calendars.map((c) => c.name).join(', ') || '(none)'}`)
  return absoluteUrl(found.href).replace(/\/?$/, '/')
}

// iCloud เก็บแต่ละ event ไว้ที่ resource URL = {calendar}/{uid}.ics
// จึงไม่ต้องใช้ calendar-query REPORT (ซึ่ง iCloud ตอบ 412 บ่อย) — สร้าง URL จาก UID ตรงๆ
const externalEventUrl = (calendarUrl: string, uid: string) =>
  `${calendarUrl}${encodeURIComponent(uid)}.ics`

const pad = (n: number) => String(n).padStart(2, '0')
const compactDate = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const escIcs = (s = '') => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;')

function eventDate(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = (time || '09:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm || 0, 0)
}

function addHour(date: Date) {
  const d = new Date(date)
  d.setHours(d.getHours() + 1)
  return d
}

function toIcs(event: Record<string, any>, uid = appleUid(event.id)) {
  const start = eventDate(event.date, event.time)
  const end = event.end_time ? eventDate(event.date, event.end_time) : addHour(start)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MuseFlow//Apple Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;TZID=${TZID}:${compactDate(start)}`,
    `DTEND;TZID=${TZID}:${compactDate(end)}`,
    `SUMMARY:${escIcs(event.title || 'MuseFlow event')}`,
    event.studio ? `LOCATION:${escIcs(event.studio)}` : '',
    event.note ? `DESCRIPTION:${escIcs(event.note)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].filter(Boolean).join('\r\n')
}

async function assertCalendarPermission(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) {
    throw new Response(JSON.stringify({ ok: false, error: 'Missing MuseFlow session token' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
  const token = auth.replace(/^bearer\s+/i, '')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  // client สำหรับ getUser ต้อง "ไม่" มี global authorization header
  // มิฉะนั้น header จะชนกับ jwt param → Authorization ซ้ำ → GoTrue ปฏิเสธ (401)
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: userRes, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userRes?.user) {
    throw new Response(JSON.stringify({
      ok: false,
      error: `auth: ${userError?.status ?? '?'} ${userError?.name ?? ''} ${userError?.message ?? 'no user'}`.trim(),
    }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }

  // client แยกสำหรับ query profiles ผ่าน RLS (ใช้ global header ได้ เพราะ .from ไม่ส่ง jwt param)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { authorization: auth } },
  })
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userRes.user.id)
    .single()
  if (error || !['Admin', 'Manager'].includes(profile?.role)) {
    throw new Response(JSON.stringify({ ok: false, error: 'Only Admin or Manager can sync Apple Calendar.' }), {
      status: 403,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    await assertCalendarPermission(req)
    const { action, event } = await req.json()
    if (!event?.id && !event?.uid) throw new Error('Missing event id')

    const calendarUrl = await discoverCalendarUrl()
    const eventUrl = event?.id ? `${calendarUrl}${appleUid(event.id)}.ics` : ''

    if (action === 'deleteExternal') {
      if (!event.uid) throw new Error('Apple event UID ว่าง — ลบไม่ได้')
      // caldav() ถือว่า DELETE ที่เจอ 404 = สำเร็จ (event ถูกลบไปแล้ว)
      await caldav(externalEventUrl(calendarUrl, event.uid), 'DELETE')
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (action === 'updateExternal') {
      if (!event.uid) throw new Error('Apple event UID ว่าง — แก้ไขไม่ได้')
      const externalUrl = externalEventUrl(calendarUrl, event.uid)

      // เช็คก่อนว่ามี event นี้อยู่จริงในปฏิทินที่เราเขียน — กันสร้าง duplicate
      // ถ้า published feed (ที่อ่าน) เป็นคนละปฏิทินกับ APPLE_CALENDAR_NAME (ที่เขียน)
      const exists = await fetch(externalUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { authorization: authHeader() },
      })
      await exists.body?.cancel()
      if (exists.status === 404) {
        throw new Error(`หา event นี้ในปฏิทิน iCloud "${Deno.env.get('APPLE_CALENDAR_NAME')}" ไม่เจอ — ปฏิทินที่อ่าน (published feed) อาจไม่ใช่ปฏิทินเดียวกับที่เขียน`)
      }
      if (!exists.ok) throw new Error(`Apple CalDAV GET(external) failed (${exists.status})`)

      const res = await fetch(externalUrl, {
        method: 'PUT',
        redirect: 'follow',
        headers: {
          authorization: authHeader(),
          'content-type': 'text/calendar; charset=utf-8',
        },
        body: toIcs(event, event.uid),
      })
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`Apple CalDAV PUT(external) failed (${res.status})${errBody ? ' — ' + errBody.replace(/\s+/g, ' ').slice(0, 200) : ''}`)
      }
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (action === 'delete') {
      await caldav(eventUrl, 'DELETE')
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (action === 'create' || action === 'update') {
      const headers: Record<string, string> = {
        authorization: authHeader(),
        'content-type': 'text/calendar; charset=utf-8',
      }
      if (action === 'create') headers['if-none-match'] = '*'
      const res = await fetch(eventUrl, {
        method: 'PUT',
        redirect: 'follow',
        headers,
        body: toIcs(event),
      })
      if (!res.ok && !(action === 'create' && res.status === 412)) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`Apple CalDAV PUT failed (${res.status})${errBody ? ' — ' + errBody.replace(/\s+/g, ' ').slice(0, 200) : ''}`)
      }
      if (action === 'create' && res.status === 412) {
        await fetch(eventUrl, {
          method: 'PUT',
          redirect: 'follow',
          headers: {
            authorization: authHeader(),
            'content-type': 'text/calendar; charset=utf-8',
          },
          body: toIcs(event),
        })
      }
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    throw new Error('Unknown action')
  } catch (err) {
    if (err instanceof Response) return err
    // log เฉพาะข้อความ error (เป็น CalDAV protocol XML — ไม่มี credential) เพื่อดีบักจาก logs
    console.error('[apple-event-sync]', err?.message || String(err))
    return Response.json({ ok: false, error: err?.message || 'Apple sync failed' }, {
      status: 500,
      headers: corsHeaders,
    })
  }
})
