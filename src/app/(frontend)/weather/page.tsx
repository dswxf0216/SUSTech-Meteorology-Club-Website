import type { Metadata } from 'next'

export const metadata: Metadata = { title: '天气信息' }

export default function WeatherPage() {
  return (
    <div className="page-wrap section-pad">
      <div className="container narrow-container">
        <header className="page-heading">
          <span className="eyebrow">活动出行参考</span><h1>天气信息</h1>
          <p>天气模块的页面结构已经完成，下一步确认默认城市和数据服务后接入实时天气。</p>
        </header>
        <section className="weather-panel">
          <div className="weather-primary">
            <div><span className="status-dot" /><span className="weather-location">默认城市待确定</span></div>
            <div className="weather-symbol" aria-hidden="true">☀</div><strong>--°</strong><p>尚未接入实时数据</p>
          </div>
          <div className="weather-details">
            <div><span>体感温度</span><strong>--°</strong></div><div><span>降水概率</span><strong>--%</strong></div>
            <div><span>风力</span><strong>--</strong></div><div><span>空气质量</span><strong>--</strong></div>
          </div>
        </section>
        <div className="notice-card"><strong>接入真实天气前需要确认</strong><p>社团所在城市、是否允许访客切换城市、是否展示未来七天预报，以及选用哪一种天气数据服务。</p></div>
      </div>
    </div>
  )
}
