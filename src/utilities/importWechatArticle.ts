import { createHash, randomBytes } from 'crypto'
import { JSDOM } from 'jsdom'
import type { PayloadHandler } from 'payload'

import type { Article } from '../payload-types'

const ARTICLE_HOSTS = new Set(['mp.weixin.qq.com'])
const IMAGE_HOSTS = new Set(['mmbiz.qpic.cn', 'mmecoa.qpic.cn', 'mmbiz.qlogo.cn', 'mmbiz.qlogo.com'])
const MAX_IMAGES = 40
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 40 * 1024 * 1024

type LexicalNode = { type: string; version: number; [key: string]: unknown }

export const importWechatArticle: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ message: '请先登录后台。' }, { status: 401 })

  try {
    const body = await req.json?.() as { url?: unknown }
    const articleURL = parseAllowedURL(body?.url, ARTICLE_HOSTS)

    const duplicate = await req.payload.find({
      collection: 'articles',
      limit: 1,
      overrideAccess: false,
      req,
      where: { externalUrl: { equals: articleURL.href } },
    })
    const existingArticle = duplicate.docs[0]

    const html = await fetchAllowed(articleURL, ARTICLE_HOSTS, 'text/html')
    const dom = new JSDOM(html)
    const document = dom.window.document as Document
    const contentElement = document.querySelector('#js_content')
    const title = cleanText(document.querySelector('#activity-name')?.textContent || getMeta(document, 'og:title'))
    if (!title || !contentElement) throw new ImportError('未能识别微信文章内容，请确认链接可以正常打开。', 422)

    const author = cleanText(document.querySelector('#js_name')?.textContent || getMeta(document, 'author'))
    const description = cleanText(getMeta(document, 'og:description') || getMeta(document, 'description'))
    const articleText = cleanText(contentElement.textContent)
    const summary = (description || articleText).slice(0, 300) || title
    const publishedAt = getPublishedAt(document, html)

    const imageElements: Element[] = Array.from(contentElement.querySelectorAll('img')).slice(0, MAX_IMAGES)
    const imageURLs = imageElements
      .map((image) => image.getAttribute('data-src') || image.getAttribute('src'))
      .filter((value): value is string => Boolean(value))
    const coverURL = getMeta(document, 'og:image')
    if (coverURL) imageURLs.unshift(coverURL)

    const uploaded = new Map<string, { id: number; url: string }>()
    let totalBytes = 0
    const allowedImageURLs = imageURLs
      .map(normalizeAllowedImageURL)
      .filter((value): value is string => Boolean(value))
    for (const rawURL of [...new Set(allowedImageURLs)]) {
      if (uploaded.size >= MAX_IMAGES) break
      const imageURL = parseAllowedURL(rawURL, IMAGE_HOSTS)
      const image = await fetchImage(imageURL)
      totalBytes += image.data.length
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) throw new ImportError('文章图片总大小超过 40 MB，无法自动导入。', 413)

      const media = await req.payload.create({
        collection: 'media',
        data: { alt: title },
        file: image,
        overrideAccess: false,
        req,
      })
      uploaded.set(rawURL, { id: media.id, url: normalizeLocalMediaURL(media.url) })
    }

    for (const image of imageElements) {
      const rawURL = image.getAttribute('data-src') || image.getAttribute('src')
      const normalizedURL = rawURL ? normalizeAllowedImageURL(rawURL) : null
      const media = normalizedURL ? uploaded.get(normalizedURL) : undefined
      if (media) {
        image.setAttribute('data-media-id', String(media.id))
        image.setAttribute('data-local-src', media.url)
      }
    }

    const content = buildLexicalContent(contentElement, articleURL)
    const normalizedCoverURL = coverURL ? normalizeAllowedImageURL(coverURL) : null
    const cover = normalizedCoverURL ? uploaded.get(normalizedCoverURL)?.id : undefined
    const importedHtml = sanitizeWechatContent(contentElement, articleURL)
    if (importedHtml.length > 500_000) throw new ImportError('文章排版内容超过 500 KB，无法自动导入。', 413)
    const articleData = {
      title,
      summary,
      cover,
      contentType: 'internal' as const,
      content,
      importedHtml,
      externalUrl: articleURL.href,
      source: author ? `微信公众号：${author}` : '微信公众号',
      publishedAt,
      featured: existingArticle?.featured || false,
    }
    const article = existingArticle
      ? await req.payload.update({
          collection: 'articles',
          id: existingArticle.id,
          draft: true,
          overrideAccess: false,
          req,
          data: articleData,
        })
      : await req.payload.create({
          collection: 'articles',
          draft: true,
          overrideAccess: false,
          req,
          data: articleData,
        })

    return Response.json({ id: article.id, updated: Boolean(existingArticle) })
  } catch (error) {
    req.payload.logger.error({ err: error, msg: '微信公众号文章导入失败' })
    const status = error instanceof ImportError ? error.status : 500
    const message = error instanceof ImportError ? error.message : '导入失败，请稍后重试。'
    return Response.json({ message }, { status })
  }
}

class ImportError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

function parseAllowedURL(value: unknown, allowedHosts: Set<string>) {
  if (typeof value !== 'string') throw new ImportError('请输入微信公众号文章链接。', 400)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ImportError('链接格式不正确。', 400)
  }
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new ImportError('只支持 mp.weixin.qq.com 的 HTTPS 文章链接。', 400)
  }
  url.hash = ''
  return url
}

async function fetchAllowed(initialURL: URL, allowedHosts: Set<string>, accept: string) {
  let url = initialURL
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: accept, 'User-Agent': 'Mozilla/5.0 (compatible; SUSTechMeteorologyClub/1.0)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new ImportError('微信返回了无效的跳转地址。', 502)
      url = parseAllowedURL(new URL(location, url).href, allowedHosts)
      continue
    }
    if (!response.ok) throw new ImportError(`微信文章读取失败（HTTP ${response.status}）。`, 502)
    return response.text()
  }
  throw new ImportError('微信文章跳转次数过多。', 502)
}

async function fetchImage(url: URL) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Referer: 'https://mp.weixin.qq.com/', 'User-Agent': 'Mozilla/5.0' },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new ImportError(`正文图片下载失败（HTTP ${response.status}）。`, 502)
  const type = (response.headers.get('content-type') || '').split(';')[0].toLowerCase()
  if (!type.startsWith('image/')) throw new ImportError('微信返回的正文图片格式无效。', 422)
  const data = Buffer.from(await response.arrayBuffer())
  if (data.length > MAX_IMAGE_BYTES) throw new ImportError('单张正文图片超过 8 MB。', 413)
  const extension = mimeExtension(type)
  const name = `wechat-${createHash('sha256').update(url.href).digest('hex').slice(0, 16)}.${extension}`
  return { data, mimetype: type, name, size: data.length }
}

function buildLexicalContent(root: Element, articleURL: URL): NonNullable<Article['content']> {
  const children: LexicalNode[] = []
  const blocks = Array.from(root.querySelectorAll('p, section, h1, h2, h3, blockquote, img'))
    .filter((element) => !element.parentElement?.closest('p, section, h1, h2, h3, blockquote'))

  for (const element of blocks) {
    if (element.tagName === 'IMG') {
      const upload = uploadNode(element)
      if (upload) children.push(upload)
      continue
    }
    const inlineChildren = inlineNodes(element, articleURL)
    if (inlineChildren.length) {
      const heading = /^H[1-3]$/.test(element.tagName)
      children.push({
        type: heading ? 'heading' : element.tagName === 'BLOCKQUOTE' ? 'quote' : 'paragraph',
        ...(heading ? { tag: element.tagName.toLowerCase() } : {}),
        children: inlineChildren,
        direction: null,
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })
    }
    for (const image of Array.from(element.querySelectorAll('img'))) {
      const upload = uploadNode(image)
      if (upload) children.push(upload)
    }
  }

  children.push({
    type: 'paragraph', direction: null, format: '', indent: 0, version: 1, textFormat: 0, textStyle: '',
    children: [{
      type: 'link', version: 3, fields: { linkType: 'custom', newTab: true, url: articleURL.href },
      children: [textNode('查看微信公众号原文 ↗')], direction: null, format: '', indent: 0,
    }],
  })
  return { root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } }
}

function inlineNodes(element: Element, articleURL: URL): LexicalNode[] {
  const nodes: LexicalNode[] = []
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const text = cleanText(node.textContent)
      if (text) nodes.push(textNode(text))
      return
    }
    if (!(node instanceof element.ownerDocument.defaultView!.Element) || node.tagName === 'IMG') return
    if (node.tagName === 'A') {
      const text = cleanText(node.textContent)
      if (!text) return
      let url = articleURL.href
      try { url = new URL(node.getAttribute('href') || '', articleURL).href } catch { /* keep article URL */ }
      nodes.push({ type: 'link', version: 3, fields: { linkType: 'custom', newTab: true, url }, children: [textNode(text)], direction: null, format: '', indent: 0 })
      return
    }
    node.childNodes.forEach(walk)
  }
  element.childNodes.forEach(walk)
  return nodes
}

function textNode(text: string) {
  return { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }
}

function uploadNode(element: Element): LexicalNode | null {
  const value = Number(element.getAttribute('data-media-id'))
  if (!value) return null
  return { type: 'upload', version: 3, id: randomBytes(12).toString('hex'), relationTo: 'media', value, fields: null, format: '' }
}

export function sanitizeWechatContent(root: Element, articleURL: URL) {
  const clone = root.cloneNode(true) as Element
  clone.querySelectorAll('script, style, noscript, iframe, object, embed, form, input, button, textarea, select, option, link, meta, base, canvas').forEach((element) => element.remove())

  for (const element of Array.from(clone.querySelectorAll('*'))) {
    const inlineStyle = element.getAttribute('style') || ''
    if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(inlineStyle) || element.getAttribute('aria-hidden') === 'true') {
      element.remove()
      continue
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on') || !SAFE_ATTRIBUTES.has(name)) element.removeAttribute(attribute.name)
    }

    const style = sanitizeStyle(element.getAttribute('style') || '')
    if (style) element.setAttribute('style', style)
    else element.removeAttribute('style')

    if (element.tagName === 'IMG') {
      const localSource = element.getAttribute('data-local-src')
      if (!localSource) {
        element.remove()
        continue
      }
      element.setAttribute('src', localSource)
      element.setAttribute('loading', 'lazy')
      element.removeAttribute('data-local-src')
    }

    if (element.tagName === 'A') {
      const href = safeLink(element.getAttribute('href'), articleURL)
      if (href) {
        element.setAttribute('href', href)
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      } else {
        element.removeAttribute('href')
      }
    }
  }

  return clone.innerHTML
}

const SAFE_ATTRIBUTES = new Set([
  'alt', 'aria-label', 'colspan', 'data-local-src', 'height', 'href', 'rel', 'role',
  'rowspan', 'src', 'style', 'target', 'title', 'width',
])

function sanitizeStyle(value: string) {
  return value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => !/(?:expression\s*\(|url\s*\(|@import|javascript:|behavior\s*:|-moz-binding|position\s*:\s*fixed)/i.test(declaration))
    .join('; ')
}

function safeLink(value: null | string, articleURL: URL) {
  if (!value) return null
  try {
    const url = new URL(value, articleURL)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function normalizeLocalMediaURL(value?: null | string) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return `${url.pathname}${url.search}`
  } catch {
    return value
  }
}

function getMeta(document: Document, key: string) {
  return document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content') || ''
}

function getPublishedAt(document: Document, html: string) {
  const timestamp = html.match(/\bct\s*=\s*["']?(\d{10})/)?.[1]
  if (timestamp) return new Date(Number(timestamp) * 1000).toISOString()
  const displayed = cleanText(document.querySelector('#publish_time')?.textContent)
  const parsed = displayed ? Date.parse(displayed.replace(/年|月/g, '-').replace(/日/g, '')) : NaN
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString()
}

function cleanText(value: string | null | undefined) {
  return (value || '').replace(/[\s\u00a0]+/g, ' ').trim()
}

function normalizeAllowedImageURL(value: string) {
  try {
    const url = parseAllowedURL(value, IMAGE_HOSTS)
    return url.href
  } catch {
    return null
  }
}

function mimeExtension(type: string) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/svg+xml') return 'svg'
  return type.split('/')[1]?.replace('x-', '') || 'img'
}
