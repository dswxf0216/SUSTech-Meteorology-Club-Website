import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/contentAccess'
import { validatePublicUrl } from '../utilities/slug'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '网站设置',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    { name: 'clubName', label: '社团名称', type: 'text', required: true, defaultValue: '南方科技大学气象社' },
    { name: 'slogan', label: '社团口号', type: 'text' },
    {
      name: 'home',
      label: '首页设置',
      type: 'group',
      fields: [
        { name: 'eyebrow', label: '首页英文标题', type: 'text', defaultValue: 'SUSTECH METEOROLOGY CLUB' },
        { name: 'heading', label: '首页主标题', type: 'text', defaultValue: '南方科技大学气象社' },
        { name: 'description', label: '首页介绍', type: 'textarea' },
      ],
    },
    { name: 'introduction', label: '社团简介', type: 'richText' },
    { name: 'aboutLead', label: '简介页引导语', type: 'textarea' },
    {
      name: 'aboutValues',
      label: '社团理念',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'title', label: '标题', type: 'text', required: true },
        { name: 'description', label: '说明', type: 'textarea', required: true },
      ],
    },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'contactEmail', label: '联系邮箱', type: 'email' },
    { name: 'joinUrl', label: '加入社团链接', type: 'text', validate: validatePublicUrl },
    { name: 'footerText', label: '页脚文字', type: 'text' },
    {
      name: 'navigation',
      label: '顶部导航',
      type: 'array',
      maxRows: 8,
      defaultValue: [
        { label: '主页', url: '/' },
        { label: '天气信息', url: '/weather' },
        { label: '社团简介', url: '/about' },
        { label: '友情链接', url: '/links' },
      ],
      fields: [
        { name: 'label', label: '显示名称', type: 'text', required: true },
        { name: 'url', label: '链接地址', type: 'text', required: true },
        { name: 'newTab', label: '在新窗口打开', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'seo',
      label: '搜索与分享设置',
      type: 'group',
      fields: [
        { name: 'title', label: '网站标题', type: 'text' },
        { name: 'description', label: '网站描述', type: 'textarea', maxLength: 180 },
        { name: 'shareImage', label: '分享图片', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
