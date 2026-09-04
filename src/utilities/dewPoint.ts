/** Magnus approximation over liquid water; T in Celsius, RH in percent.
 * https://qed.epa.gov/hms/meteorology/humidity/algorithms/
 */
export function dewPoint(temperature?: string | null, humidity?: string | null): string | null {
  const tMatch = temperature?.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*(?:℃|°\s*C)?$/i)
  const rhMatch = humidity?.trim().match(/^(\d+(?:\.\d+)?)\s*[%％]?$/)
  if (!tMatch || !rhMatch) return null
  const t = Number(tMatch[1]), rh = Number(rhMatch[1])
  if (t < -80 || t > 60 || rh <= 0 || rh > 100) return null
  const gamma = Math.log(rh / 100) + 17.625 * t / (243.04 + t)
  const td = 243.04 * gamma / (17.625 - gamma)
  return Number.isFinite(td) ? `${Number(td.toFixed(1)) === 0 ? '0.0' : td.toFixed(1)}℃` : null
}
