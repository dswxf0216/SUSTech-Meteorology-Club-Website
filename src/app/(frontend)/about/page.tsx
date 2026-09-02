import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'

import { getSiteSettings } from '@/utilities/getSiteSettings'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '社团简介' }

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const values = settings.aboutValues?.length ? settings.aboutValues : [
    { id: 'communication', title: '交流', description: '创造友好、开放的信息与经验交流空间。' },
    { id: 'practice', title: '实践', description: '通过活动与项目，让兴趣转化为真实经历。' },
    { id: 'connection', title: '连接', description: '连接成员、资源与更多志同道合的伙伴。' },
  ]

  return (
    <div className="page-wrap section-pad">
      <div className="container narrow-container">
        <header className="page-heading">
          <span className="eyebrow">关于我们</span><h1>南方科技大学气象社</h1>
          <p>{settings.aboutLead || settings.slogan || '关注天气与气候，传播气象知识，开展气象观测与交流活动。'}</p>
        </header>
        <section className="about-grid">
          <div className="about-lead"><span>OUR STORY</span><h2>因共同的兴趣相遇，因持续的行动成长。</h2></div>
          <div className="prose-card"><h3>社团介绍</h3>{settings.introduction ? <div className="rich-content"><RichText data={settings.introduction} /></div> : <><p>社团介绍暂未填写。</p><p>管理员可以在后台“网站设置”中补充社团宗旨、发展历程、主要活动和组织介绍。</p></>}</div>
        </section>
        <section className="value-grid">
          {values.map((value, index) => <article key={value.id || value.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{value.title}</h3><p>{value.description}</p></article>)}
        </section>
      </div>
    </div>
  )
}
