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
import { ForecastWeather } from './components/ForecastWeather'
import { ForecastTemperature } from './components/ForecastTemperature'
import { MediaImage } from './components/MediaImage'
import styles from './home-workbench.module.css'
import '../../../tokens.css'

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
  return (
    <div className={styles.home}>
      <section className={styles.intro}>
        <div className={styles.introCopy}>
          <div className={styles.brandLine}>
            <span>{heroEyebrow}</span>
          </div>
          <h1>{heroHeading}</h1>
          <p>{slogan}</p>
        </div>
        <nav className={styles.quickLinks} aria-label="首页快捷入口">
          <Link href="/weather">天气信息 <span>↗</span></Link>
          <Link href="/about">认识我们 <span>↗</span></Link>
          <Link href="/links">友情链接 <span>↗</span></Link>
        </nav>
      </section>

      <main className={styles.workbench}>
        <header className={styles.workbenchHeader}>
          <div>
            <span className={styles.status}><i /> LIVE WEATHER DESK</span>
            <h2>校园天气工作台</h2>
          </div>
          <p>为南科的天空“把脉”</p>
        </header>

        <div className={styles.radarFrame}>
          <div className={styles.panelLabel}><span>珠三角雷达</span><span>组合反射率 · 自动更新</span></div>
          <RadarMap />
        </div>

        <div className={styles.observationGrid}>
          <section className={styles.stationPanel} aria-labelledby="station-panel-title">
            <div className={styles.panelLabel}><span id="station-panel-title">实时观测</span><span>大学城自动站</span></div>
            <WeatherStationCard compact />
            <Link className={styles.inlineLink} href="/weather#history">查询过去24小时实况序列 <span>→</span></Link>
          </section>

          <section className={styles.forecastPanel} aria-labelledby="forecast-panel-title">
            <div className={styles.panelLabel}><span id="forecast-panel-title">天气预报与预警</span><span>每日更新</span></div>
            <div className="home-forecast-dashboard">
              <div className="home-forecast-top">
                <TodayWeather day={forecasts.docs[0]?.threeDayForecast?.[0]} forecastDate={forecasts.docs[0]?.forecastDate} />
                <WeatherWarnings />
              </div>
              <ThreeDayWeather days={forecasts.docs[0]?.threeDayForecast} forecastDate={forecasts.docs[0]?.forecastDate} />
            </div>
            <Link className={styles.inlineLink} href="/weather/forecast">查询南科每日天气预报 <span>→</span></Link>
          </section>
        </div>
      </main>

      <section className={styles.resources}>
        <div className={styles.resourceIntro}>
          <h2>信息与资源</h2>
          <p>了解社团信息，查看天气资料，并访问常用的气象相关网站。</p>
        </div>
        <div className={styles.resourceLinks}>
          <Link href="/weather"><strong>天气信息</strong><span>实时观测与每日预报 →</span></Link>
          <Link href="/about"><strong>社团简介</strong><span>宗旨、文化与主要活动 →</span></Link>
          <Link href="/links"><strong>友情链接</strong><span>气象资料与合作组织 →</span></Link>
        </div>
      </section>

      <section className={styles.updates}>
        <div className={styles.contentColumns}>
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
    </div>
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
