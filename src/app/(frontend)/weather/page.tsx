import type { Metadata } from 'next'

import { WeatherStationCard } from './WeatherStationCard'
import { WeatherHistory } from './WeatherHistory'

export const metadata: Metadata = { title: '天气信息' }

export default function WeatherPage() {
  return (
    <div className="page-wrap section-pad">
      <div className="container">
        <header className="page-heading">
          <span className="eyebrow">校园及周边观测</span><h1>天气信息</h1>
          <p>大学城自动气象站最新实况与最近24小时温湿风雨压序列。</p>
        </header>
        <div className="weather-layout"><div><WeatherStationCard /></div><WeatherHistory /></div>
      </div>
    </div>
  )
}
