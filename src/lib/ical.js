import { ymd } from './format'

const ICLOUD_CALENDAR_URL = 'webcal://p129-caldav.icloud.com/published/2/MTc1NTEzMTY5ODE3NTUxM_2dw8_1BkJgNEBvh56HLbqsyLJYlQBTlWkm9tkEsWWwlkDS9TfzDfvj3j98LYpxixvQzOXbiKsYwDIHyJSS8NI'
const LOCAL_PROXY_URL = '/apple-calendar.ics'
const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apple-calendar`
  : ''

const toHttpCalendarUrl = (url) => url.replace(/^webcal:\/\//i, 'https://')

const unfold = (ics) => String(ics)
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .split('\n')
  .reduce((lines, line) => {
    if (/^[ \t]/.test(line) && lines.length) lines[lines.length - 1] += line.slice(1)
    else lines.push(line)
    return lines
  }, [])

const clean = (value = '') => value
  .replace(/\\n/gi, '\n')
  .replace(/\\,/g, ',')
  .replace(/\\;/g, ';')
  .replace(/\\\\/g, '\\')
  .trim()

function parseDate(value = '', params = '') {
  const allDay = params.includes('VALUE=DATE') || /^\d{8}$/.test(value)
  if (allDay) {
    return {
      allDay: true,
      date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
      time: '',
      raw: value,
    }
  }

  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/)
  if (!m) return { allDay: false, date: '', time: '', raw: value }

  const [, yy, mo, dd, hh, mi, ss = '00', z] = m
  const d = z
    ? new Date(Date.UTC(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mi), Number(ss)))
    : new Date(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mi), Number(ss))

  return {
    allDay: false,
    date: ymd(d),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    raw: value,
  }
}

function addDays(ds, n) {
  const d = new Date(ds)
  d.setDate(d.getDate() + n)
  return ymd(d)
}

function datesBetween(start, end, allDay) {
  if (!start) return []
  if (!allDay) return [start]
  if (!end || end <= start) return [start]
  const dates = []
  const last = addDays(end, -1)
  for (let ds = start; ds <= last; ds = addDays(ds, 1)) dates.push(ds)
  return dates
}

export function parseIcsEvents(ics) {
  const lines = unfold(ics)
  const events = []
  let item = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      item = {}
      continue
    }
    if (line === 'END:VEVENT') {
      if (item?.summary && item?.start?.date) {
        const dates = datesBetween(item.start.date, item.end?.date, item.start.allDay)
        dates.forEach((date, idx) => {
          events.push({
            id: `apple:${item.uid || item.summary}:${date}:${idx}`,
            external: true,
            source: 'apple',
            title: item.summary,
            date,
            time: item.start.allDay ? '' : item.start.time,
            endTime: item.end?.time || '',
            allDay: item.start.allDay,
            location: item.location || '',
            note: item.description || '',
            url: item.url || '',
            uid: item.uid || '',
          })
        })
      }
      item = null
      continue
    }
    if (!item || !line.includes(':')) continue

    const idx = line.indexOf(':')
    const rawKey = line.slice(0, idx)
    const value = clean(line.slice(idx + 1))
    const [key, ...paramParts] = rawKey.split(';')
    const params = paramParts.join(';').toUpperCase()

    if (key === 'SUMMARY') item.summary = value
    else if (key === 'UID') item.uid = value
    else if (key === 'LOCATION') item.location = value
    else if (key === 'DESCRIPTION') item.description = value
    else if (key === 'URL') item.url = value
    else if (key === 'DTSTART') item.start = parseDate(value, params)
    else if (key === 'DTEND') item.end = parseDate(value, params)
  }

  return events.sort((a, b) => (a.date + a.time + a.title).localeCompare(b.date + b.time + b.title))
}

export async function getAppleCalendarEvents({ refresh = false } = {}) {
  const url = toHttpCalendarUrl(ICLOUD_CALENDAR_URL)
  const cacheBust = refresh ? `?t=${Date.now()}` : ''
  const fetchOptions = refresh ? { cache: 'no-store' } : undefined
  const sameOrigin = await fetch(LOCAL_PROXY_URL + cacheBust, fetchOptions).catch(() => null)
  if (sameOrigin?.ok) return parseIcsEvents(await sameOrigin.text())

  if (SUPABASE_FUNCTION_URL) {
    const supabaseProxy = await fetch(SUPABASE_FUNCTION_URL + cacheBust, fetchOptions).catch(() => null)
    if (supabaseProxy?.ok) return parseIcsEvents(await supabaseProxy.text())
  }

  const direct = await fetch(refresh ? `${url}?t=${Date.now()}` : url, { mode: 'cors', ...(fetchOptions || {}) }).catch(() => null)
  if (direct?.ok) return parseIcsEvents(await direct.text())

  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  const proxied = await fetch(refresh ? `${proxyUrl}&t=${Date.now()}` : proxyUrl, fetchOptions).catch(() => null)
  if (!proxied) throw new Error('โหลดปฏิทิน Apple ไม่สำเร็จ: browser ถูกบล็อกการดึงข้อมูลข้ามโดเมน')
  if (!proxied.ok) throw new Error('โหลดปฏิทิน Apple ไม่สำเร็จ')
  return parseIcsEvents(await proxied.text())
}
