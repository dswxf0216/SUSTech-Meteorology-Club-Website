import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '管理员', plural: '管理员' },
  admin: {
    useAsTitle: 'name',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: ({ req }) => req.user?.role === 'admin' || (req.user ? { id: { equals: req.user.id } } : false),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin' || (req.user ? { id: { equals: req.user.id } } : false),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', label: '姓名', type: 'text', required: true },
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
    beforeChange: [
      ({ data, operation, req }) => {
        // Payload 的首位用户创建流程没有登录用户；该账号必须成为管理员。
        if (operation === 'create' && !req.user) return { ...data, role: 'admin' }
        return data
      },
    ],
  },
  versions: false,
}
