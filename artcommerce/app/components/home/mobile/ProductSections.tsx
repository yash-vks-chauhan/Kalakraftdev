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
      <div className="flex snap-x snap-proximity gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
