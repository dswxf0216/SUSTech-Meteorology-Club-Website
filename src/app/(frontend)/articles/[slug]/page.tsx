import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { MediaImage } from '../../components/MediaImage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'articles', depth: 1, limit: 1, where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] } })
  return result.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug)
  return article ? { title: article.title, description: article.summary } : { title: '文章不存在' }
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticle((await params).slug)
  if (!article) notFound()

  return (
    <article className="detail-page section-pad">
      <div className="container detail-container">
        <Link className="back-link" href="/articles">← 返回文章列表</Link>
        <header className="detail-heading">
          <div className="archive-meta"><span>{formatDate(article.publishedAt)}</span>{article.source && <span>来源：{article.source}</span>}</div>
          <h1>{article.title}</h1><p>{article.summary}</p>
        </header>
        <MediaImage className="detail-cover" media={article.cover} preload />
        {article.contentType === 'external' ? (
          <div className="external-notice"><p>这是一篇发布在外部平台的内容。</p>{article.externalUrl && <a className="button button-primary" href={article.externalUrl} rel="noreferrer" target="_blank">前往阅读原文 ↗</a>}</div>
        ) : article.content ? <div className="rich-content"><RichText data={article.content} /></div> : <div className="empty-state">正文尚未填写。</div>}
      </div>
    </article>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}
