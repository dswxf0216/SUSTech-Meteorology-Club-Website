import type { Access } from 'payload'

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return { _status: { equals: 'published' } }
}
