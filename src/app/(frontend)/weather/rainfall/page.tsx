import type { Metadata } from 'next'

import { RainfallForecastTabs } from '../RainfallForecastTabs'

export const metadata: Metadata = { title: '降水预报' }

export default function RainfallPage() {
  return <div className="page-wrap">
    <section className="section-pad module-band"><div className="container">
      <header className="page-heading">
        <span className="eyebrow">短临降水预报</span><h1>降水预报</h1>
        <p>查看南科大未来两小时详细雨强与深圳全市降水分布预报。</p>
      </header>
    </div></section>
    <section className="section-pad module-band module-band-gray">
      <div className="container"><RainfallForecastTabs /></div>
    </section>
  </div>
}
