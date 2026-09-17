import { isGameAdmin } from '@/utilities/gameIdentity'
import { quizStatistics } from '@/utilities/quizGame'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    if (!(await isGameAdmin(request)))
      return Response.json(
        { error: '仅管理员可查看答题记录，请先登录管理后台。' },
        { status: 403, headers },
      )
    const value = Number(new URL(request.url).searchParams.get('page') || '1')
    return Response.json(await quizStatistics(Number.isFinite(value) ? Math.floor(value) : 1), {
      headers,
    })
  } catch {
    return Response.json({ error: '答题统计暂时无法读取，请稍后重试。' }, { status: 503, headers })
  }
}
