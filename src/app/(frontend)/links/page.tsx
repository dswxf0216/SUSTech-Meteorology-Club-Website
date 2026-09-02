import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@/payload.config'

export const metadata: Metadata = { title: '友情链接' }
export const dynamic = 'force-dynamic'

export default async function LinksPage() {
  const payload = await getPayload({ config })
  const links = await payload.find({ collection: 'links', limit: 100, sort: 'order', where: { enabled: { equals: true } } })

  return (
    <div className="page-wrap section-pad">
      <div className="container">
        <header className="page-heading"><span className="eyebrow">资源导航</span><h1>友情链接</h1><p>汇集社团平台、学习资源、合作组织与常用网站，所有链接均可在后台持续维护。</p></header>
        {links.docs.length ? (
          <div className="link-grid">
            {links.docs.map((link) => <a className="link-card" href={link.url} key={link.id} rel="noreferrer" target="_blank"><span className="link-category">{link.category}</span><h2>{link.name}</h2><p>{link.description || '访问相关网站了解更多信息。'}</p><span className="text-link">打开网站 ↗</span></a>)}
          </div>
        ) : (
          <div className="large-empty-state"><span>↗</span><h2>还没有公开链接</h2><p>在后台“网站与资源链接”中新增并启用链接后，它们会自动显示在这里。</p></div>
        )}
      </div>
    </div>
  )
}
