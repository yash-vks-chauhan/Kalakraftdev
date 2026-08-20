"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  Copy,
  MoreVertical,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"

import { ActionSheet } from "../../../_components/ActionSheet"
import {
  MobileBulkBar,
  MobileBulkButton,
  MobileColumnAction,
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
  formatAmount,
  formatDate,
  getStatus,
  shortExpiry,
  usageShare,
  type Coupon,
} from "./coupon"
import { cn } from "@/lib/utils"

type FacetKey = "all" | "active" | "expired" | "used-up"
type SortKey = "expires" | "redeemed" | "value"
type SortDir = "asc" | "desc"

const SORTS: { key: SortKey; label: string; description: string }[] = [
  { key: "expires", label: "Expires", description: "What runs out next" },
  { key: "redeemed", label: "Redeemed", description: "Most used first" },
  { key: "value", label: "Value", description: "Deepest discount first" },
]

/** Sorts that read low-to-high first; the rest open descending. */
const ASCENDING_FIRST: SortKey[] = ["expires"]

function matchesFacet(c: Coupon, facet: FacetKey) {
  if (facet === "all") return true
  return getStatus(c) === facet
}

/**
 * The coupon list, with its two live numbers on one line each.
 *
 * A coupon you have to think about is one about to run out or about to be
 * exhausted, so the screen opens on soonest expiry and puts the remaining
 * days in the figure column. The other number — redemptions against the
 * limit — is drawn as the rule between rows: the hairline that separates one
 * coupon from the next fills from the left to the share redeemed, which costs
 * no height at all and turns a screenful of coupons into a bar chart you can
 * read without reading.
 */
export function CouponsMobile({
  coupons,
  onEdit,
  onNew,
  onDelete,
  onBulkDelete,
  bulkPending,
}: {
  coupons: Coupon[]
  onEdit: (coupon: Coupon) => void
  onNew: () => void
  onDelete: (coupon: Coupon) => void
  onBulkDelete: (ids: number[]) => void
  bulkPending: boolean
}) {
  const [query, setQuery] = useState("")
  const [facet, setFacet] = useState<FacetKey>("all")
  const [sort, setSort] = useState<SortKey>("expires")
  const [dir, setDir] = useState<SortDir>("asc")

  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const [sortOpen, setSortOpen] = useState(false)
  const [rowOpen, setRowOpen] = useState(false)
  /* Held by id so an edit landing under an open sheet is reflected in it. */
  const [targetId, setTargetId] = useState<number | null>(null)
  const target = useMemo(
    () => (targetId === null ? null : coupons.find((c) => c.id === targetId) ?? null),
    [coupons, targetId]
  )

  useEffect(() => {
    if (!selecting) return
    document.body.dataset.hideDock = "1"
    return () => {
      delete document.body.dataset.hideDock
    }
  }, [selecting])

  const counts = useMemo(
    () => ({
      all: coupons.length,
      active: coupons.filter((c) => matchesFacet(c, "active")).length,
      expired: coupons.filter((c) => matchesFacet(c, "expired")).length,
      "used-up": coupons.filter((c) => matchesFacet(c, "used-up")).length,
    }),
    [coupons]
  )

  const facets: MobileFacet<FacetKey>[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "expired", label: "Expired", count: counts.expired },
    { key: "used-up", label: "Used up", count: counts["used-up"] },
  ]

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = coupons.filter((c) => {
      if (!matchesFacet(c, facet)) return false
      return !q || c.code.toLowerCase().includes(q)
    })

    const factor = dir === "asc" ? 1 : -1
    return [...list].sort((a, b) => {
      if (sort === "redeemed") return (a.usedCount - b.usedCount) * factor
      if (sort === "value") {
        // A percentage and a rupee amount aren't the same unit, so they can't
        // share a scale. Percentages sort among themselves above flat amounts.
        const rank = (c: Coupon) =>
          c.type === "percentage" ? 1_000_000 + c.amount : c.amount
        return (rank(a) - rank(b)) * factor
      }
      /* "What runs out next" cannot open on coupons that ran out months ago,
         so expiry groups before it orders: everything still running first,
         then the expired, most recently expired at the top of that group.
         The grouping holds in both directions; the arrow flips the order
         inside each group. */
      const now = Date.now()
      const ta = new Date(a.expiresAt).getTime() - now
      const tb = new Date(b.expiresAt).getTime() - now
      const aDone = ta < 0
      const bDone = tb < 0
      if (aDone !== bDone) return aDone ? 1 : -1
      return (aDone ? tb - ta : ta - tb) * factor
    })
  }, [coupons, query, facet, sort, dir])

  const activeSort = SORTS.find((s) => s.key === sort) ?? SORTS[0]

  function chooseSort(next: SortKey) {
    if (next === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSort(next)
    setDir(ASCENDING_FIRST.includes(next) ? "asc" : "desc")
  }

  function togglePick(id: number) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function leaveSelectMode() {
    setSelecting(false)
    setPicked(new Set())
  }

  const pickedIds = useMemo(
    () => visible.filter((c) => picked.has(c.id)).map((c) => c.id),
    [visible, picked]
  )

  const refined = facet !== "all" || query.trim().length > 0

  return (
    <MobileListScreen>
      <MobileListHead>
        <MobileSearchRow
          value={query}
          onChange={setQuery}
          placeholder="Search codes"
          ariaLabel="Search coupons"
        >
          <MobileHeadButton
            onClick={() => setSortOpen(true)}
            label="Sort"
            marked={sort !== "expires" || dir !== "asc"}
          >
            <SlidersHorizontal className="size-[18px]" />
          </MobileHeadButton>
          <MobileHeadButton onClick={onNew} label="New coupon">
            <Plus className="size-[18px]" />
          </MobileHeadButton>
        </MobileSearchRow>

        <MobileFacetStrip
          items={facets}
          value={facet}
          onChange={(key) => setFacet(key)}
          ariaLabel="Filter coupons by status"
        />

        <MobileColumnHead
          label="Code"
          sortLabel={activeSort.label}
          sortDir={dir}
          onSort={() => setSortOpen(true)}
          trailing={
            <MobileColumnAction
              active={selecting}
              onClick={() => (selecting ? leaveSelectMode() : setSelecting(true))}
            >
              {selecting ? "Done" : "Select"}
            </MobileColumnAction>
          }
        />
      </MobileListHead>

      <MobileListRows>
        {visible.length === 0 ? (
          <MobileListEmpty
            eyebrow={refined ? "No match" : "Empty"}
            title={refined ? "Nothing in this view" : "No coupons yet"}
            description={
              refined
                ? "Clear the search, or widen the filter."
                : "Create a code and it will show up here."
            }
            actionLabel={refined ? "Reset" : "New coupon"}
            onAction={
              refined
                ? () => {
                    setQuery("")
                    setFacet("all")
                  }
                : onNew
            }
          />
        ) : (
          visible.map((coupon) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              sort={sort}
              selecting={selecting}
              picked={picked.has(coupon.id)}
              onOpen={() => {
                if (selecting) togglePick(coupon.id)
                else onEdit(coupon)
              }}
              onActions={() => {
                setTargetId(coupon.id)
                setRowOpen(true)
              }}
            />
          ))
        )}
      </MobileListRows>

      <div className={cn("shrink-0", selecting ? "h-24" : "h-6")} />

      <MobileBulkBar
        visible={selecting}
        label={bulkPending ? "Working…" : `${pickedIds.length} selected`}
      >
        <MobileBulkButton
          destructive
          disabled={pickedIds.length === 0 || bulkPending}
          onClick={() => {
            onBulkDelete(pickedIds)
            leaveSelectMode()
          }}
        >
          Delete
        </MobileBulkButton>
      </MobileBulkBar>

      <ActionSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title="Sort by"
        description="The right-hand column follows this"
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

      {target && (
        <CouponActionSheet
          key={target.id}
          open={rowOpen}
          onOpenChange={setRowOpen}
          coupon={target}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </MobileListScreen>
  )
}

/* -------------------------------------------------------------------- row */

function CouponRow({
  coupon,
  sort,
  selecting,
  picked,
  onOpen,
  onActions,
}: {
  coupon: Coupon
  sort: SortKey
  selecting: boolean
  picked: boolean
  onOpen: () => void
  onActions: () => void
}) {
  const status = getStatus(coupon)
  const expired = status === "expired"
  const spent = status === "used-up"
  const share = usageShare(coupon)

  const value =
    sort === "redeemed"
      ? coupon.usedCount.toLocaleString()
      : sort === "value"
      ? coupon.type === "percentage"
        ? `${coupon.amount}%`
        : `₹${coupon.amount.toLocaleString("en-IN")}`
      : shortExpiry(coupon.expiresAt)

  const meta = [
    formatAmount(coupon),
    coupon.usageLimit == null
      ? `${coupon.usedCount} redeemed · unlimited`
      : `${coupon.usedCount} of ${coupon.usageLimit} redeemed`,
  ].join(" · ")

  return (
    <div className="relative flex min-h-[58px] items-center gap-2.5 px-4 transition-colors active:bg-wash sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
        aria-pressed={selecting ? picked : undefined}
      >
        {selecting && (
          <span
            className={cn(
              "flex size-[19px] shrink-0 items-center justify-center rounded-sm border transition-colors",
              picked
                ? "border-foreground bg-foreground text-background"
                : "border-input text-transparent"
            )}
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            {/* The code keeps its capitals: the API stores it uppercase and
                the shopper types it that way, so this is data rather than a
                styling choice. Every label around it is Sentence case. */}
            <span
              className={cn(
                "min-w-0 truncate font-mono text-[13.5px] font-medium tracking-[0.06em]",
                expired ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {coupon.code}
            </span>
            {spent && (
              <span className="shrink-0 font-mono text-[10px] tracking-[0.01em] text-faint">
                Used up
              </span>
            )}
          </span>
          <span
            className={cn(
              "truncate font-mono text-[11px] tracking-[0.01em]",
              expired ? "text-faint/70" : "text-faint"
            )}
          >
            {meta}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          {/* Only the nearly-spent get a dot. A coupon that is actually used
              up already carries the word and a full red rule. */}
          {!expired && !spent && share != null && share >= 75 && (
            <span aria-hidden className="size-[5px] rounded-full bg-warning" />
          )}
          <span
            className={cn(
              "min-w-[38px] text-right text-[14px] font-medium tabular-nums",
              expired ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {value}
          </span>
        </span>
      </button>

      {!selecting && (
        <button
          type="button"
          onClick={onActions}
          aria-label={`Actions for ${coupon.code}`}
          className="-mr-2 flex h-[58px] w-9 shrink-0 items-center justify-center text-faint transition-colors active:text-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      )}

      {/* The rule between rows, doing a second job. */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 right-0 left-4 sm:left-6",
          share == null ? "h-px bg-hairline" : "h-0.5 bg-hairline"
        )}
      >
        {share != null && (
          <span
            className={cn(
              "absolute inset-y-0 left-0",
              expired
                ? "bg-input"
                : share >= 100
                ? "bg-destructive"
                : share >= 75
                ? "bg-warning"
                : "bg-foreground"
            )}
            style={{ width: `${share}%` }}
          />
        )}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ sheet */

function CouponActionSheet({
  open,
  onOpenChange,
  coupon,
  onEdit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon
  onEdit: (coupon: Coupon) => void
  onDelete: (coupon: Coupon) => void
}) {
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(coupon.code)
      toast.success(`Copied ${coupon.code}`)
    } catch {
      toast.error("Could not copy the code")
    }
  }

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={coupon.code}
      description={`${formatAmount(coupon)} · expires ${formatDate(coupon.expiresAt)}`}
      groups={[
        {
          actions: [
            {
              id: "copy",
              label: "Copy code",
              description: "To the clipboard",
              icon: Copy,
              onSelect: copyCode,
            },
            {
              id: "edit",
              label: "Edit coupon",
              icon: Pencil,
              description:
                coupon.usageLimit == null
                  ? `${coupon.usedCount} redeemed so far`
                  : `${coupon.usedCount} of ${coupon.usageLimit} redeemed`,
              onSelect: () => onEdit(coupon),
            },
          ],
        },
        {
          actions: [
            {
              id: "delete",
              label: "Delete coupon",
              description: "Cannot be undone",
              icon: Trash2,
              destructive: true,
              onSelect: () => {
                onOpenChange(false)
                onDelete(coupon)
              },
            },
          ],
        },
      ]}
    />
  )
}
