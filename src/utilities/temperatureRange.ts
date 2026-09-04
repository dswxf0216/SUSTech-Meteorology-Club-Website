export function parseTemperatureRange(value: string): [number, number] | null {
  const match = value.trim().match(/^([+−-]?\d+(?:\.\d+)?)\s*(?:℃|°\s*C)?\s*(?:~|～|至|到|—|–|－|-)\s*([+−-]?\d+(?:\.\d+)?)\s*(?:℃|°\s*C)?$/i)
  if (!match) return null
  const values = [Number(match[1].replace('−', '-')), Number(match[2].replace('−', '-'))]
  return [Math.min(...values), Math.max(...values)]
}
