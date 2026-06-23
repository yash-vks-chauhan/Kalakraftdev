import MobileProductsSkeleton from './MobileProductsSkeleton'

/**
 * Responsive products skeleton.
 *
 * Renders the mobile skeleton below `lg` and a desktop *shell* skeleton
 * (sidebar + top bar + card grid) at `lg` and up — purely via CSS, so it's
 * correct during SSR and the pre-mount gate without any device JS (no
 * mobile-shaped flash on desktop while the page boots).
 */
export default function ProductsSkeleton() {
  return (
    <>
      {/* Mobile / tablet */}
      <div className="lg:hidden">
        <MobileProductsSkeleton />
      </div>

      {/* Desktop shell */}
      <div className="hidden w-full bg-white lg:flex">
        {/* Sidebar */}
        <aside className="sticky top-0 h-screen w-[280px] shrink-0 border-r border-zinc-200/80 bg-white">
          <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200/70 px-5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-100" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-2 w-14 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="space-y-3.5 px-5 py-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 px-6 xl:px-10">
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="h-9 w-40 animate-pulse rounded-full bg-zinc-100" />
          </div>
          <div className="px-6 py-9 xl:px-10">
            <div className="mb-8 space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
              <div className="h-9 w-80 max-w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-zinc-100" />
                  <div className="mt-3.5 space-y-2.5">
                    <div className="h-2.5 w-14 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
