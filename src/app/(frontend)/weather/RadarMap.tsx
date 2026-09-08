'use client'

import 'leaflet/dist/leaflet.css'

import type { ImageOverlay, Map as LeafletMap } from 'leaflet'
import { useEffect, useRef, useState } from 'react'

type RadarData = {
  bounds: { east: number; north: number; south: number; west: number }
  colorChart: null | { colors?: string[]; dataname?: string; unit?: string; values?: string[] }
  dataTime: string
  frames: { imageUrl: string; observedAt: string; time: string }[]
}

const OFFICIAL_RADAR_URL = 'https://szqxapp1.121.com.cn/phone/api/RedirectWxRadar.do?lat=22.5935&lon=113.9973'

export function RadarMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const overlaysRef = useRef<ImageOverlay[]>([])
  const [radar, setRadar] = useState<RadarData | null>(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/weather/radar', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Radar unavailable')
        return response.json()
      })
      .then(body => {
        if (!body.available || !body.radar) throw new Error('Radar unavailable')
        setRadar(body.radar)
      })
      .catch(error => { if (error?.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!radar || !containerRef.current || mapRef.current) return
    let cancelled = false
    void import('leaflet').then(L => {
      if (cancelled || !containerRef.current) return
      const map = L.map(containerRef.current, { attributionControl: true, zoomControl: true })
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 12,
      }).addTo(map)

      const bounds = L.latLngBounds(
        [radar.bounds.south, radar.bounds.west],
        [radar.bounds.north, radar.bounds.east],
      )
      overlaysRef.current = radar.frames.map((frame, index) => L.imageOverlay(frame.imageUrl, bounds, {
        opacity: index === 0 ? 0.62 : 0,
        interactive: false,
      }).addTo(map))

      L.circleMarker([22.5935, 113.9973], {
        color: '#ffffff', fillColor: '#d9482f', fillOpacity: 1, radius: 7, weight: 3,
      }).bindTooltip('南方科技大学', { direction: 'top' }).addTo(map)
      map.setView([22.5935, 113.9973], 9)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      overlaysRef.current = []
    }
  }, [radar])

  useEffect(() => {
    overlaysRef.current.forEach((overlay, index) => overlay.setOpacity(index === frameIndex ? 0.62 : 0))
  }, [frameIndex])

  useEffect(() => {
    if (!playing || !radar?.frames.length) return
    const timer = window.setInterval(() => setFrameIndex(index => (index + 1) % radar.frames.length), 850)
    return () => window.clearInterval(timer)
  }, [playing, radar])

  const selectedFrame = radar?.frames[frameIndex]

  return (
    <section className="radar-product" aria-labelledby="radar-title">
      <div className="radar-heading">
        <div><span className="eyebrow">WEATHER RADAR</span><h2 id="radar-title">雷达图像</h2></div>
        <p>查看珠三角最新雷达回波及其移动变化。</p>
      </div>
      <div className="radar-shell">
        <div className="radar-map" ref={containerRef} aria-label="深圳及珠三角天气雷达图">
          {!radar && !failed && <div className="radar-status">正在加载最新雷达图像…</div>}
          {failed && <div className="radar-status">雷达数据暂时无法加载，请稍后再试。</div>}
        </div>
        <div className="radar-controls">
          <button type="button" onClick={() => setPlaying(value => !value)} disabled={!radar}>
            {playing ? '暂停' : '播放'}
          </button>
          <input
            aria-label="选择雷达图像时间"
            disabled={!radar}
            max={Math.max(0, (radar?.frames.length || 1) - 1)}
            min="0"
            onChange={event => { setPlaying(false); setFrameIndex(Number(event.target.value)) }}
            type="range"
            value={frameIndex}
          />
          <strong>{selectedFrame?.time || '--:--'}</strong>
        </div>
        <div className="radar-meta">
          <span>数据来源：深圳市气象局</span>
          <span>{selectedFrame?.observedAt ? `观测时间：${selectedFrame.observedAt}` : '约每6分钟更新'}</span>
          <a href={OFFICIAL_RADAR_URL} rel="noreferrer" target="_blank">打开官方雷达图 ↗</a>
        </div>
      </div>
    </section>
  )
}
