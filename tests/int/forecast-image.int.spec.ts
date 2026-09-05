import { describe, expect, it } from 'vitest'

import { formatForecastDateForFilename } from '../../src/utilities/captureForecastImage'

describe('forecast image filenames', () => {
  it('uses the forecast date in the site timezone', () => {
    expect(formatForecastDateForFilename('2026-09-05T16:00:00.000Z')).toBe('2026-09-06')
  })

  it('falls back safely for an invalid date', () => {
    expect(formatForecastDateForFilename('not-a-date')).toBe('unknown-date')
  })
})
