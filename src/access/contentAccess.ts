import type { Access } from 'payload'

export const authenticated: Access = ({ req }) => req.user?.approvalStatus === 'approved'

export const adminOnly: Access = ({ req }) => req.user?.role === 'admin' && req.user.approvalStatus === 'approved'

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user?.approvalStatus === 'approved') return true

  return { _status: { equals: 'published' } }
}
