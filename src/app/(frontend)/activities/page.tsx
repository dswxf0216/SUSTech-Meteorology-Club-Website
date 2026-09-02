import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { MediaImage } from '../components/MediaImage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '社团活动' }

export default async function ActivitiesPage() {
  const payload = await getPayload({ config })
  const activities = await payload.find({ collection: 'activities', depth: 1, limit: 50, sort: '-startAt', where: { _status: { equals: 'published' } } })

  return (
    <div className="page-wrap section-pad">
      <div className="container">
        <header className="page-heading"><span className="eyebrow">观察与实践</span><h1>社团活动</h1><p>记录讲座、观测、参访和社团交流活动。</p></header>
        {activities.docs.length ? (
          <div className="activity-grid">
            {activities.docs.map((activity) => <Link className="activity-card" href={`/activities/${activity.slug}`} key={activity.id}><div className="activity-cover"><MediaImage media={activity.cover} /></div><div className="activity-copy"><span>{formatDate(activity.startAt)}</span><h2>{activity.title}</h2><p>{activity.summary}</p>{activity.location && <small>地点：{activity.location}</small>}</div></Link>)}
          </div>
        ) : <div className="large-empty-state"><span>活</span><h2>暂无活动</h2><p>后台发布活动后，会自动显示在这里。</p></div>}
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}
