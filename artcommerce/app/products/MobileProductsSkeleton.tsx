import { Skeleton } from '@/components/ui/skeleton'

/**
 * The Suspense fallback for the mobile catalogue. It mirrors the real header's
 * geometry to the pixel — the 44px tab rail on its rule, the 40px metadata
 * row, then 4:5 tiles in two columns — so nothing jumps when the pieces
 * arrive. Any change to the header has to be made here too.
 */
export default function MobileProductsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-tabbar">
      {/* Stands in for the scroll sentinel, which occupies a real pixel. */}
      <div className="h-px" />

      {/* Category rail. Bars sit inside the tabs' own padding, so they land
          where the labels will. */}
      <div className="flex h-11 items-center border-b px-3.5">
        {[26, 74, 52, 66].map((w, i) => (
          <span key={i} className="px-2.5">
            <Skeleton className="h-3.5" style={{ width: w }} />
          </span>
        ))}
      </div>

      {/* Count on the left, sort and filter on the right. */}
      <div className="flex h-10 items-center justify-between px-3.5">
        <Skeleton className="ml-0.5 h-3 w-14" />
        <div className="flex items-center gap-5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-11" />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 px-3.5 pb-2 pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-1.5">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </li>
        ))}
      </ul>
    </div>
  )
}
