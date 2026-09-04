import { parseTemperatureRange } from '@/utilities/temperatureRange'

export function ForecastTemperature({ text }: { text?: string | null }) {
  const range = text ? parseTemperatureRange(text) : null
  if (!range) return <span className="forecast-temperature">{text || '—'}</span>
  return <span className="forecast-temperature" aria-label={`最低气温 ${range[0]} 摄氏度，最高气温 ${range[1]} 摄氏度`}>
    <span className="temperature-low" title="最低气温">{range[0]}°C</span>
    <span className="temperature-divider" aria-hidden="true">～</span>
    <span className="temperature-high" title="最高气温">{range[1]}°C</span>
  </span>
}
