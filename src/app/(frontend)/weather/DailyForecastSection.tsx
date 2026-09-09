import type { DailyForecast } from '@/payload-types'
import { resolveForecastDayDate } from '@/utilities/forecastDates'

import { ForecastTemperature } from '../components/ForecastTemperature'
import { ForecastWeather } from '../components/ForecastWeather'

export function DailyForecastSection({ forecast }: { forecast: DailyForecast | null }) {
  return (
    <section className="section-pad forecast-section weather-anchor-section" id="weather-forecast" data-forecast-capture data-forecast-id={forecast?.id}>
      <div className="container">
        <div className="section-heading forecast-heading">
          <div>
            <span className="eyebrow">DAILY FORECAST</span>
            <h2>南科大每日天气预报</h2>
          </div>
          <p>{forecast ? `${formatDate(forecast.forecastDate)} 发布` : '后台发布每日预报后将在这里显示。'}</p>
        </div>
        <div className="forecast-lead">{forecast?.headline || <span className="forecast-placeholder">当日标题／一句话概述</span>}</div>
        <div className="forecast-grid">
          <ForecastBlock title="今日深圳天气实况" periodLabel="实况时段" period="昨日20时至今日20时">
            <ForecastFact label="高低温" value={<ForecastTemperature low={forecast?.todayObservation?.lowTemperature} high={forecast?.todayObservation?.highTemperature} text={forecast?.todayObservation?.temperatureRange} />} />
            <ForecastFact label="均温" value={formatSingleTemperature(forecast?.todayObservation?.averageTemperatureValue, forecast?.todayObservation?.averageTemperature)} />
            <ForecastFact label="降水量" value={formatRainfall(forecast?.todayObservation?.rainfallAmount, forecast?.todayObservation?.rainfall)} />
            <ForecastFact label="量级" value={forecast?.todayObservation?.precipitationLevel} />
          </ForecastBlock>
          <ForecastBlock title="明日南科天气预报" periodLabel="预报时段" period="今日20时至明日20时">
            <ForecastFact label="天气" value={<ForecastWeather text={forecast?.tomorrowForecast?.weather} />} />
            <ForecastFact label="气温" value={<ForecastTemperature low={forecast?.tomorrowForecast?.lowTemperature} high={forecast?.tomorrowForecast?.highTemperature} text={forecast?.tomorrowForecast?.temperatureRange} />} />
            <ForecastFact label="风向风速" value={forecast?.tomorrowForecast?.wind} />
            <ForecastFact label="降水概率" value={forecast?.tomorrowForecast?.rainProbability} />
            <ForecastFact label="降水量" value={formatRainfallRange(forecast?.tomorrowForecast?.rainfallAmountMin, forecast?.tomorrowForecast?.rainfallAmountMax, forecast?.tomorrowForecast?.rainfallAmount, forecast?.tomorrowForecast?.rainfall)} />
            <ForecastFact label="可能的降水时段&雨强预报" value={forecast?.tomorrowForecast?.precipitationTimingIntensity} />
          </ForecastBlock>
          <article className="forecast-block forecast-three-day">
            <h3>三日南科天气预报</h3>
            <div className="three-day-list">
              {(forecast?.threeDayForecast?.length ? forecast.threeDayForecast : [null, null, null]).map((day, index) => (
                <div key={day?.id || index}>
                  <span className="forecast-date">{formatForecastDay(forecast?.forecastDate ? resolveForecastDayDate(forecast.forecastDate, day?.date, index) : day?.date)}</span>
                  <strong><ForecastWeather text={day?.weather || '天气'} /></strong>
                  <ForecastTemperature low={day?.lowTemperature} high={day?.highTemperature} text={day?.temperatureRange || '气温范围'} />
                </div>
              ))}
            </div>
          </article>
        </div>
        <div className="forecast-overviews">
          <ForecastOverview title="深圳天气概述" value={forecast?.shenzhenOverview} />
          <ForecastOverview title="国内天气概述" value={forecast?.chinaOverview} />
        </div>
        <div className="forecast-disclaimer">本预报为非官方天气预报，供服务校内师生使用，仅供参考</div>
      </div>
    </section>
  )
}

function ForecastBlock({ children, period, periodLabel, title }: { children: React.ReactNode; period?: null | string; periodLabel: string; title: string }) {
  return <article className="forecast-block"><h3>{title}</h3><p className="forecast-period"><span>{periodLabel}：</span>{period || '时段说明'}</p><div className="forecast-facts">{children}</div></article>
}

function ForecastFact({ label, value }: { label: string; value?: React.ReactNode }) {
  return <div><span>{label}</span><strong>{value || '—'}</strong></div>
}

function formatSingleTemperature(value?: number | string | null, legacyValue?: string | null) {
  if ((typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value !== '')) return `${value}℃`
  return legacyValue || '—'
}

function formatRainfall(value?: number | null, legacyValue?: string | null) {
  if (typeof value === 'number') return `${value}mm`
  return legacyValue || '—'
}

function formatRainfallRange(min?: number | null, max?: number | null, legacyValue?: number | null, legacyText?: string | null) {
  if (typeof min === 'number' && typeof max === 'number') return min === max ? `${min}mm` : `${min}-${max}mm`
  if (typeof min === 'number') return `${min}mm`
  if (typeof max === 'number') return `${max}mm`
  return formatRainfall(legacyValue, legacyText)
}

function ForecastOverview({ title, value }: { title: string; value?: null | string }) {
  return <article><h3>{title}</h3>{value ? <p>{value}</p> : <p className="forecast-placeholder forecast-placeholder-paragraph">在后台填写后显示此栏目内容。</p>}</article>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

function formatForecastDay(value?: null | string) {
  if (!value) return '日期'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const monthAndDay = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date)
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'Asia/Shanghai' }).format(date)
  return `${monthAndDay} ${weekday}`
}
