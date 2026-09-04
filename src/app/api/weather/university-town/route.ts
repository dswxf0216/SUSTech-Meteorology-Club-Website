const SOURCE_URL =
  'https://szqxapp1.121.com.cn/sztq-app/v6/v7/homepage/index?obtId=G3565'

export const runtime = 'nodejs'

type SourceResponse = {
  success?: boolean
  result?: {
    desc?: string
    fcstTime?: string
    obtDataTime?: string
    obtId?: string
    obtName?: string
    obtT?: string
    element?: {
      airPressure?: { obtHpa?: string }
      humidity?: { obtRh?: string }
      rainfall?: { r01hOfObt?: string; r24hOfObt?: string }
      sensibleTemperature?: { aptmp1?: string }
      visibility?: { vis?: string }
      wind?: { obtWs?: string; wd?: string; wf?: string }
    }
  }
}

async function readWeather() {
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
    const source = (await response.json()) as SourceResponse

    if (!response.ok || !source.success || !source.result?.obtT) {
      throw new Error('Invalid weather response')
    }

    const result = source.result
    return {
        available: true,
        stationId: result.obtId ?? 'G3565',
        stationName: result.obtName ?? '大学城',
        observedAt: result.obtDataTime ?? result.fcstTime ?? null,
        retrievedAt: new Date().toISOString(),
        temperature: result.obtT,
        description: result.desc ?? null,
        apparentTemperature: result.element?.sensibleTemperature?.aptmp1 ?? null,
        humidity: result.element?.humidity?.obtRh ?? null,
        windDirection: result.element?.wind?.wd ?? null,
        windSpeed: result.element?.wind?.obtWs ?? null,
        windForce: result.element?.wind?.wf ?? null,
        pressure: result.element?.airPressure?.obtHpa ?? null,
        visibility: result.element?.visibility?.vis ?? null,
        rainfall1h: result.element?.rainfall?.r01hOfObt ?? null,
        rainfall24h: result.element?.rainfall?.r24hOfObt ?? null,
      }
}

let cached: Awaited<ReturnType<typeof readWeather>> | null = null
let pending: Promise<void> | null = null
let retryAfter = 0
const MAX_AGE = 30 * 60_000

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > 30_000 && Date.now() >= retryAfter) {
    if (!pending) {
      pending = (async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            cached = await readWeather()
            retryAfter = 0
            return
          } catch (error) {
            console.warn('[weather] upstream request failed', {
              attempt: attempt + 1,
              reason: error instanceof Error ? error.message : 'Unknown error',
            })
            if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        retryAfter = Date.now() + 15_000
      })().finally(() => { pending = null })
    }
    await pending
  }
  if (cached && age() < MAX_AGE) {
    return Response.json({ ...cached, stale: age() > 60_000 }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
  return Response.json({ available: false }, {
    headers: { 'Cache-Control': 'no-store', 'Retry-After': '15' }, status: 503,
  })
}
