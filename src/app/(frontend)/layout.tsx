import type { Metadata } from 'next'
import React from 'react'

import { getSiteSettings } from '@/utilities/getSiteSettings'

import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import './styles.css'

// Public pages read CMS content from the production database at request time.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings.seo?.title || settings.clubName || '南方科技大学气象社'
  const seoShareImage = settings.seo?.shareImage
  const shareImage = seoShareImage && typeof seoShareImage === 'object' ? seoShareImage.url : undefined

  return {
    description: settings.seo?.description || '南方科技大学气象社信息、活动动态与常用资源展示平台',
    openGraph: shareImage ? { images: [shareImage] } : undefined,
    title: { default: title, template: `%s｜${title}` },
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
