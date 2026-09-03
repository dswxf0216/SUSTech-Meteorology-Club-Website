'use client'

import { useEffect, useState } from 'react'

const REFRESH_INTERVAL = 5 * 60 * 1000
const SOURCE_IMAGE =
  'https://wx.121.com.cn/weixin/WeChat/data/mobile/temperature/AWS_NanShan_T_1_1.png'
const SOURCE_PAGE = 'https://wx.121.com.cn/MobileWeather/districtWeather_newMap.html'

export function WeatherStationCard() {
  const [refreshKey, setRefreshKey] = useState(() => Date.now())
  const [imageState, setImageState] = useState<'loading' | 'available' | 'error'>('loading')
  const [readAt, setReadAt] = useState<Date | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setImageState('loading')
      setRefreshKey(Date.now())
    }, REFRESH_INTERVAL)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <section className="station-weather-card" aria-live="polite">
        <div className="station-weather-copy">
          <div><span className="status-dot" /><span className="weather-location">南山区北部目标站点</span></div>
          <p className="station-weather-label">实时温度</p>
          <div className="station-temperature">
            <div className="station-temperature-crop" aria-hidden={imageState !== 'available'}>
              {/* The source publishes station readings as a transparent 640×841 map overlay. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                key={refreshKey}
                onError={() => setImageState('error')}
                onLoad={() => {
                  setImageState('available')
                  setReadAt(new Date())
                }}
                src={`${SOURCE_IMAGE}?t=${refreshKey}`}
              />
            </div>
            {imageState === 'available' ? <strong>°C</strong> : null}
          </div>
          {imageState !== 'available' ? (
            <strong className="station-message">{imageState === 'error' ? '数据暂时不可用' : '正在读取…'}</strong>
          ) : null}
          <p className="station-observed">
            {readAt ? `最近读取：${readAt.toLocaleString('zh-CN')}` : '正在连接数据源'}
          </p>
        </div>
        <div className="station-weather-info">
          <div><span>区域</span><strong>深圳市南山区</strong></div>
          <div><span>更新频率</span><strong>约 5 分钟检查一次</strong></div>
          <div><span>站点说明</span><strong>截图红圈所示位置</strong></div>
          <div><span>数据来源</span><a href={SOURCE_PAGE} rel="noreferrer" target="_blank">深圳市气象局 ↗</a></div>
        </div>
      </section>
      <div className="notice-card">
        <strong>数据说明</strong>
        <p>数值来自深圳市气象局南山区实时温度分布图。本页面自动读取目标位置；若官方图片版式调整，定位可能需要同步校正。该数据仅作天气参考。</p>
      </div>
    </>
  )
}
