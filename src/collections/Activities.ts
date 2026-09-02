import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access/contentAccess'
import { createSlug, validatePublicUrl } from '../utilities/slug'

export const Activities: CollectionConfig = {
  slug: 'activities',
  labels: { singular: '活动', plural: '活动' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startAt', 'location', '_status'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 20,
  },
  hooks: {
    beforeValidate: [({ data }) => {
      if (data?.title && !data.slug) data.slug = createSlug(data.title)
      return data
    }],
  },
  fields: [
    { name: 'title', label: '活动名称', type: 'text', required: true },
    { name: 'slug', label: '网址标识', type: 'text', required: true, unique: true, index: true, admin: { description: '留空时将根据活动名称自动生成；发布后不建议修改。' } },
    { name: 'summary', label: '活动简介', type: 'textarea', required: true, maxLength: 300 },
    { name: 'cover', label: '封面', type: 'upload', relationTo: 'media' },
    { name: 'startAt', label: '开始时间', type: 'date', required: true },
    { name: 'endAt', label: '结束时间', type: 'date' },
    { name: 'location', label: '地点', type: 'text' },
    { name: 'content', label: '活动介绍', type: 'richText' },
    { name: 'gallery', label: '活动照片', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'relatedLinks',
      label: '相关链接',
      type: 'array',
      fields: [
        { name: 'label', label: '链接名称', type: 'text', required: true },
        { name: 'url', label: '网址', type: 'text', required: true, validate: validatePublicUrl },
      ],
    },
    { name: 'featured', label: '首页推荐', type: 'checkbox', defaultValue: false },
  ],
}
