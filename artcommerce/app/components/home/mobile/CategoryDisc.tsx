"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { getOptimizedImageUrl } from "../../../../lib/cloudinaryImages"
import { categoryImage, categoryTint } from "./categoryArt"
import { grain } from "./Pour"

/**
 * The tint is painted underneath always, so a category with no matching asset
 * — or one whose image fails to load — still reads as a deliberate swatch
 * rather than a broken image.
 */
export function CategoryDisc({ name }: { name: string }) {
  const art = categoryImage(name)
  const [failed, setFailed] = useState(false)

  return (
    <span
      className={cn(
        "relative h-16 w-16 overflow-hidden rounded-full border transition-transform active:scale-95",
        grain
      )}
      style={{ backgroundImage: categoryTint(name) }}
    >
      {art && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getOptimizedImageUrl(art, "c_fill,w_160,h_160,q_auto:good,f_auto")}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  )
}
