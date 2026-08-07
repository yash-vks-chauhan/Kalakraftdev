"use client"

import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeading } from "./SectionHeading"

/**
 * The usageTags already on your products, surfaced. /api/products/usage-tags
 * flattens and dedupes them across active products, and the products list
 * filters on ?usageTag= — this is the one browse axis that is distinctly
 * Kalakraft rather than a marketplace convention.
 *
 * Nothing to show means no products carry usage tags yet, and an empty
 * section is worse than none, so it hides. The section number comes from the
 * page rather than being hardcoded, so hiding leaves 01, 02, 03 rather than
 * a hole where 02 used to be.
 */
export function OccasionChips({
  tags,
  loading,
  index,
}: {
  tags: string[]
  loading: boolean
  index: string
}) {
  if (!loading && tags.length === 0) return null

  return (
    <section className="pt-6">
      <SectionHeading index={index} job="Browse" title="Shop by" accent="occasion" />
      <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
            ))
          : tags.slice(0, 10).map((tag) => (
              <Link
                key={tag}
                href={`/products?usageTag=${encodeURIComponent(tag)}`}
                className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-[12.5px] transition-colors active:bg-secondary"
              >
                {tag}
              </Link>
            ))}
      </div>
    </section>
  )
}
