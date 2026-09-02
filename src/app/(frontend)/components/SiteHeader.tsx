import Image from 'next/image'
import Link from 'next/link'

import { getSiteSettings } from '@/utilities/getSiteSettings'

const defaultNavigation = [
  { id: 'home', label: '主页', newTab: false, url: '/' },
  { id: 'weather', label: '天气信息', newTab: false, url: '/weather' },
  { id: 'about', label: '社团简介', newTab: false, url: '/about' },
  { id: 'links', label: '友情链接', newTab: false, url: '/links' },
]

export async function SiteHeader() {
  const settings = await getSiteSettings()
  const configuredNavigation = settings.navigation?.filter((item) => item.label && item.url)
  const navigation = configuredNavigation?.length ? configuredNavigation : defaultNavigation
  const clubName = settings.clubName || '南方科技大学气象社'
  const logoSrc = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo.url : '/assets/sustech-meteorology-club-logo.png'

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="返回主页">
          <Image className="brand-logo" src={logoSrc} alt={`${clubName} Logo`} width={48} height={48} />
          <span><strong>{clubName}</strong><small>SUSTech Meteorology Club</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="主要导航">
          {navigation.map((item, index) => item.newTab ? <a href={item.url} key={item.id || `${item.url}-${index}`} rel="noreferrer" target="_blank">{item.label}</a> : <Link href={item.url} key={item.id || `${item.url}-${index}`}>{item.label}</Link>)}
        </nav>
        <details className="mobile-nav">
          <summary aria-label="打开导航菜单"><span /><span /><span /></summary>
          <nav aria-label="移动端导航">
            {navigation.map((item, index) => item.newTab ? <a href={item.url} key={item.id || `${item.url}-${index}`} rel="noreferrer" target="_blank">{item.label}</a> : <Link href={item.url} key={item.id || `${item.url}-${index}`}>{item.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  )
}
