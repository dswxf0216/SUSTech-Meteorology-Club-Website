const YIDAN_LIBRARY = { latitude: 22.6002995, longitude: 113.9932586 }
const SOURCE_URL = `https://szqxapp1.121.com.cn/sztq-app/v6/v7/homepage/index?obtId=G3565&lat=${YIDAN_LIBRARY.latitude}&lon=${YIDAN_LIBRARY.longitude}`

export const runtime = 'nodejs'

type SourceResult = {
  gridRainPoint?: string | null
  gridRainTime?: string | null
  rainfallList?: unknown[]
}

type RainfallPoint = {
  label: string
  rainfall: string
  rainfallMm: number | null
}

type PointRainfall = {
  available: true
  forecastTime: string | null
  gridPoint: string | null
  hasRain: boolean
  location: string
  retrievedAt: string
  stale?: boolean
  timeline: RainfallPoint[]
}

function firstText(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

function normalizeTimeline(list: unknown[]): RainfallPoint[] {
  return list.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const item = entry as Record<string, unknown>
    const label = firstText(item, ['time', 'stime', 'dtime', 'forecastTime', 'hour', 'minute', 'name']) || `时段${index + 1}`
    const rainfall = firstText(item, ['rainfall', 'rain', 'value', 'rainValue', 'precipitation', 'amount'])
    if (!rainfall) return []
    const parsed = Number.parseFloat(rainfall.replace(/[^\d.-]/g, ''))
    return [{ label, rainfall, rainfallMm: Number.isFinite(parsed) ? parsed : null }]
  })
}

async function readPointRainfall(): Promise<PointRainfall> {
  const response = await fetch(SOURCE_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
  const source = await response.json()
  const result: SourceResult | undefined = source?.result
  if (!source?.success || !result || !Array.isArray(result.rainfallList)) throw new Error('Invalid rainfall response')

  const timeline = normalizeTimeline(result.rainfallList)
  const hasMeasuredRain = timeline.some(point => point.rainfallMm !== null && point.rainfallMm > 0)
  const hasDescribedRain = timeline.some(point => point.rainfallMm === null && !/^(无降雨|无雨|0(?:\.0+)?(?:mm)?)$/i.test(point.rainfall))
  return {
    available: true,
    forecastTime: result.gridRainTime || null,
    gridPoint: result.gridRainPoint || null,
    hasRain: hasMeasuredRain || hasDescribedRain,
    location: '一丹图书馆',
    retrievedAt: new Date().toISOString(),
    timeline,
  }
}

let cached: PointRainfall | null = null
let pending: Promise<void> | null = null
let retryAfter = 0
const FRESH_FOR = 6 * 60_000
const STALE_FOR = 30 * 60_000

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > FRESH_FOR && Date.now() >= retryAfter && !pending) {
    pending = readPointRainfall().then(result => {
      cached = result
      retryAfter = 0
    }).catch(error => {
      console.warn('[point-rainfall]', error instanceof Error ? error.message : 'Unknown error')
      retryAfter = Date.now() + 30_000
    }).finally(() => { pending = null })
  }
  if (pending) await pending

  if (cached && age() < STALE_FOR) {
    return Response.json({ ...cached, stale: age() > FRESH_FOR }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    })
  }
  return Response.json({ available: false, location: '一丹图书馆', timeline: [] }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' },
  })
}
