import { ProductCard, ProductCardSkeleton } from "./ProductCard"
import { SectionHeading } from "./SectionHeading"
import type { MobileProduct } from "./types"

/** Ranked, horizontally scrolled — the numbers mean something here. */
export function BestSellersRail({
  products,
  loading,
}: {
  products: MobileProduct[]
  loading: boolean
}) {
  if (!loading && products.length === 0) return null

  return (
    <section className="pt-6">
      <SectionHeading
        index="03"
        job="Buy"
        title="Best"
        accent="sellers"
        href="/products?sort=best_sellers"
      />
      {/*
        scroll-pl-4 is what makes this feel aligned: without it a snapped card
        lands flush at 0 while the heading above it starts at the 16px gutter.
        The gap matches the grid below so both sections share one rhythm.
      */}
      <div className="flex snap-x snap-proximity scroll-pl-4 gap-3.5 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[158px] shrink-0 snap-start">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((product, i) => (
              <div key={product.id} className="w-[158px] shrink-0 snap-start">
                <ProductCard product={product} rank={i + 1} priority={i === 0} />
              </div>
            ))}
      </div>
    </section>
  )
}

/** A different shape for a different message: two-up, no ranks. */
export function NewInGrid({
  products,
  loading,
}: {
  products: MobileProduct[]
  loading: boolean
}) {
  if (!loading && products.length === 0) return null

  return (
    <section className="pt-6">
      <SectionHeading index="04" job="Buy" title="New" accent="in" href="/products?sort=newest" />
      <div className="grid grid-cols-2 gap-3.5 px-4 pb-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  )
}
