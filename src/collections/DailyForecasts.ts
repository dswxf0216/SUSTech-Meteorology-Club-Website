import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access/contentAccess'

export const DailyForecasts: CollectionConfig = {
  slug: 'daily-forecasts',
  labels: { singular: '每日天气预报', plural: '每日天气预报' },
  admin: {
    useAsTitle: 'forecastDate',
    defaultColumns: ['forecastDate', 'headline', '_status', 'updatedAt'],
    description: '按页面分区编写每日预报。保存为草稿不会公开，确认后再发布。',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'forecastDate',
      label: '预报日期',
      type: 'date',
      required: true,
      unique: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy年M月d日' } },
    },
    { name: 'headline', label: '当日标题／一句话概述', type: 'text', maxLength: 100 },
    {
      name: 'todayObservation',
      label: '今日深圳天气实况',
      type: 'group',
      fields: [
        { name: 'period', label: '实况时段', type: 'text', maxLength: 100 },
        { name: 'temperatureRange', label: '高低温', type: 'text', maxLength: 50 },
        { name: 'averageTemperature', label: '平均温度', type: 'text', maxLength: 50 },
        { name: 'rainfall', label: '降水量与天气现象', type: 'text', maxLength: 100 },
      ],
    },
    {
      name: 'tomorrowForecast',
      label: '明日南科天气预报',
      type: 'group',
      fields: [
        { name: 'period', label: '预报时段', type: 'text', maxLength: 100 },
        { name: 'weather', label: '天气', type: 'text', maxLength: 100 },
        { name: 'temperatureRange', label: '气温', type: 'text', maxLength: 50 },
        { name: 'wind', label: '风向风速', type: 'text', maxLength: 100 },
        { name: 'rainProbability', label: '降水概率', type: 'text', maxLength: 50 },
      ],
    },
    {
      name: 'threeDayForecast',
      label: '三日南科天气预报',
      type: 'array',
      maxRows: 3,
      admin: { description: '每一天增加一行，最多三行。' },
      fields: [
        { name: 'date', label: '日期', type: 'text', required: true, maxLength: 30 },
        { name: 'weather', label: '天气', type: 'text', required: true, maxLength: 100 },
        { name: 'temperatureRange', label: '气温范围', type: 'text', required: true, maxLength: 50 },
      ],
    },
    { name: 'shenzhenOverview', label: '深圳天气概述', type: 'textarea', maxLength: 5000 },
    { name: 'chinaOverview', label: '国内天气概述', type: 'textarea', maxLength: 10000 },
    { name: 'disclaimer', label: '声明', type: 'textarea', maxLength: 500 },
  ],
}
