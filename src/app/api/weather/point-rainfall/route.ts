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
  state: string | null
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
  valueKind: 'rolling-hour'
}

function firstText(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

const TIME_KEYS = ['time', 'stime', 'dtime', 'forecastTime', 'forecastDate', 'dateTime', 'datetime', 'startTime', 'beginTime', 'hour', 'minute', 'name', 'label']
const RAIN_KEYS = ['rainfall', 'rain', 'rainfallAmount', 'rainAmount', 'rainValue', 'precipitation', 'precip', 'amount', 'value']

function parseRainfall(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTimeline(list: unknown[]): RainfallPoint[] {
  return list.flatMap((entry, index) => {
    let label: string | null = null
    let rainfall: string | null = null
    let state: string | null = null

    if (Array.isArray(entry)) {
      label = entry[0] === undefined || entry[0] === null ? null : String(entry[0]).trim()
      rainfall = entry[1] === undefined || entry[1] === null ? null : String(entry[1]).trim()
    } else if (entry && typeof entry === 'object') {
      const item = entry as Record<string, unknown>
      label = firstText(item, TIME_KEYS)
      rainfall = firstText(item, RAIN_KEYS)
      state = firstText(item, ['state', 'period', 'type'])
    } else if (typeof entry === 'string') {
      const parts = entry.split(/[,，|]/).map(part => part.trim()).filter(Boolean)
      if (parts.length >= 2) [label, rainfall] = parts
    }

    if (!rainfall) return []
    return [{ label: label || `时段${index + 1}`, rainfall, rainfallMm: parseRainfall(rainfall), state }]
  })
}

function emptyForecastTimeline(forecastTime?: string | null): RainfallPoint[] {
  const digits = forecastTime?.replace(/\D/g, '') || ''
  const start = digits.length >= 12
    ? Date.UTC(
      Number(digits.slice(0, 4)),
      Number(digits.slice(4, 6)) - 1,
      Number(digits.slice(6, 8)),
      Number(digits.slice(8, 10)),
      Number(digits.slice(10, 12)),
    )
    : Math.floor(Date.now() / (6 * 60_000)) * 6 * 60_000
  if (!Number.isFinite(start)) return []

  return Array.from({ length: 20 }, (_, index) => {
    const time = new Date(start + (index + 1) * 6 * 60_000)
    const label = `${String(time.getUTCHours()).padStart(2, '0')}:${String(time.getUTCMinutes()).padStart(2, '0')}`
    return {
      label,
      rainfall: '0',
      rainfallMm: 0,
      state: index < 10 ? '未来1小时' : '未来2小时',
    }
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

  const completeTimeline = normalizeTimeline(result.rainfallList)
  const hasPeriodState = completeTimeline.some(point => point.state)
  const futureTimeline = hasPeriodState
    ? completeTimeline.filter(point => point.state?.startsWith('未来'))
    : completeTimeline
  const timeline = futureTimeline.length ? futureTimeline : emptyForecastTimeline(result.gridRainTime)
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
    valueKind: 'rolling-hour',
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
