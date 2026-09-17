import { deviceCompleted, gameAction, leaderboard, startDeviceGame } from '@/utilities/matchingGame'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const limits = new Map<string, { count: number; until: number }>()
const cookieName = 'matching-device'
function signature(id: string) {
  if (!process.env.PAYLOAD_SECRET) throw new Error('Missing signing secret')
  return createHmac('sha256', process.env.PAYLOAD_SECRET).update(`matching-device:${id}`).digest('hex')
}
async function identity(request: Request) {
  const token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  const [candidate, sig] = (token || '').split('.')
  const valid = /^[a-f0-9-]{36}$/.test(candidate || '') && /^[a-f0-9]{64}$/.test(sig || '') && timingSafeEqual(Buffer.from(sig), Buffer.from(signature(candidate)))
  const deviceId = valid ? candidate : randomUUID()
  let admin = false
  if (request.headers.has('authorization') || request.headers.get('cookie')?.split(';').some(s => s.trim().startsWith('payload-token='))) {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    admin = user?.role === 'admin' && user.approvalStatus === 'approved'
  }
  const headers = { 'Cache-Control': 'no-store', 'Set-Cookie': `${cookieName}=${deviceId}.${signature(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.NODE_ENV === 'production' || new URL(request.url).protocol === 'https:' ? '; Secure' : ''}` }
  return { deviceId, admin, headers }
}
export async function GET(request: Request) {
  try {
    const who = await identity(request)
    return Response.json({ scores: await leaderboard(), admin: who.admin, completed: !who.admin && await deviceCompleted(who.deviceId) }, { headers: who.headers })
  }
  catch { return Response.json({ error: '排行榜暂时无法读取，请稍后刷新。' }, { status: 503 }) }
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.NEXT_PUBLIC_SERVER_URL) return Response.json({ error: '请求来源无效。' }, { status: 403 })
  if (Number(request.headers.get('content-length')) > 4096) return Response.json({ error: '请求过大。' }, { status: 413 })
  try {
    const text = await request.text()
    if (text.length > 4096) return Response.json({ error: '请求过大。' }, { status: 413 })
    const body = JSON.parse(text)
    const who = await identity(request)
    if (body.action === 'start') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'local'
      const now = Date.now()
      for (const [key, value] of limits) if (value.until < now) limits.delete(key)
      const limit = limits.get(ip) || { count: 0, until: now + 60000 }
      if (!who.admin && ++limit.count > 20) return Response.json({ error: '开始次数过多，请一分钟后再试。' }, { status: 429 })
      limits.set(ip, limit)
      if (typeof body.nickname !== 'string' || body.nickname.trim().length > 16 || /[\p{Cc}\p{Cf}]/u.test(body.nickname)) return Response.json({ error: '昵称最多16个字符，请勿使用控制字符。' }, { status: 400 })
      return Response.json(await startDeviceGame(body.nickname.trim(), who.admin ? undefined : who.deviceId), { headers: who.headers })
    }
    if (!['match', 'next', 'state'].includes(body.action) || typeof body.sessionId !== 'string') return Response.json({ error: '游戏请求无效。' }, { status: 400 })
    return Response.json(await gameAction(body.sessionId, body.leftId, body.rightId, body.action === 'next', body.action === 'state', who.admin ? undefined : who.deviceId), { headers: who.headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const safe = /^(游戏|请选择|该选项|请先|请求繁忙|此浏览器)/.test(message)
    return Response.json({ error: safe ? message : '游戏服务暂时不可用，请重试。' }, { status: safe ? 400 : 503 })
  }
}
