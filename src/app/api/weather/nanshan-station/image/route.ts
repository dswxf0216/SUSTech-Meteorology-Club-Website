import sharp from 'sharp'

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

    const source = Buffer.from(await response.arrayBuffer())
    const temperature = await sharp(source)
      .extract({ left: 405, top: 207, width: 78, height: 48 })
      .flatten({ background: '#ffffff' })
      .resize({ width: 234, height: 144, fit: 'fill', kernel: 'nearest' })
      .png()
      .toBuffer()

    return new Response(new Uint8Array(temperature), {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=240, stale-while-revalidate=600',
        'Content-Type': 'image/png',
        'X-Content-Type-Options': 'nosniff',
        ...(response.headers.get('last-modified')
          ? { 'X-Weather-Observed-At': response.headers.get('last-modified')! }
          : {}),
      },
    })
  } catch {
    return new Response('Weather image is temporarily unavailable.', {
      headers: { 'Cache-Control': 'no-store' },
      status: 503,
    })
  }
}
