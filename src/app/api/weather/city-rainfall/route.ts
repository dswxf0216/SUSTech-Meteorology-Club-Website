const SOURCE_URL = 'https://weather.121.com.cn/data_cache/contour/radarRain/radarRainContour.js'
const FRAME_PATH = /^radar\/HitCNN_QPF\/1h\/\d{4}\/\d{2}\/\d{2}\/\d{12}\/\d+\.png(?:\?r=\d+)?$/

export const runtime = 'nodejs'

type ContourSource = {
  findex?: number
  imgs?: unknown[]
  times?: unknown[]
}

type CityRainfall = {
  frames: { imageUrl: string; time: string }[]
  publishedAt: string | null
}

let cached: { retrievedAt: string; rainfall: CityRainfall } | null = null
let pending: Promise<void> | null = null
const FRESH_FOR = 5 * 60_000
const STALE_FOR = 30 * 60_000

async function readCityRainfall() {
  const response = await fetch(SOURCE_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)

  const sourceText = await response.text()
  const sourceMatch = sourceText.match(/SZ121_RadarRainContour\s*=\s*(\{.*?\})\s*;/s)
  if (!sourceMatch) throw new Error('Invalid rainfall contour response')

  const source = JSON.parse(sourceMatch[1]) as ContourSource
  if (!Array.isArray(source.imgs) || !Array.isArray(source.times)) throw new Error('Invalid rainfall contour frames')

  const forecastStart = Number.isInteger(source.findex) ? Math.max(0, Number(source.findex)) : 0
  const frames = source.imgs.slice(forecastStart).flatMap((value, index) => {
    if (typeof value !== 'string' || !FRAME_PATH.test(value)) return []
    const time = source.times?.[forecastStart + index]
    return [{
      imageUrl: `/api/weather/city-rainfall/frame?path=${encodeURIComponent(value)}`,
      time: typeof time === 'string' ? time : '',
    }]
  })
  if (!frames.length) throw new Error('No forecast rainfall frames')

  return {
    retrievedAt: new Date().toISOString(),
    rainfall: {
      frames,
      publishedAt: sourceText.match(/@cdate:([^*]+)\*\//)?.[1]?.trim() || null,
    },
  }
}

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > FRESH_FOR && !pending) {
    pending = readCityRainfall().then(result => { cached = result }).catch(error => {
      console.warn('[city-rainfall]', error instanceof Error ? error.message : 'Unknown error')
    }).finally(() => { pending = null })
  }
  if (pending) await pending

  if (cached && age() < STALE_FOR) {
    return Response.json({ available: true, ...cached }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=240' },
    })
  }
  return Response.json({ available: false, rainfall: null }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
