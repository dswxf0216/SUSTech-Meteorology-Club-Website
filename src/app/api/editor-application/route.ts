import { getPayload } from 'payload'
import config from '@payload-config'
import { createHash } from 'node:crypto'

export const runtime = 'nodejs'
const attempts = new Map<string, { count: number; expires: number }>()

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const expected = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').origin
  if (origin !== expected) return Response.json({ error: '请求来源不受信任。' }, { status: 403 })
  const now = Date.now()
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = createHash('sha256').update(ip).digest('hex')
  const entry = attempts.get(key) || { count: 0, expires: now + 60 * 60_000 }
  if (entry.count >= 5 || attempts.size >= 5000) return Response.json({ error: '申请过于频繁，请一小时后再试。' }, { status: 429 })
  entry.count++
  attempts.set(key, entry)
  try {
    // Bound the streamed request before parsing, including chunked requests.
    const reader = request.body?.getReader()
    if (!reader) return Response.json({ error: '缺少申请内容。' }, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) { await reader.cancel(); return Response.json({ error: '内容过长。' }, { status: 413 }) }
      chunks.push(value)
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    const { name, email, password, applicationReason } = body
    if (typeof name !== 'string' || !name.trim() || name.length > 80 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 12 || password.length > 128 || typeof applicationReason !== 'string' || !applicationReason.trim() || applicationReason.length > 1000) {
      return Response.json({ error: '请填写姓名、有效邮箱、12–128位密码和申请说明。' }, { status: 400 })
    }
    const payload = await getPayload({ config })
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await payload.count({ collection: 'users', where: { email: { equals: normalizedEmail } }, overrideAccess: true })
    // Do not reveal whether an address already belongs to an administrator.
    if (!existing.totalDocs) {
      await payload.create({ collection: 'users', overrideAccess: true, context: { editorApplication: true }, data: {
        name: name.trim(), email: normalizedEmail, password, applicationReason: applicationReason.trim(), role: 'editor', approvalStatus: 'pending',
      } })
    }
    return Response.json({ message: '申请已受理，请联系管理员审批；若邮箱已有账号，则不会重复创建。获批后使用您设置的密码登录。' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: '申请暂未完成，请检查信息或稍后重试。' }, { status: 400 })
  }
}
