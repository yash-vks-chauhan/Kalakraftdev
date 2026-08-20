"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, SlidersHorizontal, Star } from "lucide-react"

import { ActionSheet } from "../../../_components/ActionSheet"
import {
  MobileColumnHead,
  MobileFacetStrip,
  MobileHeadButton,
  MobileListEmpty,
  MobileListHead,
  MobileListRows,
  MobileListScreen,
  MobileSearchRow,
  type MobileFacet,
} from "../../../_components/MobileListChrome"
import {
  LOW_RATING,
  distributionOf,
  initials,
  shortAgo,
  summarise,
  type Review,
} from "./review"
import { cn } from "@/lib/utils"

type FacetKey = "pending" | "all" | "replied" | "low"
type SortKey = "posted" | "rating"
type SortDir = "asc" | "desc"

const SORTS: { key: SortKey; label: string; description: string }[] = [
  { key: "posted", label: "Posted", description: "Newest first" },
  { key: "rating", label: "Rating", description: "Lowest first" },
]

/** Sorts that read low-to-high first; the rest open descending. */
const ASCENDING_FIRST: SortKey[] = ["rating"]

function matchesFacet(r: Review, facet: FacetKey) {
  if (facet === "pending") return !r.adminReply
  if (facet === "replied") return Boolean(r.adminReply)
  if (facet === "low") return r.rating <= LOW_RATING
  return true
}

/**
 * Reviews, arranged for the job you open them on a phone to do.
 *
 * The desktop page put two Recharts panels and eight top-rated products in
 * front of the list — about 1,750 points, two and a half phone screens, of
 * things you cannot act on ahead of the ones you can. Both charts are replaced
 * here by a 76pt strip that carries the average, the volume and the whole
 * distribution at once, and the top-rated panel becomes a single link at the
 * foot, pointing at the page that already does that job better.
 *
 * The screen opens on `Needs reply` rather than `All`, because twelve
 * unanswered reviews among 248 is the reason you reached for your phone.
 *
 * One deliberate departure from the other two screens: the figure column does
 * not follow the sort. A review's figure is when it landed, and its grade is
 * already drawn as stars beside the name — putting the rating in the column
 * as well would print the same fact twice.
 */
export function ReviewsMobile({
  reviews,
  onOpenReview,
}: {
  reviews: Review[]
  onOpenReview: (review: Review) => void
}) {
  const [query, setQuery] = useState("")
  const [facet, setFacet] = useState<FacetKey>("pending")
  const [sort, setSort] = useState<SortKey>("posted")
  const [dir, setDir] = useState<SortDir>("desc")
  const [sortOpen, setSortOpen] = useState(false)

  const stats = useMemo(() => summarise(reviews), [reviews])
  const distribution = useMemo(() => distributionOf(reviews), [reviews])

  const facets: MobileFacet<FacetKey>[] = [
    { key: "pending", label: "Needs reply", count: stats.pending },
    { key: "all", label: "All", count: stats.total },
    { key: "replied", label: "Replied", count: stats.replied },
    { key: "low", label: "Low", count: stats.low },
  ]

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = reviews.filter((r) => {
      if (!matchesFacet(r, facet)) return false
      if (!q) return true
      const haystack = `${r.user.fullName} ${r.product?.name ?? ""} ${
        r.comment ?? ""
      }`.toLowerCase()
      return haystack.includes(q)
    })

    const factor = dir === "asc" ? 1 : -1
    return [...list].sort((a, b) => {
      if (sort === "rating") {
        // Same rating: the older one has been waiting longer.
        if (a.rating !== b.rating) return (a.rating - b.rating) * factor
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
      )
    })
  }, [reviews, query, facet, sort, dir])

  const activeSort = SORTS.find((s) => s.key === sort) ?? SORTS[0]
  const refined = facet !== "pending" || query.trim().length > 0

  function chooseSort(next: SortKey) {
    if (next === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSort(next)
    setDir(ASCENDING_FIRST.includes(next) ? "asc" : "desc")
  }

  return (
    <MobileListScreen>
      <RatingSummary
        average={stats.avg}
        total={stats.total}
        distribution={distribution}
      />

      <MobileListHead pullUp={false}>
        <MobileSearchRow
          value={query}
          onChange={setQuery}
          placeholder="Search customer, product or text"
          ariaLabel="Search reviews"
        >
          <MobileHeadButton
            onClick={() => setSortOpen(true)}
            label="Sort"
            marked={sort !== "posted" || dir !== "desc"}
          >
            <SlidersHorizontal className="size-[18px]" />
          </MobileHeadButton>
        </MobileSearchRow>

        <MobileFacetStrip
          items={facets}
          value={facet}
          onChange={(key) => setFacet(key)}
          ariaLabel="Filter reviews"
        />

        <MobileColumnHead
          label="Review"
          sortLabel={activeSort.label}
          sortDir={dir}
          onSort={() => setSortOpen(true)}
        />
      </MobileListHead>

      <MobileListRows>
        {visible.length === 0 ? (
          <MobileListEmpty
            eyebrow={refined ? "No match" : "All clear"}
            title={
              reviews.length === 0
                ? "No reviews yet"
                : facet === "pending"
                ? "Every review has an answer"
                : "Nothing in this view"
            }
            description={
              reviews.length === 0
                ? "Customer reviews will show up here."
                : facet === "pending"
                ? "Nothing is waiting on you right now."
                : "Clear the search, or widen the filter."
            }
            actionLabel={refined ? "Reset" : undefined}
            onAction={
              refined
                ? () => {
                    setQuery("")
                    setFacet("pending")
                  }
                : undefined
            }
          />
        ) : (
          visible.map((review, i) => (
            <ReviewRow
              key={review.id}
              review={review}
              last={i === visible.length - 1}
              onOpen={() => onOpenReview(review)}
            />
          ))
        )}
      </MobileListRows>

      {/* Reference data, not work — so it sits at the foot rather than the
          head, and points at the page that already ranks products. */}
      <Link
        href="/dashboard/admin/products/highest-rated"
        className="-mx-4 flex items-center gap-2.5 border-t px-4 py-3.5 text-[14px] text-foreground transition-colors active:bg-wash sm:-mx-6 sm:px-6"
      >
        <Star className="size-4 shrink-0 fill-warning text-warning" />
        Top rated products
        <ChevronRight className="ml-auto size-4 shrink-0 text-faint" />
      </Link>

      <div className="h-6 shrink-0" />

      <ActionSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title="Sort by"
        description="Changes the order, not the column"
        dismissLabel="Done"
        keepOpenOnSelect
        groups={[
          {
            actions: SORTS.map((s) => ({
              id: `sort-${s.key}`,
              label: s.label,
              description: s.description,
              value:
                sort === s.key
                  ? dir === "asc"
                    ? "Low → high"
                    : "High → low"
                  : undefined,
              selected: sort === s.key,
              onSelect: () => chooseSort(s.key),
            })),
          },
        ]}
      />
    </MobileListScreen>
  )
}

/* ---------------------------------------------------------------- summary */

function RatingSummary({
  average,
  total,
  distribution,
}: {
  average: number
  total: number
  distribution: { stars: number; count: number; pct: number }[]
}) {
  return (
    <div className="-mx-4 -mt-5 flex items-center gap-3.5 border-b px-4 pb-3.5 pt-3 sm:-mx-6 sm:px-6">
      <div className="flex shrink-0 flex-col">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
          {total === 0 ? "—" : average.toFixed(1)}
        </span>
        <span className="mt-1 font-mono text-[10.5px] tracking-[0.01em] text-faint">
          {total} review{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {distribution.map((row) => (
          <div key={row.stars} className="flex items-center gap-2">
            <span className="w-2 shrink-0 font-mono text-[10px] tabular-nums text-faint">
              {row.stars}
            </span>
            <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-hairline">
              <span
                className={cn(
                  "block h-full rounded-full",
                  /* The two bars you want to notice are tinted; the rest are
                     ink, so a rising tail reads without any number. */
                  row.stars <= LOW_RATING ? "bg-warning" : "bg-foreground"
                )}
                style={{ width: `${row.pct}%` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-faint">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- row */

function ReviewRow({
  review,
  last,
  onOpen,
}: {
  review: Review
  /** The foot link draws its own full-width rule; a second inset one
      underneath the final row read as a double line. */
  last: boolean
  onOpen: () => void
}) {
  const answered = Boolean(review.adminReply || review.adminReaction)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors active:bg-wash sm:px-6"
    >
      <span
        className={cn(
          "mt-0.5 flex size-[34px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold",
          answered
            ? "bg-secondary text-faint"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {initials(review.user.fullName)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "min-w-0 truncate text-[14px] font-medium tracking-[-0.008em]",
              answered ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {review.user.fullName}
          </span>
          <Stars value={review.rating} muted={answered} />
        </span>

        <span className="truncate font-mono text-[11px] tracking-[0.01em] text-faint">
          {review.product
            ? `${review.product.name} · #${review.product.id}`
            : "Product unavailable"}
        </span>

        {review.comment && (
          <span
            className={cn(
              "mt-1 text-[12.5px] leading-[1.42] text-muted-foreground",
              answered ? "line-clamp-1" : "line-clamp-2"
            )}
          >
            {review.comment}
          </span>
        )}

        {answered && (
          <span className="mt-1.5 flex gap-2 border-l-2 border-hairline pl-2.5 text-[11.5px] leading-[1.4] text-faint">
            <span className="shrink-0 font-mono tracking-[0.01em]">
              You{review.adminReaction ? ` ${review.adminReaction}` : ""}
            </span>
            {review.adminReply && (
              <span className="line-clamp-1">{review.adminReply}</span>
            )}
          </span>
        )}
      </span>

      <span className="mt-1 flex shrink-0 items-center gap-1.5">
        {!answered && (
          <span aria-hidden className="size-[5px] rounded-full bg-foreground" />
        )}
        <span
          className={cn(
            "min-w-[24px] text-right text-[11.5px] tabular-nums",
            answered ? "text-faint" : "font-medium text-foreground"
          )}
        >
          {shortAgo(review.createdAt)}
        </span>
      </span>

      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[62px] right-0 h-px bg-hairline"
        />
      )}
    </button>
  )
}

export function Stars({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span
      className="flex shrink-0 items-center gap-px"
      aria-label={`${value} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-[10px]",
            i <= value
              ? muted
                ? "fill-input text-input"
                : "fill-warning text-warning"
              : "fill-transparent text-input"
          )}
        />
      ))}
    </span>
  )
}
