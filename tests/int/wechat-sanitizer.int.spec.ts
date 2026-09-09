import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { sanitizeWechatContent } from '../../src/utilities/importWechatArticle'

describe('WeChat HTML sanitizer', () => {
  it('preserves safe layout styles and local images while removing active content', () => {
    const document = new JSDOM(`
      <div id="content">
        <section style="display:flex; gap:12px; background:url(https://bad.example/x)" onclick="alert(1)">
          <img data-local-src="/api/media/file/example.jpg" src="https://remote.example/x.jpg" onerror="alert(1)">
          <a href="javascript:alert(1)">unsafe link</a>
          <style>body { display: none }</style>
          <script>alert(1)</script>
        </section>
      </div>
    `).window.document
    const root = document.querySelector('#content')!
    const html = sanitizeWechatContent(root, new URL('https://mp.weixin.qq.com/s/example'))

    expect(html).toContain('display:flex')
    expect(html).toContain('gap:12px')
    expect(html).toContain('src="/api/media/file/example.jpg"')
    expect(html).not.toContain('url(')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<style')
  })
})
