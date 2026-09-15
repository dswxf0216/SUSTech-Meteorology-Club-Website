'use client'

import { useState } from 'react'

import { CityRainfallTrendCard } from './CityRainfallTrendCard'
import { PointRainfallCard } from './PointRainfallCard'

type Tab = 'point' | 'city'

export function RainfallForecastTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('point')

  return <section className="rainfall-forecast-tabs" aria-label="降雨预报">
    <div className="rainfall-tab-list" role="tablist" aria-label="切换降雨预报类型">
      <button
        aria-controls="point-rainfall-panel"
        aria-selected={activeTab === 'point'}
        id="point-rainfall-tab"
        onClick={() => setActiveTab('point')}
        role="tab"
        type="button"
      >南科大定点预报</button>
      <button
        aria-controls="city-rainfall-panel"
        aria-selected={activeTab === 'city'}
        id="city-rainfall-tab"
        onClick={() => setActiveTab('city')}
        role="tab"
        type="button"
      >全市降水分布预报</button>
    </div>
    <div
      aria-labelledby={`${activeTab}-rainfall-tab`}
      id={`${activeTab}-rainfall-panel`}
      role="tabpanel"
    >
      {activeTab === 'point' ? <PointRainfallCard /> : <CityRainfallTrendCard />}
    </div>
    <p className="rainfall-forecast-disclaimer">注：短临降水落区和强度存在非常高的不确定性，不同起报时刻的预报结果可能有明显差异，请谨慎参考</p>
  </section>
}
