import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { DailyForecast } from '@/payload-types'
import { getArticlePath } from '@/utilities/articlePath'
import { resolveForecastDayDate } from '@/utilities/forecastDates'

import { WeatherStationCard } from './weather/WeatherStationCard'
import { WeatherWarnings } from './weather/WeatherWarnings'
import { RainfallForecastTabs } from './weather/RainfallForecastTabs'
import { ForecastWeather } from './components/ForecastWeather'
import { ForecastTemperature } from './components/ForecastTemperature'
import { MediaImage } from './components/MediaImage'

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ forecastId?: string }> }) {
  const { forecastId } = await searchParams
  const payload = await getPayload({ config })
  const [forecasts, articles, activities] = await Promise.all([
    payload.find({
      collection: 'daily-forecasts',
      limit: 1,
      sort: '-forecastDate',
      where: forecastId
        ? { and: [{ id: { equals: forecastId } }, { _status: { equals: 'published' } }] }
        : { _status: { equals: 'published' } },
    }),
    payload.find({ collection: 'articles', limit: 3, sort: '-publishedAt', where: { _status: { equals: 'published' } } }),
    payload.find({ collection: 'activities', limit: 3, sort: '-startAt', where: { _status: { equals: 'published' } } }),
  ])

  return (
    <>
      <section className="section-pad home-weather-section module-band">
        <div className="container">
          <div className="home-weather-heading">
            <span className="eyebrow">CAMPUS WEATHER OBSERVATIONS AND FORECASTS</span>
            <h2>校园天气实况与预报</h2>
          </div>
          <div className="home-weather-layout">
            <div className="home-weather-column">
              <div className="home-station-dashboard">
                <div className="home-forecast-dashboard-label">
                  <strong>实时观测</strong>
                </div>
                <WeatherStationCard compact />
              </div>
              <Link className="weather-history-link" href="/weather#history">查询过去24小时实况序列 →</Link>
            </div>
            <div className="home-weather-column">
              <div className="home-forecast-dashboard">
                <div className="home-forecast-dashboard-label">
                  <strong>天气预报与预警</strong>
                </div>
                <div className="home-forecast-top">
                  <TodayWeather day={forecasts.docs[0]?.threeDayForecast?.[0]} forecastDate={forecasts.docs[0]?.forecastDate} />
                  <WeatherWarnings />
                </div>
                <ThreeDayWeather days={forecasts.docs[0]?.threeDayForecast} forecastDate={forecasts.docs[0]?.forecastDate} />
              </div>
              <Link className="weather-history-link" href="/weather/forecast">查询南科每日天气预报 →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad module-band module-band-gray home-nowcast-section">
        <div className="container"><RainfallForecastTabs includeRadar /></div>
      </section>

      <section className="section-pad module-band">
        <div className="container content-columns">
          <ContentSection eyebrow="近期内容" title="最新文章" empty="后台发布文章后，将自动显示在这里。">
            {articles.docs.map((article) => {
              const content = <><div className="content-item-cover"><MediaImage media={article.cover} /></div><div className="content-item-copy"><span>{formatDate(article.publishedAt)}</span><h3>{article.title}</h3>{article.summary && <p>{article.summary}</p>}</div></>
              return article.contentType === 'external' && article.externalUrl
                ? <a className="content-item content-item-with-cover" href={article.externalUrl} key={article.id} rel="noreferrer" target="_blank">{content}</a>
                : <Link className="content-item content-item-with-cover" href={getArticlePath(article)} key={article.id}>{content}</Link>
            })}
          </ContentSection>
          <ContentSection eyebrow="社团现场" title="近期活动" empty="后台发布活动后，将自动显示在这里。">
            {activities.docs.map((activity) => <Link className="content-item" href={`/activities/${activity.slug}`} key={activity.id}><span>{formatDate(activity.startAt)}</span><h3>{activity.title}</h3><p>{activity.summary}</p></Link>)}
          </ContentSection>
        </div>
      </section>
    </>
  )
}

type ThreeDayEntry = NonNullable<DailyForecast['threeDayForecast']>[number]

function TodayWeather({ day, forecastDate }: { day?: ThreeDayEntry | null; forecastDate?: null | string }) {
  return <article className="home-today-weather">
    <h3>今日天气</h3>
    <span className="forecast-date">{formatForecastDay(forecastDate ? resolveForecastDayDate(forecastDate, day?.date, 0) : day?.date)}</span>
    <strong><ForecastWeather text={day?.weather || '天气'} /></strong>
    <ForecastTemperature low={day?.lowTemperature} high={day?.highTemperature} text={day?.temperatureRange || '气温范围'} />
  </article>
}

function ThreeDayWeather({ days, forecastDate }: { days?: DailyForecast['threeDayForecast'] | null; forecastDate?: null | string }) {
  const entries = days?.length ? days : [null, null, null]
  return <article className="home-three-day">
    <h3>三日天气</h3>
    <div className="three-day-list">
      {entries.map((day, index) => <div key={day?.id || index}>
        <span className="forecast-date">{formatForecastDay(forecastDate ? resolveForecastDayDate(forecastDate, day?.date, index) : day?.date)}</span>
        <strong><ForecastWeather text={day?.weather || '天气'} /></strong>
        <ForecastTemperature low={day?.lowTemperature} high={day?.highTemperature} text={day?.temperatureRange || '气温范围'} />
      </div>)}
    </div>
  </article>
}

function ContentSection({ children, empty, eyebrow, title }: { children: React.ReactNode[]; empty: string; eyebrow: string; title: string }) {
  return <div><div className="section-heading compact"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div><div className="content-list">{children.length ? children : <div className="empty-state">{empty}</div>}</div></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

function formatForecastDay(value?: null | string) {
  if (!value) return '日期'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const monthAndDay = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(date)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(date)

  return `${monthAndDay} ${weekday}`
}
