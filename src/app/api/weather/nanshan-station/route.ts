const SOURCE_URL =
  'https://wx.121.com.cn/weixin/WeChat/data/mobile/temperature/AWS_NanShan_T_1_1.png'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
    })

    if (!response.ok) {
      throw new Error(`Weather source returned ${response.status}`)
    }

    return Response.json(
      {
        available: true,
        imageUrl: '/api/weather/nanshan-station/image',
        observedAt: response.headers.get('last-modified'),
        sourceUrl: 'https://wx.121.com.cn/MobileWeather/districtWeather_newMap.html',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      {
        available: false,
        imageUrl: null,
        observedAt: null,
        sourceUrl: 'https://wx.121.com.cn/MobileWeather/districtWeather_newMap.html',
      },
      { headers: { 'Cache-Control': 'no-store' }, status: 503 },
    )
  }
}
