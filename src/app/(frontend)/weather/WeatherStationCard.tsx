'use client'

import { useCallback, useEffect, useState } from 'react'

type WeatherData = {
  apparentTemperature: string | null
  available: boolean
  description: string | null
  humidity: string | null
  observedAt: string | null
  pressure: string | null
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

const REFRESH_INTERVAL = 5 * 60 * 1000
const SOURCE_PAGE = 'https://szqxapp1.121.com.cn/sztq-app/web/'

function valueOrDash(value: string | null | undefined) {
  return value || '—'
}

export function WeatherStationCard() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [failed, setFailed] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/weather/university-town', { cache: 'no-store' })
      if (!response.ok) throw new Error('Weather request failed')
      const nextData = (await response.json()) as WeatherData
      setData(nextData)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [refresh])

  return (
    <>
      <section className="station-weather-card" aria-live="polite">
        <div className="station-weather-copy">
          <div><span className="status-dot" /><span className="weather-location">南山 · 大学城自动站</span></div>
          <p className="station-weather-label">实时温度</p>
          {data ? (
            <div className="station-temperature-value"><strong>{data.temperature}</strong><span>°C</span></div>
          ) : (
            <strong className="station-message">{failed ? '数据暂时不可用' : '正在读取…'}</strong>
          )}
          <p className="station-description">{data?.description ?? '深圳市自动气象站观测'}</p>
          <p className="station-observed">观测时间：{data?.observedAt ?? '—'} · 站号 {data?.stationId ?? 'G3565'}</p>
        </div>
        <div className="station-weather-info">
          <div><span>体感温度</span><strong>{valueOrDash(data?.apparentTemperature)}</strong></div>
          <div><span>相对湿度</span><strong>{valueOrDash(data?.humidity)}</strong></div>
          <div><span>风向风速</span><strong>{data ? `${valueOrDash(data.windDirection)} ${valueOrDash(data.windSpeed)}` : '—'}</strong></div>
          <div><span>风力</span><strong>{valueOrDash(data?.windForce)}</strong></div>
          <div><span>气压</span><strong>{valueOrDash(data?.pressure)}</strong></div>
          <div><span>能见度</span><strong>{valueOrDash(data?.visibility)}</strong></div>
          <div><span>1 小时降雨</span><strong>{valueOrDash(data?.rainfall1h)}</strong></div>
          <div><span>24 小时降雨</span><strong>{valueOrDash(data?.rainfall24h)}</strong></div>
        </div>
      </section>
      <div className="notice-card">
        <strong>数据说明</strong>
        <p>数据来自深圳天气“南山－大学城”自动站，每 5 分钟自动检查更新。自动站观测可能因设备维护而短时缺测，仅作天气参考。<a href={SOURCE_PAGE} rel="noreferrer" target="_blank">查看深圳天气官方页面 ↗</a></p>
      </div>
    </>
  )
}
