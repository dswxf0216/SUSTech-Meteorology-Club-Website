import Image from 'next/image'

import type { Media } from '@/payload-types'

type Props = {
  className?: string
  media: Media | number | null | undefined
  preload?: boolean
}

export function MediaImage({ className, media, preload = false }: Props) {
  if (!media || typeof media !== 'object' || !media.url) return null

  return (
    <Image
      alt={media.alt}
      className={className}
      height={media.height || 800}
      preload={preload}
      sizes="(max-width: 820px) 100vw, 760px"
      src={media.url}
      width={media.width || 1200}
    />
  )
}
