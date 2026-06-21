const ICLOUD_CALENDAR_URL =
  'https://p129-caldav.icloud.com/published/2/MTc1NTEzMTY5ODE3NTUxM_2dw8_1BkJgNEBvh56HLbqsyLJYlQBTlWkm9tkEsWWwlkDS9TfzDfvj3j98LYpxixvQzOXbiKsYwDIHyJSS8NI'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  const res = await fetch(ICLOUD_CALENDAR_URL, {
    headers: {
      accept: 'text/calendar,*/*',
      'user-agent': 'MuseFlow Apple Calendar Proxy',
    },
  })

  if (!res.ok) {
    return new Response(`Apple calendar responded with ${res.status}`, {
      status: 502,
      headers: corsHeaders,
    })
  }

  return new Response(await res.text(), {
    headers: {
      ...corsHeaders,
      'content-type': 'text/calendar; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
})
