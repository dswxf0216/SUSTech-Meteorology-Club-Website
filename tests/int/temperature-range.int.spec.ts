import { expect, it } from 'vitest'
import { parseTemperatureRange } from '../../src/utilities/temperatureRange'

it('parses temperature ranges with units, negative values and common separators', () => {
  for (const text of ['24~30℃', '24℃～30℃', '24.0°C-30.0°C', '30至24']) expect(parseTemperatureRange(text)).toEqual([24, 30])
  expect(parseTemperatureRange('-20°C-10°C')).toEqual([-20, 10])
  expect(parseTemperatureRange('-20℃~-10℃')).toEqual([-20, -10])
  expect(parseTemperatureRange('0℃-10℃')).toEqual([0, 10])
  expect(parseTemperatureRange('待发布')).toBeNull()
})
