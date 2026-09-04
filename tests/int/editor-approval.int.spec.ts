// @vitest-environment node
import { expect, it } from 'vitest'

it('blocks pending login, allows approval, and prevents editor privilege escalation', async () => {
  process.env.DATABASE_TYPE = 'sqlite'
  process.env.DATABASE_URL = 'file::memory:'
  process.env.PAYLOAD_DB_PUSH = 'true'
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })
  try {
    const admin = await payload.create({ collection: 'users', data: { name: 'Test Admin', email: 'admin@example.test', password: 'test-password-long', role: 'editor', approvalStatus: 'pending' } })
    expect(admin.role).toBe('admin')
    expect(admin.approvalStatus).toBe('approved')
    const { POST } = await import('../../src/app/api/editor-application/route')
    const application = { name: 'Public Applicant', email: 'public@example.test', password: 'self-set-password', applicationReason: 'Content editor', role: 'admin', approvalStatus: 'approved' }
    const origin = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').origin
    expect((await POST(new Request(`${origin}/api/editor-application`, { method: 'POST', headers: { origin: 'https://untrusted.test' }, body: JSON.stringify(application) }))).status).toBe(403)
    expect((await POST(new Request(`${origin}/api/editor-application`, { method: 'POST', headers: { origin }, body: JSON.stringify(application) }))).status).toBe(200)
    const publicUser = (await payload.find({ collection: 'users', where: { email: { equals: application.email } } })).docs[0]
    expect(publicUser).toMatchObject({ role: 'editor', approvalStatus: 'pending' })
    const applicant = await payload.create({ collection: 'users', context: { editorApplication: true }, data: { name: 'Test Editor', email: 'editor@example.test', password: 'test-password-long', role: 'admin', approvalStatus: 'approved' } })
    expect(applicant.role).toBe('editor')
    expect(applicant.approvalStatus).toBe('pending')
    await expect(payload.login({ collection: 'users', data: { email: 'editor@example.test', password: 'test-password-long' } })).rejects.toThrow()
    const adminUser = { ...admin, collection: 'users' as const }
    const approved = await payload.update({ collection: 'users', id: applicant.id, data: { approvalStatus: 'approved' }, overrideAccess: false, user: adminUser })
    const login = await payload.login({ collection: 'users', data: { email: 'editor@example.test', password: 'test-password-long' } })
    expect(login.token).toBeTruthy()
    const editorUser = { ...approved, collection: 'users' as const }
    await payload.update({ collection: 'users', id: applicant.id, user: editorUser, overrideAccess: false, data: { role: 'admin' } })
    const stored = await payload.findByID({ collection: 'users', id: applicant.id })
    expect(stored.role).toBe('editor')
    await expect(payload.create({ collection: 'users', user: editorUser, overrideAccess: false, data: { name: 'Other', email: 'other@example.test', password: 'test-password-long', role: 'admin', approvalStatus: 'approved' } })).rejects.toThrow()
    await payload.update({ collection: 'users', id: applicant.id, user: adminUser, overrideAccess: false, data: { approvalStatus: 'rejected' } })
    const session = await payload.auth({ headers: new Headers({ Authorization: `JWT ${login.token}` }) })
    expect(session.user).toBeNull()
    await expect(payload.login({ collection: 'users', data: { email: 'editor@example.test', password: 'test-password-long' } })).rejects.toThrow()
  } finally { await payload.destroy() }
}, 120_000)
