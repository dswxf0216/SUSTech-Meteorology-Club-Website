export type WeatherSymbol = 'sun' | 'cloudSun' | 'cloud' | 'lightRain' | 'rain' | 'heavyRain' | 'stormRain' | 'shower' | 'thunder' | 'fog' | 'haze' | 'snow' | 'sleet'

const symbols: Record<string, WeatherSymbol> = {
  晴: 'sun', 晴天: 'sun', 多云: 'cloudSun', 阴: 'cloud', 阴天: 'cloud',
  小雨: 'lightRain', 中雨: 'rain', 大雨: 'heavyRain', 暴雨: 'stormRain', 大暴雨: 'stormRain', 特大暴雨: 'stormRain',
  阵雨: 'shower', 雷阵雨: 'thunder', 雷雨: 'thunder', 雷阵雨伴有冰雹: 'thunder',
  雾: 'fog', 大雾: 'fog', 浓雾: 'fog', 霾: 'haze', 雨夹雪: 'sleet',
  小雪: 'snow', 中雪: 'snow', 大雪: 'snow', 暴雪: 'snow', 阵雪: 'snow',
}

// Exact matching avoids assigning misleading icons to qualifiers or negated descriptions.
export function weatherSymbols(text: string): WeatherSymbol[] {
  const parts = text.replace(/\s+/g, '').split(/转|→/)
  if (parts.length > 2) return []
  const result = parts.map(part => symbols[part])
  return result.every(Boolean) ? result : []
}
