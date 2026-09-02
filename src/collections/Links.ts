import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/contentAccess'
import { validatePublicUrl } from '../utilities/slug'

export const Links: CollectionConfig = {
  slug: 'links',
  labels: { singular: '链接', plural: '网站与资源链接' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'enabled', 'order'],
  },
  access: {
    read: ({ req }) => (req.user ? true : { enabled: { equals: true } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: '名称', type: 'text', required: true },
    { name: 'url', label: '网址', type: 'text', required: true, validate: validatePublicUrl },
    { name: 'description', label: '说明', type: 'textarea' },
    {
      name: 'category',
      label: '分类',
      type: 'select',
      required: true,
      options: ['社团平台', '学习资料', '合作组织', '友情链接', '其他'],
    },
    { name: 'icon', label: '图标', type: 'upload', relationTo: 'media' },
    { name: 'order', label: '排序', type: 'number', defaultValue: 0 },
    { name: 'enabled', label: '启用', type: 'checkbox', defaultValue: true },
  ],
}
