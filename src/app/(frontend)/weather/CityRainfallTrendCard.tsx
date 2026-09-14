'use client'

import 'leaflet/dist/leaflet.css'

import type { ImageOverlay, Map as LeafletMap } from 'leaflet'
import { useEffect, useRef, useState } from 'react'

type CityRainfallData = {
  frames: { imageUrl: string; time: string }[]
  publishedAt: string | null
}

const SHENZHEN: [number, number] = [22.55, 114.05]
const YIDAN_LIBRARY: [number, number] = [22.6002995, 113.9932586]
const IMAGE_BOUNDS = {
  south: 19.0419,
  west: 108.505,
  north: 26.0419,
  east: 117.505,
}
const OFFICIAL_URL = 'https://weather.sz.gov.cn/qixiangfuwu/qixiangjiance/jiangyuguce/index.html'
const RAINFALL_LEGEND = [
  { color: '#38d8de', label: '小雨' },
  { color: '#259b37', label: '中雨' },
  { color: '#f4ed36', label: '大雨' },
  { color: '#f04b43', label: '暴雨' },
  { color: '#b52eb4', label: '大暴雨' },
]

export function CityRainfallTrendCard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const overlaysRef = useRef<ImageOverlay[]>([])
  const [rainfall, setRainfall] = useState<CityRainfallData | null>(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/weather/city-rainfall', { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('City rainfall unavailable')
        return response.json()
      })
      .then(body => {
        if (!body.available || !body.rainfall?.frames?.length) throw new Error('City rainfall unavailable')
        setRainfall(body.rainfall)
      })
      .catch(error => { if (error?.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!rainfall || !containerRef.current || mapRef.current) return
    let cancelled = false
    void import('leaflet').then(L => {
      if (cancelled || !containerRef.current) return
      const map = L.map(containerRef.current, { attributionControl: true, zoomControl: true })
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      const bounds = L.latLngBounds(
        [IMAGE_BOUNDS.south, IMAGE_BOUNDS.west],
        [IMAGE_BOUNDS.north, IMAGE_BOUNDS.east],
      )
      overlaysRef.current = rainfall.frames.map((frame, index) => L.imageOverlay(frame.imageUrl, bounds, {
        opacity: index === 0 ? 0.7 : 0,
        interactive: false,
      }).addTo(map))
      L.circleMarker(YIDAN_LIBRARY, {
        color: '#ffffff',
        fillColor: '#d9482f',
        fillOpacity: 1,
        radius: 7,
        weight: 3,
      }).bindTooltip('南方科技大学 · 一丹图书馆', { direction: 'top' }).addTo(map)
      map.setView(SHENZHEN, 8)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      overlaysRef.current = []
    }
  }, [rainfall])

  useEffect(() => {
    overlaysRef.current.forEach((overlay, index) => overlay.setOpacity(index === frameIndex ? 0.7 : 0))
  }, [frameIndex])

  useEffect(() => {
    if (!playing || !rainfall?.frames.length) return
    const timer = window.setInterval(() => setFrameIndex(index => (index + 1) % rainfall.frames.length), 900)
    return () => window.clearInterval(timer)
  }, [playing, rainfall])

  const selectedFrame = rainfall?.frames[frameIndex]

  return <section className="city-rainfall-card" aria-labelledby="city-rainfall-title">
    <header>
      <div>
        <span>全市降水动向</span>
        <h2 id="city-rainfall-title">深圳全市 · 未来两小时</h2>
      </div>
      <strong>色块预报</strong>
    </header>
    <p>逐帧查看深圳及周边降水区域的移动和变化。</p>
    <div className="city-rainfall-map" ref={containerRef} aria-label="深圳全市未来两小时降水色块预报图">
      {!rainfall && !failed && <div className="city-rainfall-status">正在加载全市降水动向…</div>}
      {failed && <div className="city-rainfall-status">全市降水预报暂时无法加载，请稍后再试。</div>}
      {rainfall && <aside className="city-rainfall-legend" aria-label="一小时累计降雨等级图例">
        <strong>1小时累计降雨</strong>
        <div>
          {RAINFALL_LEGEND.map(entry => <span key={entry.label}>
            <i aria-hidden="true" style={{ backgroundColor: entry.color }} />
            <b>{entry.label}</b>
          </span>)}
        </div>
      </aside>}
    </div>
    <div className="city-rainfall-controls">
      <button type="button" onClick={() => setPlaying(value => !value)} disabled={!rainfall}>
        {playing ? '暂停' : '播放'}
      </button>
      <input
        aria-label="选择全市降水预报时间"
        disabled={!rainfall}
        max={Math.max(0, (rainfall?.frames.length || 1) - 1)}
        min="0"
        onChange={event => { setPlaying(false); setFrameIndex(Number(event.target.value)) }}
        type="range"
        value={frameIndex}
      />
    </div>
    <footer>
      <span>{selectedFrame?.time ? `预报时刻：${selectedFrame.time}` : '约每6分钟更新'}</span>
      <a href={OFFICIAL_URL} rel="noreferrer" target="_blank">打开官方降雨估测图 ↗</a>
    </footer>
  </section>
}
