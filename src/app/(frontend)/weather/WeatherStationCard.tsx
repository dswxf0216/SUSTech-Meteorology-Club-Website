'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'

type StationStatus = {
  available: boolean
  imageUrl: string | null
  observedAt: string | null
  sourceUrl: string
}

const REFRESH_INTERVAL = 5 * 60 * 1000

function formatObservedAt(value: string | null) {
  if (!value) return '更新时间由数据源提供'

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

export function WeatherStationCard() {
  const [status, setStatus] = useState<StationStatus | null>(null)
  const [refreshKey, setRefreshKey] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/weather/nanshan-station', { cache: 'no-store' })
      const nextStatus = (await response.json()) as StationStatus
      setStatus(nextStatus)
      if (nextStatus.available) setRefreshKey(Date.now())
    } catch {
      setStatus({
        available: false,
        imageUrl: null,
        observedAt: null,
        sourceUrl: 'https://wx.121.com.cn/MobileWeather/districtWeather_newMap.html',
      })
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

  const sourceUrl = status?.sourceUrl ?? 'https://wx.121.com.cn/MobileWeather/districtWeather_newMap.html'

  return (
    <>
      <section className="station-weather-card" aria-live="polite">
        <div className="station-weather-copy">
          <div><span className="status-dot" /><span className="weather-location">南山区北部目标站点</span></div>
          <p className="station-weather-label">实时温度</p>
          {status?.available && status.imageUrl ? (
            <div className="station-temperature">
              <Image
                alt="南山区目标站点实时温度数值"
                height="144"
                key={refreshKey}
                src={`${status.imageUrl}?t=${refreshKey}`}
                unoptimized
                width="234"
              />
              <strong>°C</strong>
            </div>
          ) : status === null ? (
            <strong className="station-message">正在读取…</strong>
          ) : (
            <strong className="station-message">数据暂时不可用</strong>
          )}
          <p className="station-observed">{formatObservedAt(status?.observedAt ?? null)}</p>
        </div>
        <div className="station-weather-info">
          <div><span>区域</span><strong>深圳市南山区</strong></div>
          <div><span>更新频率</span><strong>约 5 分钟检查一次</strong></div>
          <div><span>站点说明</span><strong>截图红圈所示位置</strong></div>
          <div><span>数据来源</span><a href={sourceUrl} rel="noreferrer" target="_blank">深圳市气象局 ↗</a></div>
        </div>
      </section>
      <div className="notice-card">
        <strong>数据说明</strong>
        <p>数值来自深圳市气象局南山区实时温度分布图。本页面自动读取目标位置；若官方图片版式调整，定位可能需要同步校正。该数据仅作天气参考。</p>
      </div>
    </>
  )
}
