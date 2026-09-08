'use client'

import { Button, toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export function WechatArticleImporter() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/articles/import-wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const result = await response.json() as { id?: number | string; message?: string }
      if (!response.ok || result.id == null) throw new Error(result.message || '导入失败')

      toast.success('微信推文已保存为草稿，请检查排版后发布。')
      router.push(`/admin/collections/articles/${result.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)', borderRadius: 6, marginBottom: 24, padding: 20 }}>
      <h3 style={{ margin: '0 0 8px' }}>从微信公众号导入</h3>
      <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 14px' }}>粘贴微信文章链接，系统会转存正文图片并创建一篇未发布的站内文章草稿。</p>
      <form onSubmit={handleSubmit} style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <input
          aria-label="微信公众号文章链接"
          disabled={loading}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://mp.weixin.qq.com/s/..."
          required
          style={{ background: 'var(--theme-input-bg)', border: '1px solid var(--theme-elevation-250)', borderRadius: 4, color: 'var(--theme-text)', flex: '1 1 440px', fontSize: 16, minHeight: 42, padding: '0 12px' }}
          type="url"
          value={url}
        />
        <Button buttonStyle="primary" disabled={loading} type="submit">
          {loading ? '正在导入…' : '生成文章草稿'}
        </Button>
      </form>
    </section>
  )
}
