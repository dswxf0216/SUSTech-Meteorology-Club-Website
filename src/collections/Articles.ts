import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access/contentAccess'
import { createSlug, validatePublicUrl } from '../utilities/slug'
import { importWechatArticle } from '../utilities/importWechatArticle'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: '文章', plural: '文章与推文' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'contentType', 'publishedAt', '_status'],
    components: {
      beforeList: ['/components/WechatArticleImporter#WechatArticleImporter'],
    },
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
  endpoints: [
    {
      path: '/import-wechat',
      method: 'post',
      handler: importWechatArticle,
    },
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      if (data?.title && !data.slug) data.slug = createSlug(data.title)
      return data
    }],
  },
  fields: [
    { name: 'title', label: '标题', type: 'text', required: true },
    { name: 'slug', label: '网址标识', type: 'text', required: true, unique: true, index: true, admin: { description: '留空时将根据标题自动生成；发布后不建议修改。' } },
    { name: 'summary', label: '摘要', type: 'textarea', required: true, maxLength: 300 },
    { name: 'cover', label: '封面', type: 'upload', relationTo: 'media' },
    {
      name: 'contentType',
      label: '内容类型',
      type: 'radio',
      required: true,
      defaultValue: 'internal',
      options: [
        { label: '站内文章', value: 'internal' },
        { label: '外部推文或网页', value: 'external' },
      ],
    },
    {
      name: 'content',
      label: '正文',
      type: 'richText',
      admin: { condition: (_, siblingData) => siblingData.contentType === 'internal' && !siblingData.importedHtml },
    },
    {
      name: 'importedHtml',
      label: '微信原始排版',
      type: 'textarea',
      maxLength: 500_000,
      admin: { hidden: true },
    },
    {
      name: 'wechatLayoutPreview',
      label: '微信原排版预览',
      type: 'ui',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData.importedHtml),
        components: { Field: '/components/WechatLayoutPreview#WechatLayoutPreview' },
      },
    },
    {
      name: 'externalUrl',
      label: '原文链接',
      type: 'text',
      validate: validatePublicUrl,
      admin: { condition: (_, siblingData) => siblingData.contentType === 'external' },
    },
    { name: 'source', label: '来源', type: 'text' },
    { name: 'publishedAt', label: '发布日期', type: 'date', required: true },
    {
      name: 'categories',
      label: '分类',
      type: 'select',
      hasMany: true,
      options: ['社团动态', '活动回顾', '通知公告', '招新信息', '成果展示'],
    },
    { name: 'featured', label: '首页推荐', type: 'checkbox', defaultValue: false },
  ],
}
