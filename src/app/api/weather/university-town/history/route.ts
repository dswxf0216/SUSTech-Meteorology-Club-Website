export const runtime = 'nodejs'

const keys = ['temperature', 'rhHistory', 'wind', 'rain', 'paHistory'] as const
type Point = { time: string; value: number | null }
type History = { observedAt: string; retrievedAt: string; series: Record<string, Point[]> }
let cached: History | null = null
let pending: Promise<void> | null = null
let retryAfter = 0

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > 60_000 && Date.now() >= retryAfter) {
    pending ??= (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch('https://szqxapp1.121.com.cn/sztq-app/v6/v7/meteorologicalObt/topics?obtId=G3565&cityId=28060159493', {
            cache: 'no-store', signal: AbortSignal.timeout(10_000),
          })
          if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
          const body = await response.json()
          if (!body.success || body.result?.obtId !== 'G3565') throw new Error('Invalid station response')
          const series: Record<string, Point[]> = {}
          for (const key of keys) {
            const source = body.result[key]
            const points: Point[] = Array.isArray(source) ? source.filter(p => /^\d{1,2}时$/.test(p?.time)).map(p => ({
              time: p.time,
              value: p.value !== null && p.value !== '' && Number.isFinite(Number(p.value)) ? Number(p.value) : null,
            })) : []
            // The app appends a live point with the same hour label. Keep hourly observations only.
            if (points.length > 1 && points.at(-1)?.time === points.at(-2)?.time) points.pop()
            series[key] = points.slice(-24)
          }
          if (!series.temperature.some(p => p.value !== null)) throw new Error('Empty history')
          cached = { observedAt: String(body.result.describe || ''), retrievedAt: new Date().toISOString(), series }
          retryAfter = 0
          return
        } catch (error) {
          console.warn('[weather-history]', error instanceof Error ? error.message : 'Unknown error')
          if (!attempt) await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      retryAfter = Date.now() + 15_000
    })().finally(() => { pending = null })
    await pending
  }
  return cached && age() < 30 * 60_000
    ? Response.json({ ...cached, available: true, stale: age() > 120_000 }, { headers: { 'Cache-Control': 'no-store' } })
    : Response.json({ available: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
}
