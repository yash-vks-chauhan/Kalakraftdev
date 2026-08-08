import { Skeleton } from '@/components/ui/skeleton'

/**
 * The Suspense fallback for the mobile catalogue. It mirrors the real grid's
 * geometry — sticky rail, tools row, 4:5 tiles in two columns — so nothing
 * jumps when the pieces arrive.
 */
export default function MobileProductsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <div className="flex items-baseline justify-between gap-3 px-4 pb-3 pt-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="flex gap-2 px-4 py-2">
        {[56, 92, 74, 88].map((w, i) => (
          <Skeleton key={i} className="h-[34px] rounded-full" style={{ width: w }} />
        ))}
      </div>

      <div className="flex gap-2 px-4 pb-2.5">
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
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
