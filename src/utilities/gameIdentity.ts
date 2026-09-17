import 'server-only'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function isGameAdmin(request: Request) {
  if (
    !request.headers.has('authorization') &&
    !request.headers
      .get('cookie')
      ?.split(';')
      .some((s) => s.trim().startsWith('payload-token='))
  )
    return false
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return user?.role === 'admin' && user.approvalStatus === 'approved'
}

export async function gameIdentity(request: Request, cookieName = 'matching-device') {
  function signature(id: string) {
    if (!process.env.PAYLOAD_SECRET) throw new Error('Missing signing secret')
    return createHmac('sha256', process.env.PAYLOAD_SECRET)
      .update(`${cookieName}:${id}`)
      .digest('hex')
  }
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)
  const [candidate, sig] = (token || '').split('.')
  const valid =
    /^[a-f0-9-]{36}$/.test(candidate || '') &&
    /^[a-f0-9]{64}$/.test(sig || '') &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(signature(candidate)))
  const deviceId = valid ? candidate : randomUUID()
  const admin = await isGameAdmin(request)
  const headers = {
    'Cache-Control': 'no-store',
    'Set-Cookie': `${cookieName}=${deviceId}.${signature(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.NODE_ENV === 'production' || new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  }
  return { deviceId, admin, headers }
}
