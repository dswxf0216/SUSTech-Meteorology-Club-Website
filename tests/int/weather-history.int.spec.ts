// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
it('merges requests, removes live duplicate hour and preserves missing values', async () => {
  vi.resetModules()
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, result: {
    obtId: 'G3565', describe: '实况', temperature: [{ time: '9时', value: '26' }, { time: '10时', value: '27' }, { time: '10时', value: '28' }],
    rain: [{ time: '9时', value: '' }, { time: '10时', value: '0' }],
  } })))
  vi.stubGlobal('fetch', fetchMock)
  const { GET } = await import('../../src/app/api/weather/university-town/history/route')
  const [response] = await Promise.all([GET(), GET()])
  const body = await response.json()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(body.series.temperature).toHaveLength(2)
  expect(body.series.temperature[1].value).toBe(27)
  expect(body.series.rain[0].value).toBeNull()
  expect(body.series.rain[1].value).toBe(0)
  expect(body.series.wind).toEqual([])
})
