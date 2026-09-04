// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks() })

it('shares concurrent requests and retains successful data when the source fails', async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    success: true, result: { obtT: '28', obtId: 'G3565' },
  })))
  vi.stubGlobal('fetch', fetchMock)
  const { GET } = await import('../../src/app/api/weather/university-town/route')
  const responses = await Promise.all([GET(), GET(), GET()])
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect((await responses[0].json()).temperature).toBe('28')
  await vi.advanceTimersByTimeAsync(61_000)
  fetchMock.mockRejectedValue(new Error('network failure'))
  const fallback = GET()
  await vi.advanceTimersByTimeAsync(500)
  expect(await (await fallback).json()).toMatchObject({ temperature: '28', stale: true })
  expect(fetchMock).toHaveBeenCalledTimes(3)
  await GET()
  expect(fetchMock).toHaveBeenCalledTimes(3)
  await vi.advanceTimersByTimeAsync(30 * 60_000)
  const expired = GET()
  await vi.advanceTimersByTimeAsync(500)
  expect((await expired).status).toBe(503)
})
