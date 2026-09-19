import { gameIdentity } from '@/utilities/gameIdentity'
import { submissionIp } from '@/utilities/submissionIp'
import { quizAction, quizDeviceCompleted, quizLeaderboard, startQuiz } from '@/utilities/quizGame'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const limits = new Map<string, { count: number; until: number }>()
export async function GET(request: Request) {
  try {
    const who = await gameIdentity(request, 'quiz-device')
    return Response.json(
      {
        scores: await quizLeaderboard(who.admin),
        admin: who.admin,
        completed: !who.admin && (await quizDeviceCompleted(who.deviceId)),
      },
      { headers: who.headers },
    )
  } catch {
    return Response.json(
      { error: '答题排行榜暂时无法读取，请稍后刷新。' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== process.env.NEXT_PUBLIC_SERVER_URL
  )
    return Response.json({ error: '请求来源无效。' }, { status: 403 })
  if (Number(request.headers.get('content-length')) > 4096)
    return Response.json({ error: '请求过大。' }, { status: 413 })
  try {
    const text = await request.text()
    if (text.length > 4096) return Response.json({ error: '请求过大。' }, { status: 413 })
    const body = JSON.parse(text)
    const who = await gameIdentity(request, 'quiz-device')
    if (body.action === 'start') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'local',
        now = Date.now()
      for (const [key, value] of limits) if (value.until < now) limits.delete(key)
      const limit = limits.get(ip) || { count: 0, until: now + 60000 }
      if (!who.admin && ++limit.count > 20)
        return Response.json({ error: '开始次数过多，请一分钟后再试。' }, { status: 429 })
      limits.set(ip, limit)
      if (
        typeof body.nickname !== 'string' ||
        body.nickname.trim().length > 16 ||
        /[\p{Cc}\p{Cf}]/u.test(body.nickname)
      )
        return Response.json({ error: '昵称最多16个字符，请勿使用控制字符。' }, { status: 400 })
      return Response.json(
        await startQuiz(body.nickname.trim(), who.admin ? undefined : who.deviceId),
        { headers: who.headers },
      )
    }
    if (!['answer', 'submit', 'state'].includes(body.action) || typeof body.sessionId !== 'string')
      return Response.json({ error: '游戏请求无效。' }, { status: 400 })
    return Response.json(
      await quizAction(
        body.sessionId,
        body.action,
        who.admin ? undefined : who.deviceId,
        body.questionId,
        body.selected,
        submissionIp(request),
      ),
      { headers: who.headers },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const safe = /^(游戏|请先|请求繁忙|此浏览器)/.test(message)
    return Response.json(
      { error: safe ? message : '答题服务暂时不可用，请重试。' },
      { status: safe ? 400 : 503 },
    )
  }
}
