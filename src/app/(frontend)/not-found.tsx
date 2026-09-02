import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="system-state container" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">没有找到这个页面</h1>
      <p>页面可能已被移动、删除，或者网址输入有误。</p>
      <div className="system-state-actions">
        <Link className="button button-primary" href="/">返回主页</Link>
        <Link className="button button-secondary" href="/articles">查看文章</Link>
      </div>
    </section>
  )
}
