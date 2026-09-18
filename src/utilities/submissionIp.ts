import { isIP } from 'node:net'

// The reverse proxy must overwrite X-Real-IP or append its peer to X-Forwarded-For.
// Never accept an IP from the game's JSON body; invalid/missing values stay absent.
export function submissionIp(request: Request): string | undefined {
  const candidates = [
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for')?.split(',').at(-1),
  ]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && isIP(value)) return value
  }
  return undefined
}
