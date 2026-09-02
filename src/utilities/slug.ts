export function createSlug(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function validatePublicUrl(value: null | string | undefined): true | string {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? true
      : '请输入以 http:// 或 https:// 开头的网址'
  } catch {
    return '请输入完整有效的网址，例如 https://example.com'
  }
}
