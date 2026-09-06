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
  other: '深圳其他区域分区预警',
  citywide: '全市性预警',
}

export function WeatherWarnings() {
  const [warnings, setWarnings] = useState<Warning[] | null>(null)

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

  return <section className="home-warning-panel">
    <h3>预警信息</h3>
    {warnings === null ? <p className="warning-state">正在读取预警…</p> : warnings.length === 0 ? <p className="warning-state">当前无预警</p> : (
      <div className="warning-list">
        {warnings.map((warning, index) => <details className={`warning-item warning-${warning.category}`} key={`${warning.name}-${warning.issueTime}-${index}`}>
          <summary>
            {warning.iconUrl ? <img src={warning.iconUrl} alt={warning.name || '天气预警'} /> : <span className="warning-fallback">!</span>}
            <span>{warning.name || `${warning.signalType || ''}${warning.signalLevel || ''}预警`}</span>
            <small>{categoryLabel[warning.category]}</small>
          </summary>
          <div className="warning-detail">
            {warning.issueTime && <p><strong>发布时间：</strong>{warning.issueTime}</p>}
            {warning.area && <p><strong>生效区域：</strong>{Array.isArray(warning.area) ? warning.area.join('、') : warning.area}</p>}
            {warning.desc && <p>{warning.desc}</p>}
            {warning.alarmMean && <><h4>预警含义</h4><p>{warning.alarmMean}</p></>}
            {warning.measure && <><h4>防御措施</h4><p className="warning-measures">{warning.measure}</p></>}
          </div>
        </details>)}
      </div>
    )}
  </section>
}
