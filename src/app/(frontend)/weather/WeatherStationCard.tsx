'use client'

import { useEffect, useState } from 'react'
import { dewPoint } from '@/utilities/dewPoint'
import { fetchWithTimeout } from '@/utilities/fetchWithTimeout'

type WeatherData = {
  apparentTemperature: string | null
  available: boolean
  stale?: boolean
  description: string | null
  humidity: string | null
  observedAt: string | null
  pressure: string | null
  retrievedAt: string
  rainfall1h: string | null
  rainfall24h: string | null
  stationId: string
  stationName: string
  temperature: string
  visibility: string | null
  windDirection: string | null
  windForce: string | null
  windSpeed: string | null
}

const REFRESH_INTERVAL = 60 * 1000
const SOURCE_PAGE = 'https://szqxapp1.121.com.cn/sztq-app/web/'

function valueOrDash(value: string | null | undefined) {
  return value || '—'
}

export function WeatherStationCard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const storageKey = 'university-town-weather-v1'
    const maxAge = 30 * 60_000
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as WeatherData | null
      if (saved?.available && saved.stationId === 'G3565' && Date.now() - Date.parse(saved.retrievedAt) < maxAge) {
        setData({ ...saved, stale: true })
      }
    } catch { /* Storage may be disabled. */ }
    const refresh = async () => {
    let delay = REFRESH_INTERVAL
    try {
      const response = await fetchWithTimeout(
        '/api/weather/university-town',
        { cache: 'no-store' },
        25_000,
        controller.signal,
      )
      if (!response.ok) throw new Error('Weather request failed')
      const nextData = (await response.json()) as WeatherData
      if (!nextData.available || !nextData.temperature) throw new Error('Invalid weather data')
      if (stopped) return
      setData(nextData)
      setFailed(false)
      try { localStorage.setItem(storageKey, JSON.stringify(nextData)) } catch { /* Optional cache. */ }
      if (nextData.stale) delay = 15_000
    } catch {
      if (stopped) return
      setFailed(true)
      setData(previous => previous && Date.now() - Date.parse(previous.retrievedAt) < maxAge ? previous : null)
      delay = 15_000
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

  return (
    <>
      <section className={`station-weather-card${compact ? ' station-weather-card-compact' : ''}`} aria-live="polite">
        <div className="station-weather-copy">
          <div><span className="status-dot" /><span className="weather-location">南山 · 大学城自动站</span></div>
          <p className="station-weather-label">实时温度</p>
          {data ? (
            <div className="station-temperature-value"><strong>{data.temperature}</strong><span>°C</span></div>
          ) : (
            <strong className="station-message">{failed ? '数据暂时不可用' : '正在读取…'}</strong>
          )}
          <p className="station-description">{data?.description ?? '深圳市自动气象站观测'}</p>
          <p className="station-observed">实况时间：{data?.observedAt ?? '—'} · 站号 {data?.stationId ?? 'G3565'}</p>
          {data ? <p className="station-retrieved">本站读取：{new Date(data.retrievedAt).toLocaleString('zh-CN')}</p> : null}
          {(failed || data?.stale) ? <p className="station-observed">{data ? '显示上次成功读取的数据，请留意实况时间；正在自动重试更新。' : '暂未取得数据，正在自动重试，无需刷新页面。'}</p> : null}
        </div>
        <div className="station-weather-info">
          <div title="根据同一份实况气温与相对湿度，使用 Magnus 近似公式计算；非直接观测值。"><span>露点温度（计算值）</span><strong>{valueOrDash(dewPoint(data?.temperature, data?.humidity))}</strong></div>
          <div><span>相对湿度</span><strong>{valueOrDash(data?.humidity)}</strong></div>
          <div><span>风向风速</span><strong>{data ? `${valueOrDash(data.windDirection)} ${valueOrDash(data.windSpeed)}` : '—'}</strong></div>
          <div><span>风力</span><strong>{valueOrDash(data?.windForce)}</strong></div>
          <div><span>气压</span><strong>{valueOrDash(data?.pressure)}</strong></div>
          <div><span>能见度</span><strong>{valueOrDash(data?.visibility)}</strong></div>
          <div><span>1 小时降雨</span><strong>{valueOrDash(data?.rainfall1h)}</strong></div>
          <div><span>24 小时降雨</span><strong>{valueOrDash(data?.rainfall24h)}</strong></div>
        </div>
      </section>
      {!compact ? <div className="notice-card">
        <strong>数据说明</strong>
        <p>数据来自深圳天气“南山－大学城”自动站，每分钟自动检查更新。自动站观测可能因设备维护而短时缺测，仅作天气参考。<a href={SOURCE_PAGE} rel="noreferrer" target="_blank">查看深圳天气官方页面 ↗</a></p>
      </div> : null}
    </>
  )
}
