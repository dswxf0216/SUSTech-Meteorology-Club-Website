'use client'

import { useFormFields } from '@payloadcms/ui'

export function WechatLayoutPreview() {
  const importedHtml = useFormFields(([fields]) => fields.importedHtml?.value)
  if (typeof importedHtml !== 'string' || !importedHtml) return null

  const previewDocument = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{background:#fff}body{max-width:760px;margin:0 auto;padding:24px;color:#17324d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.8}*,*::before,*::after{max-width:100%;box-sizing:border-box}img{max-width:100%!important;height:auto!important}table{width:100%!important;table-layout:fixed;border-collapse:collapse}a{color:#2478b8}</style></head><body>${importedHtml}</body></html>`

  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 6 }}>微信原排版预览</h3>
      <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 12px' }}>此预览使用已安全清理并本地化图片后的微信排版。发布后网站将显示这一版本。</p>
      <iframe
        sandbox=""
        srcDoc={previewDocument}
        style={{ background: '#fff', border: '1px solid var(--theme-elevation-200)', borderRadius: 6, height: 860, width: '100%' }}
        title="微信文章排版预览"
      />
    </section>
  )
}
