import { parseTemperatureRange } from '@/utilities/temperatureRange'

export function ForecastTemperature({
  high,
  low,
  text,
}: {
  high?: number | string | null
  low?: number | string | null
  text?: string | null
}) {
  const range = isTemperatureValue(low) && isTemperatureValue(high)
    ? Number(low) <= Number(high) ? [low, high] : [high, low]
    : text
      ? parseTemperatureRange(text)
      : null
  if (!range) return <span className="forecast-temperature">{text || '—'}</span>
  const lowText = String(range[0])
  const highText = String(range[1])
  return <span className="forecast-temperature" aria-label={`最低气温 ${lowText} 摄氏度，最高气温 ${highText} 摄氏度`}>
    <span className="temperature-low" title="最低气温">{lowText}°C</span>
    <span className="temperature-divider" aria-hidden="true">～</span>
    <span className="temperature-high" title="最高气温">{highText}°C</span>
  </span>
}

function isTemperatureValue(value?: number | string | null): value is number | string {
  return (typeof value === 'number' && Number.isFinite(value))
    || (typeof value === 'string' && value !== '' && Number.isFinite(Number(value)))
}
