import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { MediaImage } from '../components/MediaImage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '文章与推文' }

export default async function ArticlesPage() {
  const payload = await getPayload({ config })
  const articles = await payload.find({
    collection: 'articles',
    depth: 1,
    limit: 50,
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
  })

  return (
    <div className="page-wrap section-pad">
      <div className="container">
        <header className="page-heading">
          <span className="eyebrow">社团动态</span><h1>文章与推文</h1>
          <p>发布社团通知、活动回顾、科普内容与外部平台推文。</p>
        </header>
        {articles.docs.length ? (
          <div className="archive-list">
            {articles.docs.map((article) => {
              const external = article.contentType === 'external' && article.externalUrl
              const content = <><div className="archive-cover"><MediaImage media={article.cover} /></div><div className="archive-copy"><div className="archive-meta"><span>{formatDate(article.publishedAt)}</span>{article.categories?.[0] && <span>{article.categories[0]}</span>}</div><h2>{article.title}</h2><p>{article.summary}</p><strong>{external ? '阅读原文 ↗' : '查看详情 →'}</strong></div></>
              return external ? <a className="archive-item" href={article.externalUrl!} key={article.id} rel="noreferrer" target="_blank">{content}</a> : <Link className="archive-item" href={`/articles/${article.slug}`} key={article.id}>{content}</Link>
            })}
          </div>
        ) : <EmptyArchive text="后台发布文章或推文后，会自动显示在这里。" />}
      </div>
    </div>
  )
}

function EmptyArchive({ text }: { text: string }) {
  return <div className="large-empty-state"><span>文</span><h2>暂无文章</h2><p>{text}</p></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}
