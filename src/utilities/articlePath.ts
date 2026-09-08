export function getArticlePath(article: { id: number | string; slug?: null | string }) {
  const suffix = article.slug ? `-${encodeURIComponent(article.slug)}` : ''
  return `/articles/${article.id}${suffix}`
}

export function getArticleIDFromRoute(value: string) {
  const match = value.match(/^(\d+)(?:-|$)/)
  return match ? Number(match[1]) : null
}
