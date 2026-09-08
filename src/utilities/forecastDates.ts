const SITE_TIME_ZONE = 'Asia/Shanghai'

function dateParts(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: SITE_TIME_ZONE,
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value)
  const year = read('year')
  const month = read('month')
  const day = read('day')
  return year && month && day ? { day, month, year } : null
}

export function addForecastDays(value: string, days: number) {
  const parts = dateParts(value)
  if (!parts) return value

  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}T00:00:00.000+08:00`
}

export function isSameForecastDay(left?: null | string, right?: null | string) {
  if (!left || !right) return false
  const leftParts = dateParts(left)
  const rightParts = dateParts(right)
  return Boolean(leftParts && rightParts && leftParts.year === rightParts.year && leftParts.month === rightParts.month && leftParts.day === rightParts.day)
}

export function resolveForecastDayDate(forecastDate: string, dayDate: null | string | undefined, index: number) {
  if (!dayDate || (index === 0 && isSameForecastDay(dayDate, forecastDate))) return addForecastDays(forecastDate, index + 1)
  return dayDate
}
