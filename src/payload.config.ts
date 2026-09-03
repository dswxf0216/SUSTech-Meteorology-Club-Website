import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Activities } from './collections/Activities'
import { Links } from './collections/Links'
import { DailyForecasts } from './collections/DailyForecasts'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const usePostgres = process.env.DATABASE_TYPE === 'postgres'
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const allowedOrigins = Array.from(
  new Set([serverURL, ...(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)]),
)

if (usePostgres && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required when DATABASE_TYPE=postgres.')
}

const db = usePostgres
  ? postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URL,
      },
      prodMigrations: migrations,
      push: process.env.NODE_ENV !== 'production' || process.env.PAYLOAD_DB_PUSH === 'true',
    })
  : sqliteAdapter({
      busyTimeout: 5000,
      client: {
        url: process.env.DATABASE_URL || 'file:./club-cms.db',
      },
      push: process.env.PAYLOAD_DB_PUSH === 'true',
      wal: true,
    })

const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER || 'no-reply@example.com',
      defaultFromName: process.env.SMTP_FROM_NAME || '南方科技大学气象社',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      },
    })
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, DailyForecasts, Articles, Activities, Links],
  cors: allowedOrigins,
  csrf: allowedOrigins,
  defaultMaxTextLength: 100_000,
  maxDepth: 5,
  graphQL: { disable: true },
  globals: [SiteSettings],
  editor: lexicalEditor(),
  email,
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
  localization: {
    locales: ['zh', 'en'],
    fallback: true,
    defaultLocale: 'zh',
  },
})
