import { weatherSymbols, type WeatherSymbol } from '@/utilities/weatherSymbols'

export function ForecastWeather({ text }: { text?: string | null }) {
  const symbols = text ? weatherSymbols(text) : []
  return <span className="forecast-weather">
    {symbols.length > 0 && <span className="forecast-weather-symbols" aria-hidden="true">{symbols.map((symbol, i) => <span className="forecast-symbol-item" key={i}>{i > 0 && <span className="forecast-symbol-arrow">→</span>}<WeatherIcon symbol={symbol} /></span>)}</span>}
    <span className="forecast-weather-text">{text || '—'}</span>
  </span>
}

function WeatherIcon({ symbol }: { symbol: WeatherSymbol }) {
  const sun = ['sun', 'cloudSun', 'shower'].includes(symbol)
  const cloud = !['sun', 'fog', 'haze'].includes(symbol)
  const rainCount = ({ lightRain: 1, rain: 2, heavyRain: 3, stormRain: 4, shower: 2, thunder: 2, sleet: 1 } as Partial<Record<WeatherSymbol, number>>)[symbol] || 0
  return <svg viewBox="0 0 64 64" width="52" height="52" focusable="false">
    {sun && <g stroke="#e7aa22" strokeWidth="2.5" strokeLinecap="round"><circle cx="40" cy="21" r="9" fill="#ffd35a" />{Array.from({ length: 8 }, (_, i) => <path key={i} d="M40 5v3" transform={`rotate(${i * 45} 40 21)`} />)}</g>}
    {cloud && <path d="M16 43C4 43 4 28 16 27C16 13 36 11 40 25C55 21 62 43 47 43Z" fill={symbol === 'cloud' ? '#cbd8e3' : '#edf5fa'} stroke="#89a5bd" strokeWidth="2" />}
    {Array.from({ length: rainCount }, (_, i) => <path key={i} d={`M${18 + i * 8} 48l-3 ${symbol === 'stormRain' ? 10 : 6}`} stroke="#328bc5" strokeWidth="2.7" strokeLinecap="round" />)}
    {symbol === 'thunder' && <path d="M36 38l-7 13h7l-4 11 15-17h-9l5-7Z" fill="#edb42a" />}
    {['snow', 'sleet'].includes(symbol) && <g stroke="#559cca" strokeWidth="1.8"><path d="M38 46v14m-6-10 12 6m-12 0 12-6" /></g>}
    {['fog', 'haze'].includes(symbol) && <g stroke={symbol === 'fog' ? '#91a6b9' : '#b29d75'} strokeWidth="4" strokeLinecap="round"><path d="M12 22h38M8 32h46M15 42h33" /></g>}
  </svg>
}
