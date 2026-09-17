import { isGameAdmin } from '@/utilities/gameIdentity'
import { matchingRecords } from '@/utilities/matchingGame'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    if (!(await isGameAdmin(request)))
      return Response.json(
        { error: '仅管理员可查看作答记录，请先登录管理后台。' },
        { status: 403, headers },
      )
    const page = Number(new URL(request.url).searchParams.get('page') || 1)
    return Response.json(await matchingRecords(Number.isFinite(page) ? Math.floor(page) : 1), {
      headers,
    })
  } catch {
    return Response.json({ error: '记录暂时无法读取，请稍后重试。' }, { status: 503, headers })
  }
}
