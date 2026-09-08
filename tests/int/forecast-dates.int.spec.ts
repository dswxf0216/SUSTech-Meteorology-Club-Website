import { describe, expect, it } from 'vitest'

import { addForecastDays, resolveForecastDayDate } from '../../src/utilities/forecastDates'

describe('forecast dates', () => {
  it('starts forecast products on the day after the writing date', () => {
    expect(resolveForecastDayDate('2026-09-08T00:00:00.000+08:00', '2026-09-08T00:00:00.000+08:00', 0))
      .toBe('2026-09-09T00:00:00.000+08:00')
  })

  it('handles month and year boundaries in the site timezone', () => {
    expect(addForecastDays('2026-12-31T00:00:00.000+08:00', 1)).toBe('2027-01-01T00:00:00.000+08:00')
  })

  it('preserves an explicitly different forecast date', () => {
    expect(resolveForecastDayDate('2026-09-08T00:00:00.000+08:00', '2026-09-10T00:00:00.000+08:00', 0))
      .toBe('2026-09-10T00:00:00.000+08:00')
  })
})
