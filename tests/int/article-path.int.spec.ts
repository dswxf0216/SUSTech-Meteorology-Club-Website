import { describe, expect, it } from 'vitest'

import { getArticleIDFromRoute, getArticlePath } from '../../src/utilities/articlePath'

describe('article paths', () => {
  it('uses a stable ID while preserving a readable encoded slug', () => {
    expect(getArticlePath({ id: 2, slug: '获奖揭晓-过程回顾' }))
      .toBe('/articles/2-%E8%8E%B7%E5%A5%96%E6%8F%AD%E6%99%93-%E8%BF%87%E7%A8%8B%E5%9B%9E%E9%A1%BE')
  })

  it('extracts IDs and leaves legacy slug-only routes alone', () => {
    expect(getArticleIDFromRoute('2-获奖揭晓-过程回顾')).toBe(2)
    expect(getArticleIDFromRoute('获奖揭晓-过程回顾')).toBeNull()
  })
})
