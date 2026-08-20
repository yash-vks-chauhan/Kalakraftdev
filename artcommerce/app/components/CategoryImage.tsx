'use client'

import { useState } from 'react'

interface CategoryImageProps {
  /**
   * Candidate sources, best first. The first one the browser can actually
   * decode is the one that stays.
   */
  sources: (string | null | undefined)[]
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/*
 * A picture for a category, with somewhere to fall back to.
 *
 * public/images is tracked with Git LFS, so any checkout or deploy that does
 * not fetch the LFS objects serves a 132-byte pointer file in place of the
 * PNG. The browser cannot decode that, and next/image refuses it outright
 * with a 400 — which is how a whole grid of category thumbnails goes blank
 * while every product photo on the same page is fine. Product photos come
 * from the database and cannot break that way, so they lead here and the
 * bundled still is what catches them if they are missing.
 *
 * Rendering nothing once the list is exhausted is deliberate: the container
 * keeps its own background, so an empty frame reads as a plain surface
 * rather than as a broken image.
 */
export default function CategoryImage({
  sources,
  alt,
  className,
  loading = 'lazy',
}: CategoryImageProps) {
  /*
   * Which sources have been tried and failed, held by value rather than as an
   * index into the list. The best source usually arrives a moment after the
   * first render — the product photo comes from a fetch — and an index would
   * by then be pointing past it at something already known to be broken.
   */
  const [failed, setFailed] = useState<string[]>([])
  const src = sources.find(
    (s): s is string => typeof s === 'string' && s.length > 0 && !failed.includes(s)
  )

  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(f => (f.includes(src) ? f : [...f, src]))}
      className={className}
    />
  )
}
