import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading shell for the product page.
 *
 * Two shapes, switched purely by CSS so it is correct during SSR and before
 * device detection resolves — the previous version rendered the desktop
 * twelve-column grid on phones too, which squashed a 76px thumbnail rail and
 * a 586px stage into 390px of screen.
 */
export default function ProductSkeleton() {
  return (
    <>
      {/* Phone: hero, thumbnails, then the buy column — the real order. */}
      <div className="lg:hidden">
        <Skeleton className="aspect-[4/5] w-full rounded-none" />

        <div className="flex gap-1.5 px-4 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-[46px] rounded-lg" />
          ))}
        </div>

        <div className="space-y-3 px-4 pt-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-3.5 w-48" />

          <div className="flex gap-2.5 pt-2">
            <Skeleton className="h-12 w-[132px] rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>

          <Skeleton className="h-11 w-full rounded-[10px]" />

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] rounded-[10px]" />
            ))}
          </div>

          <Skeleton className="h-[104px] w-full rounded-xl" />

          <div className="space-y-2 pt-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      </div>

      {/* Desktop, unchanged. */}
      <main className="mx-auto hidden min-h-screen w-full max-w-[1240px] bg-white px-6 pb-24 pt-8 lg:block lg:px-10">
        <div className="mb-7 h-3 w-40 animate-pulse rounded bg-[#f0f0f0]" />
        <div className="grid grid-cols-12 items-start gap-x-14">
          <div className="col-span-7 grid grid-cols-[76px_minmax(0,1fr)] gap-5">
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-[#f0f0f0]" />
              ))}
            </div>
            <div className="h-[586px] animate-pulse rounded-2xl bg-[#f0f0f0]" />
          </div>
          <div className="col-span-5 space-y-5 pt-2">
            <div className="h-3 w-24 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-11 w-4/5 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-9 w-32 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-20 w-full animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-12 w-full animate-pulse rounded-full bg-[#f0f0f0]" />
          </div>
        </div>
      </main>
    </>
  )
}
