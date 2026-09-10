'use client'

import { useEffect, useState } from 'react'
import { fetchWithTimeout } from '@/utilities/fetchWithTimeout'

type Warning = {
  alarmMean?: string
  area?: string[] | string
  category: 'local' | 'other' | 'citywide'
  desc?: string
  iconUrl?: string | null
  issueTime?: string
  measure?: string
  name?: string
  signalLevel?: string
  signalType?: string
}

const categoryLabel = {
  local: '桃源街道直接生效分区预警',
  other: '深圳其他区域预警',
  citywide: '全市性预警',
}

export function WeatherWarnings() {
  const [warnings, setWarnings] = useState<Warning[] | null>(null)
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetchWithTimeout('/api/weather/warnings', { cache: 'no-store' }, 25_000, controller.signal)
        const data = await response.json()
        if (!controller.signal.aborted) setWarnings(response.ok && data.available ? data.warnings : null)
      } catch {
        if (!controller.signal.aborted) setWarnings(null)
      }
    }
    void load()
    const timer = setInterval(() => void load(), 60_000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (!selectedWarning) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedWarning(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedWarning])

  return <>
    <section className="home-warning-panel">
      <h3>预警信息</h3>
      {warnings === null ? <p className="warning-state">正在读取预警…</p> : warnings.length === 0 ? <p className="warning-state">当前无预警</p> : (
        <div className="warning-list">
          {warnings.map((warning, index) => <article className={`warning-item warning-${warning.category}`} key={`${warning.name}-${warning.issueTime}-${index}`}>
            <div className="warning-summary">
              <button className="warning-icon-button" type="button" onClick={() => setSelectedWarning(warning)} aria-label={`查看${warning.name || '天气预警'}详情`}>
                {warning.iconUrl ? <img src={warning.iconUrl} alt="" /> : <span className="warning-fallback">!</span>}
              </button>
              <strong>{warning.name || `${warning.signalType || ''}${warning.signalLevel || ''}预警`}</strong>
              <small>{categoryLabel[warning.category]}</small>
            </div>
          </article>)}
        </div>
      )}
    </section>
    {selectedWarning && <div className="warning-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedWarning(null) }}>
      <section className="warning-modal" role="dialog" aria-modal="true" aria-labelledby="warning-modal-title">
        <header>
          <div>
            <span className="eyebrow">WEATHER WARNING</span>
            <h3 id="warning-modal-title">{selectedWarning.name || `${selectedWarning.signalType || ''}${selectedWarning.signalLevel || ''}预警`}</h3>
            <p>{categoryLabel[selectedWarning.category]}</p>
          </div>
          <button className="warning-modal-close" type="button" onClick={() => setSelectedWarning(null)} aria-label="关闭预警详情">×</button>
        </header>
        <div className="warning-modal-detail">
          {selectedWarning.issueTime && <p><strong>发布时间：</strong>{selectedWarning.issueTime}</p>}
          {selectedWarning.area && <p><strong>生效区域：</strong>{Array.isArray(selectedWarning.area) ? selectedWarning.area.join('、') : selectedWarning.area}</p>}
          {selectedWarning.desc && <p>{selectedWarning.desc}</p>}
          {selectedWarning.alarmMean && <><h4>预警含义</h4><p>{selectedWarning.alarmMean}</p></>}
          {selectedWarning.measure && <><h4>防御措施</h4><p className="warning-measures">{selectedWarning.measure}</p></>}
        </div>
      </section>
    </div>}
  </>
}
