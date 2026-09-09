import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { DailyForecastSection } from '../DailyForecastSection'

export const metadata: Metadata = { title: '天气预报' }
export const dynamic = 'force-dynamic'

export default async function ForecastPage({ searchParams }: { searchParams: Promise<{ forecastId?: string }> }) {
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

  return <DailyForecastSection forecast={forecasts.docs[0] ?? null} />
}
