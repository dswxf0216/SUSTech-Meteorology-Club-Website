const RADAR_URL = 'https://szqxapp1.121.com.cn/sztq-app/v6/mapproduct/radar'

export const runtime = 'nodejs'

type UpstreamFrame = {
  dtime?: string
  pic?: string
  time?: string
}

type UpstreamRadar = {
  colorchart?: { colors?: string[]; dataname?: string; unit?: string; values?: string[] }
  ddatetime?: string
  latfrom?: string
  latto?: string
  list?: UpstreamFrame[]
  lonfrom?: string
  lonto?: string
}

let cached: { retrievedAt: string; radar: unknown } | null = null
let pending: Promise<void> | null = null
const FRESH_FOR = 5 * 60_000
const STALE_FOR = 30 * 60_000

async function readRadar() {
  const response = await fetch(RADAR_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0',
    },
    body: '{}',
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)

  const body = await response.json()
  const result: UpstreamRadar | undefined = body?.result
  if (!body?.success || !result || !Array.isArray(result.list)) throw new Error('Invalid radar response')

  const frames = result.list
    .filter(frame => typeof frame.pic === 'string' && /^\/webcache\/radarnew\/[\w.-]+\.png$/.test(frame.pic))
    .map(frame => ({
      imageUrl: `/api/weather/radar/frame?path=${encodeURIComponent(frame.pic!)}`,
      observedAt: frame.dtime || '',
      time: frame.time || '',
    }))
    .sort((left, right) => left.observedAt.localeCompare(right.observedAt))

  if (!frames.length) throw new Error('No radar frames')

  return {
    retrievedAt: new Date().toISOString(),
    radar: {
      bounds: {
        south: Number(result.latfrom), west: Number(result.lonfrom),
        north: Number(result.latto), east: Number(result.lonto),
      },
      colorChart: result.colorchart || null,
      dataTime: result.ddatetime || frames[0].observedAt,
      frames,
    },
  }
}

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > FRESH_FOR && !pending) {
    pending = readRadar().then(result => { cached = result }).catch(error => {
      console.warn('[weather-radar]', error instanceof Error ? error.message : 'Unknown error')
    }).finally(() => { pending = null })
  }
  if (pending) await pending

  if (cached && age() < STALE_FOR) {
    return Response.json({ available: true, ...cached }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=240' } })
  }
  return Response.json({ available: false, radar: null }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
}
