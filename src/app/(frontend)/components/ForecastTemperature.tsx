import { parseTemperatureRange } from '@/utilities/temperatureRange'

export function ForecastTemperature({
  high,
  low,
  text,
}: {
  high?: number | null
  low?: number | null
  text?: string | null
}) {
  const range = typeof low === 'number' && typeof high === 'number'
    ? [Math.min(low, high), Math.max(low, high)] as [number, number]
    : text
      ? parseTemperatureRange(text)
      : null
  if (!range) return <span className="forecast-temperature">{text || '—'}</span>
  return <span className="forecast-temperature" aria-label={`最低气温 ${range[0]} 摄氏度，最高气温 ${range[1]} 摄氏度`}>
    <span className="temperature-low" title="最低气温">{range[0]}°C</span>
    <span className="temperature-divider" aria-hidden="true">～</span>
    <span className="temperature-high" title="最高气温">{range[1]}°C</span>
  </span>
}
