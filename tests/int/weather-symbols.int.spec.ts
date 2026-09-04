import { expect, it } from 'vitest'
import { weatherSymbols } from '../../src/utilities/weatherSymbols'

it('maps phenomena and transitions without guessing unknown descriptions', () => {
  expect(weatherSymbols('多云')).toEqual(['cloudSun'])
  expect(weatherSymbols('多云 转 阵雨')).toEqual(['cloudSun', 'shower'])
  expect(weatherSymbols('阴转雷阵雨')).toEqual(['cloud', 'thunder'])
  expect(weatherSymbols('暴雨')).toEqual(['stormRain'])
  expect(weatherSymbols('无雨')).toEqual([])
  expect(weatherSymbols('多云，局部有阵雨')).toEqual([])
  expect(weatherSymbols('')).toEqual([])
})
