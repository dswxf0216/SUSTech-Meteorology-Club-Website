import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { DailyForecastSection } from './DailyForecastSection'
import { WeatherStationCard } from './WeatherStationCard'
import { WeatherHistory } from './WeatherHistory'

export const metadata: Metadata = { title: '天气信息' }

export const dynamic = 'force-dynamic'

export default async function WeatherPage({ searchParams }: { searchParams: Promise<{ forecastId?: string }> }) {
  const { forecastId } = await searchParams
  const payload = await getPayload({ config })
  const forecasts = await payload.find({
    collection: 'daily-forecasts',
    limit: 1,
    sort: '-forecastDate',
    where: forecastId
      ? { and: [{ id: { equals: forecastId } }, { _status: { equals: 'published' } }] }
      : { _status: { equals: 'published' } },
  })

  return (
    <>
      <div className="page-wrap section-pad weather-anchor-section" id="weather-observations">
        <div className="container">
          <header className="page-heading">
            <span className="eyebrow">校园及周边观测</span><h1>天气信息</h1>
            <p>大学城自动气象站最新实况、最近24小时温湿风雨压序列与每日天气预报。</p>
          </header>
          <div className="weather-layout"><div><WeatherStationCard /></div><WeatherHistory /></div>
        </div>
      </div>
      <DailyForecastSection forecast={forecasts.docs[0] ?? null} />
    </>
  )
}
