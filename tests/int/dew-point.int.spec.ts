import { expect, it } from 'vitest'
import { dewPoint } from '../../src/utilities/dewPoint'

it('calculates dew point and handles saturation, units and missing readings', () => {
  expect(dewPoint('30', '70%')).toBe('23.9℃')
  expect(dewPoint('25℃', '100%')).toBe('25.0℃')
  expect(dewPoint('-10°C', '100')).toBe('-10.0℃')
  expect(dewPoint('0', '100')).toBe('0.0℃')
  for (const rh of ['0', '101', '', '—', '-1']) expect(dewPoint('25', rh)).toBeNull()
  expect(dewPoint(undefined, '70')).toBeNull()
  expect(dewPoint('9999', '70')).toBeNull()
})
