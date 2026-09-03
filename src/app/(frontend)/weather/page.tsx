import type { Metadata } from 'next'

import { WeatherStationCard } from './WeatherStationCard'

export const metadata: Metadata = { title: '天气信息' }

export default function WeatherPage() {
  return (
    <div className="page-wrap section-pad">
      <div className="container narrow-container">
        <header className="page-heading">
          <span className="eyebrow">校园及周边观测</span><h1>天气信息</h1>
          <p>读取南山区自动气象站分布图，为社团活动和日常出行提供实时温度参考。</p>
        </header>
        <WeatherStationCard />
      </div>
    </div>
  )
}
