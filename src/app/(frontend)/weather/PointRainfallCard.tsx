'use client'

import { useEffect, useState } from 'react'
import { fetchWithTimeout } from '@/utilities/fetchWithTimeout'

type RainfallPoint = {
  label: string
  rainfall: string
  rainfallMm: number | null
  state?: string | null
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
  valueKind?: 'rolling-hour'
}

const REFRESH_INTERVAL = 6 * 60_000
const SOURCE_DELAY_WARNING_AFTER = 30 * 60_000

function parseShenzhenForecastTime(value: string | null) {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length < 12) return null
  const timestamp = Date.UTC(
    Number(digits.slice(0, 4)),
    Number(digits.slice(4, 6)) - 1,
    Number(digits.slice(6, 8)),
    Number(digits.slice(8, 10)) - 8,
    Number(digits.slice(10, 12)),
  )
  return Number.isFinite(timestamp) ? timestamp : null
}

function rainfallSummary(data: PointRainfallData | null, failed: boolean) {
  if (!data) return failed ? '定点降雨预报暂不可用' : '正在读取'

  const rainyPoints = data.timeline.filter(point => (point.rainfallMm || 0) > 0)
  if (!rainyPoints.length) return '未来两小时无降水'

  const hasHeavyPeriod = rainyPoints.some(point => (point.rainfallMm || 0) > 10)
  const hasPersistentRain = rainyPoints.length * 6 > 60
  if (hasPersistentRain && hasHeavyPeriod) return '未来两小时将出现持续性降水，部分时段雨强较大，请注意防范'
  if (hasPersistentRain) return '未来两小时将出现持续性降水，请注意防范'
  if (hasHeavyPeriod) return '未来两小时将出现降水，部分时段雨强较大，请注意防范'
  return '未来两小时将出现降水，请注意防范'
}

function formatForecastTime(value: string | null) {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length < 12) return value
  return `${digits.slice(4, 6)}月${digits.slice(6, 8)}日 ${digits.slice(8, 10)}:${digits.slice(10, 12)}`
}

function formatRainfallValue(point: RainfallPoint) {
  if (point.rainfallMm === null) return point.rainfall
  return point.rainfallMm.toFixed(Number.isInteger(point.rainfallMm) ? 0 : 1)
}

export function PointRainfallCard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<PointRainfallData | null>(null)
  const [failed, setFailed] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

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
  const summary = rainfallSummary(data, failed)
  const forecastTimestamp = parseShenzhenForecastTime(data?.forecastTime || null)
  const sourceLongDelayed = forecastTimestamp !== null && currentTime - forecastTimestamp > SOURCE_DELAY_WARNING_AFTER

  return <section className={`point-rainfall-card${compact ? ' point-rainfall-card-compact' : ''}`} aria-live="polite">
    <header>
      <div><h2>南方科技大学 · 未来两小时详细雨强预报</h2></div>
      <strong>{summary}</strong>
    </header>
    {sourceLongDelayed ? <p role="alert" style={{ margin: '12px 0 0', color: 'var(--primary-dark)', fontWeight: 700 }}>
      当前数据源长时间未更新，此为过去起报时段预报结果，请注意甄别
    </p> : null}
    {!compact && data?.timeline.length ? <>
      <p className="point-rainfall-note">每6分钟更新 · 数值为对应时刻雨强</p>
      <div className="point-rainfall-chart">
        <div className="point-rainfall-now"><span>现在</span></div>
        <div className="point-rainfall-timeline" aria-label="未来两小时雨强预报序列" style={{ gridTemplateColumns: `repeat(${data.timeline.length}, minmax(68px, 1fr))` }}>
          {data.timeline.map((point, index) => <div key={`${point.label}-${index}`} title={point.state || undefined}>
            <span aria-hidden="true" className="point-rainfall-bar" data-zero={!point.rainfallMm} style={{ height: `${Math.max(2, ((point.rainfallMm || 0) / maxRainfall) * 100)}%` }} />
            <strong className="point-rainfall-value"><span>{formatRainfallValue(point)}</span><em>mm/h</em></strong>
            <small>{point.label}</small>
          </div>)}
        </div>
      </div>
    </> : null}
    {!compact && data ? <footer>
      <span>预报时间：{formatForecastTime(data.forecastTime)}</span>
      <span>网格位置：{data.gridPoint || '一丹图书馆附近'}</span>
      {data.stale || failed ? <span>暂用最近一次成功数据</span> : null}
    </footer> : null}
  </section>
}
