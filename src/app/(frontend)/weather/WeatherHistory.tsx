'use client'

import { useEffect, useRef, useState } from 'react'

type Point = { time: string; value: number | null }
type History = { available: boolean; stale: boolean; observedAt: string; retrievedAt: string; series: Record<string, Point[]> }
const elements = [['temperature', '气温', '℃'], ['rhHistory', '相对湿度', '%'], ['wind', '风速', 'm/s'], ['rain', '雨量', 'mm'], ['paHistory', '气压', 'hPa']]

export function WeatherHistory() {
  const [data, setData] = useState<History | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      let delay = 60_000
      try {
        const response = await fetch('/api/weather/university-town/history', { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]) })
        if (!response.ok) throw new Error('History unavailable')
        const next: History = await response.json()
        if (!next.available) throw new Error('Empty history')
        if (controller.signal.aborted) return
        setData(next)
        setFailed(false)
        if (next.stale) delay = 15_000
      } catch {
        if (controller.signal.aborted) return
        setFailed(true)
        setData(previous => previous && Date.now() - Date.parse(previous.retrievedAt) < 30 * 60_000 ? previous : null)
        delay = 15_000
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, delay)
    }
    timer = setTimeout(refresh, 0)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])
  return <section id="history" className="weather-history">
    <h2>过去24小时实况序列</h2>
    <p className="history-caption">大学城站 · 北京时间 · 逐时采样</p>
    <div role="status">{!data ? <p>{failed ? '历史数据暂不可用，正在自动重试。' : '正在读取历史实况…'}</p> : <p className="history-caption">{data.observedAt}{failed || data.stale ? ' · 暂用上次数据，正在重试' : ''}</p>}</div>
    {data && elements.map(([key, name, unit]) => <HistoryPlot key={key} points={data.series[key] || []} name={name} unit={unit} />)}
    <p className="history-caption">来源：深圳天气。序列按接口顺序跨日排列，已排除末尾重复小时的实时点；缺测不补零。雨量为接口返回值，统计时段口径待核实，不作为累计量相加。</p>
  </section>
}

function HistoryPlot({ points, name, unit }: { points: Point[]; name: string; unit: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(240, entries[0].contentRect.width)))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const values = points.flatMap(p => p.value === null ? [] : [p.value])
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const pad = (max - min) * .15 || .5
  const low = name === '雨量' ? 0 : min - pad
  const high = max + pad
  const x = (i: number) => 54 + i * (width - 72) / Math.max(1, points.length - 1)
  const y = (v: number) => 98 - (v - low) / (high - low) * 76
  const path = points.map((p, i) => p.value === null ? '' : `${i === 0 || points[i - 1].value === null ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const ticks = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])).filter(i => i >= 0)
  return <div className="history-plot" ref={ref}>
    <h3>{name} <small>/{unit}</small></h3>
    {!values.length ? <p>暂无该要素历史数据</p> : <svg viewBox={`0 0 ${width} 130`} role="img" aria-label={`${name}历史曲线，最小${min}，最大${max}${unit}`}>
      {[low, (low + high) / 2, high].map(v => <g key={v}><line x1={50} x2={width - 12} y1={y(v)} y2={y(v)} className="history-grid" /><text x={44} y={y(v) + 4} textAnchor="end">{v.toFixed(name === '相对湿度' ? 0 : 1)}</text></g>)}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {points.map((p, i) => p.value === null ? null : <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="currentColor"><title>{p.time}：{p.value}{unit}</title></circle>)}
      {ticks.map(i => <text key={i} x={x(i)} y={120} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{points[i]?.time}</text>)}
    </svg>}
    <details><summary>查看{name}数值</summary><div className="history-values">{points.map((p, i) => <span key={i}>{p.time}：{p.value ?? '缺测'}{p.value === null ? '' : unit}</span>)}</div></details>
  </div>
}
