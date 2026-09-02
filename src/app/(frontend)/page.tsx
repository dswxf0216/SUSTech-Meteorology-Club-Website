import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [settings, articles, activities] = await Promise.all([
    getSiteSettings(),
    payload.find({ collection: 'articles', limit: 3, sort: '-publishedAt', where: { _status: { equals: 'published' } } }),
    payload.find({ collection: 'activities', limit: 3, sort: '-startAt', where: { _status: { equals: 'published' } } }),
  ])

  const heroEyebrow = settings.home?.eyebrow || 'SUSTECH METEOROLOGY CLUB'
  const heroHeading = settings.home?.heading || settings.clubName || '南方科技大学气象社'
  const slogan = settings.home?.description || settings.slogan || '关注天气与气候，传播气象知识，连接每一位对大气科学感兴趣的同学。'
  const logoSrc = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo.url : '/assets/sustech-meteorology-club-logo.png'

  return (
    <>
      <section className="hero section-pad">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{heroEyebrow}</span>
            <h1>{heroHeading}</h1>
            <p>{slogan}</p>
            <div className="button-row">
              <Link className="button button-primary" href="/about">认识我们</Link>
              <Link className="button button-secondary" href="/links">浏览友情链接</Link>
            </div>
          </div>
          <div className="hero-logo-panel">
            <Image src={logoSrc} alt={`${settings.clubName || '南方科技大学气象社'} Logo`} width={520} height={520} preload />
          </div>
        </div>
      </section>

      <section className="section-pad section-soft">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">网站栏目</span><h2>信息与资源</h2></div>
            <p>了解社团信息，查看天气资料，并访问常用的气象相关网站。</p>
          </div>
          <div className="feature-grid">
            <Link className="feature-card" href="/weather"><span className="feature-number">01</span><h3>天气信息</h3><p>提供校园及周边天气参考，真实数据将在确认服务后接入。</p><span className="text-link">查看天气 →</span></Link>
            <Link className="feature-card" href="/about"><span className="feature-number">02</span><h3>社团简介</h3><p>了解气象社的宗旨、发展方向、组织文化与主要活动。</p><span className="text-link">认识社团 →</span></Link>
            <Link className="feature-card" href="/links"><span className="feature-number">03</span><h3>友情链接</h3><p>集中展示气象资料、合作组织与其他常用网站。</p><span className="text-link">浏览链接 →</span></Link>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container content-columns">
          <ContentSection eyebrow="近期内容" title="最新文章" empty="后台发布文章后，将自动显示在这里。">
            {articles.docs.map((article) => article.contentType === 'external' && article.externalUrl ? <a className="content-item" href={article.externalUrl} key={article.id} rel="noreferrer" target="_blank"><span>{formatDate(article.publishedAt)}</span><h3>{article.title}</h3><p>{article.summary}</p></a> : <Link className="content-item" href={`/articles/${article.slug}`} key={article.id}><span>{formatDate(article.publishedAt)}</span><h3>{article.title}</h3><p>{article.summary}</p></Link>)}
          </ContentSection>
          <ContentSection eyebrow="社团现场" title="近期活动" empty="后台发布活动后，将自动显示在这里。">
            {activities.docs.map((activity) => <Link className="content-item" href={`/activities/${activity.slug}`} key={activity.id}><span>{formatDate(activity.startAt)}</span><h3>{activity.title}</h3><p>{activity.summary}</p></Link>)}
          </ContentSection>
        </div>
      </section>
    </>
  )
}

function ContentSection({ children, empty, eyebrow, title }: { children: React.ReactNode[]; empty: string; eyebrow: string; title: string }) {
  return <div><div className="section-heading compact"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div><div className="content-list">{children.length ? children : <div className="empty-state">{empty}</div>}</div></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}
