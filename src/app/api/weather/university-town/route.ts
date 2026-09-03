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

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    const source = (await response.json()) as SourceResponse

    if (!response.ok || !source.success || !source.result?.obtT) {
      throw new Error('Invalid weather response')
    }

    const result = source.result
    return Response.json(
      {
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
      },
      { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60' } },
    )
  } catch {
    return Response.json(
      { available: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 503 },
    )
  }
}
