'use client'

import { useEffect, useState } from 'react'
import { fetchWithTimeout } from '@/utilities/fetchWithTimeout'

type RainfallPoint = {
  label: string
  rainfall: string
  rainfallMm: number | null
}

type PointRainfallData = {
  available: boolean
  forecastTime: string | null
  gridPoint: string | null
  hasRain: boolean
  location: string
  retrievedAt: string
  stale?: boolean
  timeline: RainfallPoint[]
}

const REFRESH_INTERVAL = 6 * 60_000

function formatForecastTime(value: string | null) {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length < 12) return value
  return `${digits.slice(4, 6)}月${digits.slice(6, 8)}日 ${digits.slice(8, 10)}:${digits.slice(10, 12)}`
}

export function PointRainfallCard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<PointRainfallData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()

    async function refresh() {
      let delay = REFRESH_INTERVAL
      try {
        const response = await fetchWithTimeout('/api/weather/point-rainfall', { cache: 'no-store' }, 15_000, controller.signal)
        if (!response.ok) throw new Error('Rainfall request failed')
        const next = await response.json() as PointRainfallData
        if (!next.available) throw new Error('Rainfall unavailable')
        if (stopped) return
        setData(next)
        setFailed(false)
        if (next.stale) delay = 30_000
      } catch {
        if (stopped) return
        setFailed(true)
        delay = 30_000
      }
      if (!stopped) timer = setTimeout(() => void refresh(), delay)
    }

    timer = setTimeout(() => void refresh(), 0)
    return () => {
      stopped = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  if (compact && (!data || !data.hasRain)) return null

  const maxRainfall = Math.max(0.1, ...(data?.timeline.map(point => point.rainfallMm || 0) || []))
  const status = data
    ? data.hasRain ? '未来两小时可能有雨，请留意临近天气变化。' : '未来两小时暂无降雨。'
    : failed ? '定点降雨预报暂不可用，正在自动重试。' : '正在读取定点降雨预报…'

  return <section className={`point-rainfall-card${compact ? ' point-rainfall-card-compact' : ''}`} aria-live="polite">
    <header>
      <div><span>定点降雨预报</span><h2>一丹图书馆 · 未来两小时</h2></div>
      <strong data-rain={data?.hasRain ? 'expected' : data ? 'none' : 'loading'}>{data?.hasRain ? '可能有雨' : data ? '暂无降雨' : '读取中'}</strong>
    </header>
    <p className="point-rainfall-status">{status}</p>
    {!compact && data?.timeline.length ? <div className="point-rainfall-timeline" aria-label="未来两小时降雨预报序列" style={{ gridTemplateColumns: `repeat(${data.timeline.length}, minmax(54px, 1fr))` }}>
      {data.timeline.map((point, index) => <div key={`${point.label}-${index}`}>
        <span aria-hidden="true" className="point-rainfall-bar" style={{ height: `${Math.max(4, ((point.rainfallMm || 0) / maxRainfall) * 100)}%` }} />
        <strong>{point.rainfall}</strong>
        <small>{point.label}</small>
      </div>)}
    </div> : null}
    {!compact && data ? <footer>
      <span>预报时间：{formatForecastTime(data.forecastTime)}</span>
      <span>网格位置：{data.gridPoint || '一丹图书馆附近'}</span>
      {data.stale || failed ? <span>暂用最近一次成功数据</span> : null}
    </footer> : null}
  </section>
}
