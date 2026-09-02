import Link from 'next/link'

import { getSiteSettings } from '@/utilities/getSiteSettings'

export async function SiteFooter() {
  const settings = await getSiteSettings()
  const clubName = settings.clubName || '南方科技大学气象社'

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><strong>{clubName}</strong><p>{settings.footerText || '关注天气与气候，交流气象知识。'}</p></div>
        <div className="footer-links">
          <Link href="/articles">文章</Link><Link href="/activities">活动</Link><Link href="/about">社团简介</Link><Link href="/links">友情链接</Link><Link href="/admin">内容管理</Link>
        </div>
        {(settings.contactEmail || settings.joinUrl) && <div className="footer-links">{settings.contactEmail && <a href={`mailto:${settings.contactEmail}`}>联系邮箱</a>}{settings.joinUrl && <a href={settings.joinUrl} rel="noreferrer" target="_blank">加入社团</a>}</div>}
        <small>© {new Date().getFullYear()} {clubName}</small>
      </div>
    </footer>
  )
}
