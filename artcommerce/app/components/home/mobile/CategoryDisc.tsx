"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { getOptimizedImageUrl } from "../../../../lib/cloudinaryImages"
import { categoryImage, categoryTint } from "./categoryArt"
import { grain } from "./Pour"

const THUMB = "c_fill,w_160,h_160,q_auto:good,f_auto"

/**
 * What the disc shows, in order: a photo of something actually in the
 * category, then the bundled still matched by name, then a tint.
 *
 * The still used to come first, and it is the reason these read as plain
 * coloured circles — public/images is tracked with Git LFS, so anywhere the
 * LFS objects aren't fetched the browser gets a 132-byte pointer file, fails
 * to decode it, and every disc falls through to its swatch. A product image
 * comes from the database and can't break that way.
 */
export function CategoryDisc({
  name,
  image,
}: {
  name: string
  /** First image of a product in this category, from /api/categories. */
  image?: string | null
}) {
  const still = categoryImage(name)
  const sources = [
    image ? getOptimizedImageUrl(image, THUMB) : null,
    still ? getOptimizedImageUrl(still, THUMB) : null,
  ].filter(Boolean) as string[]

  const [attempt, setAttempt] = useState(0)
  const src = sources[attempt] ?? null

  return (
    <span
      className={cn(
        "relative h-16 w-16 overflow-hidden rounded-full border transition-transform active:scale-95",
        grain
      )}
      style={{ background: categoryTint(name) }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setAttempt((a) => a + 1)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  )
}
