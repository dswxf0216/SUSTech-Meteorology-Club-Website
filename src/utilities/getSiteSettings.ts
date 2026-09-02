import { getPayload } from 'payload'
import { cache } from 'react'

import config from '@/payload.config'

export const getSiteSettings = cache(async () => {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})
