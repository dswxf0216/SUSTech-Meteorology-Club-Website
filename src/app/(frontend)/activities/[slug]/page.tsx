import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { MediaImage } from '../../components/MediaImage'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

async function getActivity(slug: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'activities', depth: 1, limit: 1, where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] } })
  return result.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = await getActivity((await params).slug)
  return activity ? { title: activity.title, description: activity.summary } : { title: '活动不存在' }
}

export default async function ActivityDetailPage({ params }: Props) {
  const activity = await getActivity((await params).slug)
  if (!activity) notFound()

  return (
    <article className="detail-page section-pad"><div className="container detail-container">
      <Link className="back-link" href="/activities">← 返回活动列表</Link>
      <header className="detail-heading"><div className="archive-meta"><span>{formatDate(activity.startAt)}</span>{activity.location && <span>{activity.location}</span>}</div><h1>{activity.title}</h1><p>{activity.summary}</p></header>
      <MediaImage className="detail-cover" media={activity.cover} preload />
      <dl className="activity-facts"><div><dt>开始时间</dt><dd>{formatDateTime(activity.startAt)}</dd></div>{activity.endAt && <div><dt>结束时间</dt><dd>{formatDateTime(activity.endAt)}</dd></div>}{activity.location && <div><dt>活动地点</dt><dd>{activity.location}</dd></div>}</dl>
      {activity.content ? <div className="rich-content"><RichText data={activity.content} /></div> : <div className="empty-state">活动介绍尚未填写。</div>}
      {!!activity.gallery?.length && <section className="detail-section"><h2>活动照片</h2><div className="gallery-grid">{activity.gallery.map((media, index) => <MediaImage media={media} key={typeof media === 'object' ? media.id : `${media}-${index}`} />)}</div></section>}
      {!!activity.relatedLinks?.length && <section className="detail-section"><h2>相关链接</h2><div className="related-links">{activity.relatedLinks.map((link) => <a href={link.url} key={link.id} rel="noreferrer" target="_blank">{link.label} ↗</a>)}</div></section>}
    </div></article>
  )
}

function formatDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value)) }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
