import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { DailyForecast } from '@/payload-types'
import { getArticlePath } from '@/utilities/articlePath'
import { resolveForecastDayDate } from '@/utilities/forecastDates'
import { getSiteSettings } from '@/utilities/getSiteSettings'

import { WeatherStationCard } from './weather/WeatherStationCard'
import { WeatherWarnings } from './weather/WeatherWarnings'
import { RadarMap } from './weather/RadarMap'
import { PointRainfallCard } from './weather/PointRainfallCard'
import { ForecastWeather } from './components/ForecastWeather'
import { ForecastTemperature } from './components/ForecastTemperature'
import { MediaImage } from './components/MediaImage'

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ forecastId?: string }> }) {
  const { forecastId } = await searchParams
  const payload = await getPayload({ config })
  const [settings, forecasts, articles, activities] = await Promise.all([
    getSiteSettings(),
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

  const heroEyebrow = settings.home?.eyebrow || 'SUSTECH METEOROLOGY CLUB'
  const heroHeading = settings.home?.heading || settings.clubName || '南方科技大学气象社'
  const slogan = settings.home?.description || settings.slogan || '关注天气与气候，传播气象知识，连接每一位对大气科学感兴趣的同学。'
  const logoSrc = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo.url : '/assets/sustech-meteorology-club-logo.png'

  return (
    <>
      <section className="section-pad home-weather-section">
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
          <PointRainfallCard compact />
          <RadarMap />
        </div>
      </section>

      <section className="hero section-pad">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{heroEyebrow}</span>
            <h1>{heroHeading}</h1>
            <p>{slogan}</p>
            <div className="button-row">
              <Link className="button button-primary" href="/about">认识我们</Link>
              <Link className="button button-secondary" href="/links">浏览友情链接</Link>
            </div>
          </div>
          <div className="hero-logo-panel">
            <Image src={logoSrc} alt={`${settings.clubName || '南方科技大学气象社'} Logo`} width={520} height={520} preload />
          </div>
        </div>
      </section>

      <section className="section-pad section-soft">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">网站栏目</span><h2>信息与资源</h2></div>
            <p>了解社团信息，查看天气资料，并访问常用的气象相关网站。</p>
          </div>
          <div className="feature-grid">
            <Link className="feature-card" href="/weather"><span className="feature-number">01</span><h3>天气信息</h3><p>查看大学城自动气象站实时观测与每日天气预报。</p><span className="text-link">查看天气 →</span></Link>
            <Link className="feature-card" href="/about"><span className="feature-number">02</span><h3>社团简介</h3><p>了解气象社的宗旨、发展方向、组织文化与主要活动。</p><span className="text-link">认识社团 →</span></Link>
            <Link className="feature-card" href="/links"><span className="feature-number">03</span><h3>友情链接</h3><p>集中展示气象资料、合作组织与其他常用网站。</p><span className="text-link">浏览链接 →</span></Link>
          </div>
        </div>
      </section>

      <section className="section-pad">
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
