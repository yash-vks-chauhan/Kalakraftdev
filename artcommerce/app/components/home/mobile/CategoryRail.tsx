import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { CategoryDisc } from "./CategoryDisc"
import { SectionHeading } from "./SectionHeading"

export interface HomeCategory {
  id: number
  name: string
  slug?: string | null
}

/**
 * Real categories from /api/categories, linked by slug. The legacy page had
 * nine hardcoded and matched them by substring against category names, which
 * made "Trays" and "Jewelry Trays" resolve to the same query.
 */
export function CategoryRail({
  categories,
  loading,
}: {
  categories: HomeCategory[]
  loading: boolean
}) {
  if (!loading && categories.length === 0) return null

  return (
    <section className="relative isolate pt-6">
      {/*
        The hero's warmth carried past its edge and dissolved here, so the
        page reads as one surface instead of a dark box stacked on a white
        one. It belongs to this section rather than a wrapper, and it stops
        before the products — they should stay the loudest thing on the page.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px -z-10 h-64 bg-[radial-gradient(125%_100%_at_50%_0%,rgba(194,112,58,0.18),rgba(125,47,63,0.07)_45%,transparent_72%)]"
      />
      <SectionHeading
        index="01"
        job="Browse"
        title="Shop by"
        accent="category"
        href="/products"
        linkLabel="All"
      />
      <div className="flex gap-3.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex w-[70px] shrink-0 flex-col items-center gap-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
            ))
          : categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(
                  category.slug ?? category.name
                )}`}
                className="flex w-[70px] shrink-0 flex-col items-center gap-2"
              >
                <CategoryDisc name={category.name} />
                <span className="text-center text-[11px] leading-tight">
                  {category.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  )
}
