'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchWithTimeout } from '@/utilities/fetchWithTimeout'

type Point = { time: string; value: number | null }
type History = { available: boolean; stale: boolean; observedAt: string; retrievedAt: string; series: Record<string, Point[]> }
const elements = [['temperature', '气温', '℃'], ['rhHistory', '相对湿度', '%'], ['wind', '风速', 'm/s'], ['rain', '雨量', 'mm'], ['paHistory', '气压', 'hPa']]

export function WeatherHistory() {
  const [data, setData] = useState<History | null>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState('temperature')
  const [, name, unit] = elements.find(([key]) => key === selected)!
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      let delay = 60_000
      try {
        const response = await fetchWithTimeout('/api/weather/university-town/history', { cache: 'no-store' }, 25_000, controller.signal)
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
    <div className="history-tabs" role="group" aria-label="选择气象要素">{elements.map(([key, label]) => <button type="button" key={key} aria-pressed={selected === key} onClick={() => setSelected(key)}>{label}</button>)}</div>
    {data && <HistoryPlot key={selected} points={data.series[selected] || []} name={name} unit={unit} element={selected} />}
    <p className="history-caption">来源：深圳天气。序列按接口顺序跨日排列，已排除末尾重复小时的实时点；缺测不补零。雨量为接口返回值，统计时段口径待核实，不作为累计量相加。</p>
  </section>
}

function HistoryPlot({ points, name, unit, element }: { points: Point[]; name: string; unit: string; element: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(420, entries[0].contentRect.width)))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const values = points.flatMap(p => p.value === null ? [] : [p.value])
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const baseStep = element === 'temperature' || element === 'paHistory' ? 2 : element === 'rhHistory' ? 10 : 1
  const step = Math.max(baseStep, Math.ceil((max - min) / (4 * baseStep)) * baseStep)
  const low = element === 'rain' || element === 'wind' ? 0 : element === 'rhHistory' ? Math.max(0, Math.floor(min / step) * step - step) : Math.floor(min / step) * step - step
  const high = element === 'rhHistory' ? Math.min(100, Math.ceil(max / step) * step + step) : Math.max(low + step * 3, Math.ceil(max / step) * step + step)
  const yTicks = Array.from({ length: Math.round((high - low) / step) + 1 }, (_, i) => low + i * step)
  const x = (i: number) => 62 + i * (width - 82) / Math.max(1, points.length - 1)
  const y = (v: number) => 290 - (v - low) / (high - low) * 260
  const color = ({ temperature: '#277bb5', rhHistory: '#7956b4', wind: '#c07820', rain: '#27834c', paHistory: '#526777' } as Record<string, string>)[element]
  const barWidth = Math.max(3, (width - 82) / Math.max(1, points.length) * .65)
  const path = points.map((p, i) => p.value === null ? '' : `${i === 0 || points[i - 1].value === null ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  return <div className="history-plot" ref={ref}>
    <h3>{name} <small>/{unit}</small></h3>
    <p className="history-point-value" role="status">{active !== null && points[active] ? `${points[active].time} · ${name}：${points[active].value ?? '缺测'}${points[active].value === null ? '' : unit}` : '悬停或点选图中时次查看数值'}</p>
    {!values.length ? <p>暂无该要素历史数据</p> : <svg viewBox={`0 0 ${width} 350`} role="img" aria-label={`${name}历史${element === 'rain' ? '柱状' : '折线'}图，最小${min}，最大${max}${unit}`} onPointerLeave={() => setActive(null)} onPointerMove={event => {
      const box = event.currentTarget.getBoundingClientRect()
      const px = (event.clientX - box.left) * width / box.width
      setActive(Math.max(0, Math.min(points.length - 1, Math.round((px - 62) / (width - 82) * (points.length - 1)))))
    }}>
      {yTicks.map(v => <g key={v}><line x1={50} x2={width - 12} y1={y(v)} y2={y(v)} className="history-grid" /><text x={44} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
      {element !== 'rain' && <path d={path} fill="none" stroke={color} strokeWidth="2.5" />}
      {points.map((p, i) => p.value === null ? null : element === 'rain' ? <rect key={i} x={x(i) - barWidth / 2} y={y(p.value)} width={barWidth} height={Math.max(0, y(0) - y(p.value))} fill={color}><title>{p.time}：{p.value}{unit}</title></rect> : <circle key={i} cx={x(i)} cy={y(p.value)} r={active === i ? 5 : 3} fill={color}><title>{p.time}：{p.value}{unit}</title></circle>)}
      {active !== null && <line x1={x(active)} x2={x(active)} y1={30} y2={290} stroke={color} strokeDasharray="3 4" opacity=".5" />}
      {element === 'rain' && max === 0 && <text x={width - 16} y={22} textAnchor="end">所示时次雨量均为 0 mm</text>}
      {points.map((p, i) => <text key={i} transform={`translate(${x(i)},305) rotate(-90)`} textAnchor="end">{p.time}</text>)}
    </svg>}
    <details><summary>查看{name}数值</summary><div className="history-values">{points.map((p, i) => <span key={i}>{p.time}：{p.value ?? '缺测'}{p.value === null ? '' : unit}</span>)}</div></details>
  </div>
}
