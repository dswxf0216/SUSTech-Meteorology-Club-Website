const TILE_ORIGIN = 'https://tile.openstreetmap.org'

export const runtime = 'nodejs'

function parseCoordinate(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const z = parseCoordinate(searchParams.get('z'))
  const x = parseCoordinate(searchParams.get('x'))
  const y = parseCoordinate(searchParams.get('y'))
  if (z === null || x === null || y === null || z > 18) {
    return new Response('Invalid map tile coordinates', { status: 400 })
  }

  const edge = 2 ** z
  if (x >= edge || y >= edge) return new Response('Invalid map tile coordinates', { status: 400 })

  try {
    const upstream = await fetch(`${TILE_ORIGIN}/${z}/${x}/${y}.png`, {
      next: { revalidate: 7 * 24 * 60 * 60 },
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0 (nkweather.top)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!upstream.ok) return new Response('Map tile unavailable', { status: 502 })

    return new Response(upstream.body, {
      headers: {
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Content-Type': upstream.headers.get('Content-Type') || 'image/png',
      },
    })
  } catch {
    return new Response('Map tile unavailable', { status: 502 })
  }
}
