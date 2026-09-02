'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="system-state container" aria-labelledby="error-title">
      <p className="eyebrow">页面暂时不可用</p>
      <h1 id="error-title">加载时遇到问题</h1>
      <p>你可以重新尝试；如果问题持续存在，请稍后再访问。</p>
      <div className="system-state-actions">
        <button className="button button-primary" type="button" onClick={() => retry()}>重新加载</button>
        <Link className="button button-secondary" href="/">返回主页</Link>
      </div>
    </section>
  )
}
