import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '管理员', plural: '管理员' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'approvalStatus', 'createdAt'],
    description: '编辑申请默认待审批。管理员将审批状态改为“已批准”并保存后，申请人即可登录。',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: ({ req }) => Boolean(req.user && req.user.approvalStatus === 'approved'),
    read: ({ req }) => req.user?.role === 'admin' || (req.user ? { id: { equals: req.user.id } } : false),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin' || (req.user ? { id: { equals: req.user.id } } : false),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', label: '姓名', type: 'text', required: true },
    { name: 'applicationReason', label: '申请说明', type: 'textarea', maxLength: 1000, access: { update: ({ req }) => req.user?.role === 'admin' } },
    {
      name: 'approvalStatus', label: '审批状态', type: 'select', required: true, defaultValue: 'approved',
      options: [{ label: '待审批', value: 'pending' }, { label: '已批准', value: 'approved' }, { label: '已拒绝', value: 'rejected' }],
      access: { create: ({ req }) => req.user?.role === 'admin', update: ({ req }) => req.user?.role === 'admin' },
    },
    {
      name: 'role',
      label: '角色',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '编辑', value: 'editor' },
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
  hooks: {
    beforeLogin: [({ user }) => {
      if (user.approvalStatus !== 'approved') throw new APIError('账号尚未获批，请联系管理员。', 403)
      return user
    }],
    beforeChange: [
      async ({ data, operation, req, context, originalDoc }) => {
        if (operation === 'create' && context.editorApplication === true) return { ...data, role: 'editor', approvalStatus: 'pending' }
        // Payload 的首位用户创建流程没有登录用户；该账号必须成为管理员。
        if (operation === 'create' && !req.user) {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
          if (totalDocs) throw new APIError('请通过编辑申请入口注册。', 403)
          return { ...data, role: 'admin', approvalStatus: 'approved' }
        }
        if (operation === 'update' && req.user?.role !== 'admin') return { ...data, role: originalDoc.role, approvalStatus: originalDoc.approvalStatus }
        if (operation === 'update' && data.approvalStatus && data.approvalStatus !== 'approved') return { ...data, sessions: [] }
        return data
      },
    ],
  },
  versions: false,
}
