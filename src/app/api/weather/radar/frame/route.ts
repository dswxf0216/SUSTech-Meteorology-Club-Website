const ORIGIN = 'https://szqxapp1.121.com.cn'
const FRAME_PATH = /^\/webcache\/radarnew\/[\w.-]+\.png$/

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || ''
  if (!FRAME_PATH.test(path)) return new Response('Invalid radar frame path', { status: 400 })

  try {
    const upstream = await fetch(`${ORIGIN}${path}`, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!upstream.ok) return new Response('Radar frame unavailable', { status: 502 })

    return new Response(upstream.body, {
      headers: {
        'Cache-Control': 'public, max-age=3600, immutable',
        'Content-Type': upstream.headers.get('Content-Type') || 'image/png',
      },
    })
  } catch {
    return new Response('Radar frame unavailable', { status: 502 })
  }
}
