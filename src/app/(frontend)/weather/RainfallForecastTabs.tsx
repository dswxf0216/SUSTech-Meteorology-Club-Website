'use client'

import { useState } from 'react'

import { CityRainfallTrendCard } from './CityRainfallTrendCard'
import { PointRainfallCard } from './PointRainfallCard'
import { RadarMap } from './RadarMap'

type Tab = 'point' | 'city' | 'radar'

export function RainfallForecastTabs({ includeRadar = false }: { includeRadar?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>(includeRadar ? 'city' : 'point')
  const prefix = includeRadar ? 'home-weather' : 'rainfall'
  const tabs: { id: Tab; label: string }[] = includeRadar
    ? [{ id: 'city', label: '全市降水分布预报' }, { id: 'point', label: '南科大定点预报' }, { id: 'radar', label: '雷达图像' }]
    : [{ id: 'point', label: '南科大定点预报' }, { id: 'city', label: '全市降水分布预报' }]

  return <section className={`rainfall-forecast-tabs${includeRadar ? ' home-weather-tabs' : ''}`} aria-label={includeRadar ? '降水预报与雷达' : '降雨预报'}>
    <div className="rainfall-tab-list" role="tablist" aria-label="切换降雨预报类型">
      {tabs.map(tab => <button
        key={tab.id}
        aria-controls={`${prefix}-${tab.id}-panel`}
        aria-selected={activeTab === tab.id}
        id={`${prefix}-${tab.id}-tab`}
        onClick={() => setActiveTab(tab.id)}
        role="tab"
        type="button"
      >{tab.label}</button>)}
    </div>
    <div
      aria-labelledby={`${prefix}-${activeTab}-tab`}
      id={`${prefix}-${activeTab}-panel`}
      role="tabpanel"
    >
      {activeTab === 'point' ? <PointRainfallCard /> : activeTab === 'city' ? <CityRainfallTrendCard /> : <RadarMap embedded />}
    </div>
    <p className="rainfall-forecast-disclaimer">注：短临降水落区和强度存在非常高的不确定性，不同起报时刻的预报结果可能有明显差异，请谨慎参考</p>
  </section>
}
