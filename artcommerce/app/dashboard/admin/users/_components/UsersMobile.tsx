"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Mail,
  MoreVertical,
  Send,
  ShoppingBag,
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
  MobileRowRule,
  MobileSearchRow,
  type MobileFacet,
} from "../../../_components/MobileListChrome"
import { cn } from "@/lib/utils"

export interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string
  abandonedCartCount: number
}

type FacetKey = "all" | "admin" | "user" | "carts"
type SortKey = "joined" | "name" | "cart"
type SortDir = "asc" | "desc"

const SORTS: { key: SortKey; label: string; description: string }[] = [
  { key: "joined", label: "Joined", description: "Newest accounts first" },
  { key: "name", label: "Name", description: "Alphabetical" },
  { key: "cart", label: "Cart", description: "Most left behind" },
]

/** Sorts that read low-to-high first; the rest open descending. */
const ASCENDING_FIRST: SortKey[] = ["name"]

function matchesFacet(u: UserRow, facet: FacetKey) {
  if (facet === "admin") return u.role === "admin"
  if (facet === "user") return u.role !== "admin"
  if (facet === "carts") return u.abandonedCartCount > 0
  return true
}

function initialsOf(name?: string) {
  if (!name) return "?"
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

function shortDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .replace(".", "")
}

function fullDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Unknown"
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * The accounts list as a table that happens to be 390 points wide.
 *
 * The desktop page opened on three stat cards reading 248 / 3 / 245 and a tab
 * strip directly underneath reading 248 / 3 / 245 — the same three numbers,
 * twice, for about 170 points of a screen that shows 716. Here the counts and
 * the filter are one control, and they gained a fourth facet the desktop
 * never had: an abandoned cart is the only state on this page you can act on,
 * and it used to be findable only by reading the third line of every row.
 */
export function UsersMobile({
  users,
  onChangeRole,
  onDelete,
  onRemind,
  onBulkRemind,
  remindingId,
  bulkPending,
}: {
  users: UserRow[]
  onChangeRole: (user: UserRow) => void
  onDelete: (user: UserRow) => void
  onRemind: (id: number) => void
  onBulkRemind: (ids: number[]) => void
  remindingId: number | null
  bulkPending: boolean
}) {
  const [query, setQuery] = useState("")
  const [facet, setFacet] = useState<FacetKey>("all")
  const [sort, setSort] = useState<SortKey>("joined")
  const [dir, setDir] = useState<SortDir>("desc")

  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const [sortOpen, setSortOpen] = useState(false)
  const [rowOpen, setRowOpen] = useState(false)
  /* Held by id, not by value: the row can change under an open sheet — a
     promotion lands while it is up — and the sheet has to read the account
     the list is holding now, not a snapshot from when it opened. */
  const [targetId, setTargetId] = useState<number | null>(null)
  const target = useMemo(
    () => (targetId === null ? null : users.find((u) => u.id === targetId) ?? null),
    [users, targetId]
  )

  /* Select mode owns the bottom of the screen; the app-wide dock steps aside
     rather than being covered by a bar it would paint over anyway. */
  useEffect(() => {
    if (!selecting) return
    document.body.dataset.hideDock = "1"
    return () => {
      delete document.body.dataset.hideDock
    }
  }, [selecting])

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => matchesFacet(u, "admin")).length,
      user: users.filter((u) => matchesFacet(u, "user")).length,
      carts: users.filter((u) => matchesFacet(u, "carts")).length,
    }),
    [users]
  )

  const facets: MobileFacet<FacetKey>[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "admin", label: "Admins", count: counts.admin },
    { key: "user", label: "Customers", count: counts.user },
    { key: "carts", label: "Carts", count: counts.carts },
  ]

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users.filter((u) => {
      if (!matchesFacet(u, facet)) return false
      if (!q) return true
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      )
    })

    const factor = dir === "asc" ? 1 : -1
    return [...list].sort((a, b) => {
      if (sort === "name")
        return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }) * factor
      if (sort === "cart") return (a.abandonedCartCount - b.abandonedCartCount) * factor
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
      )
    })
  }, [users, query, facet, sort, dir])

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

  function openRow(user: UserRow) {
    setTargetId(user.id)
    setRowOpen(true)
  }

  const pickedIds = useMemo(
    () => visible.filter((u) => picked.has(u.id)).map((u) => u.id),
    [visible, picked]
  )
  const remindableIds = useMemo(
    () =>
      visible
        .filter((u) => picked.has(u.id) && u.abandonedCartCount > 0)
        .map((u) => u.id),
    [visible, picked]
  )

  const refined = facet !== "all" || query.trim().length > 0

  return (
    <MobileListScreen>
      <MobileListHead>
        <MobileSearchRow
          value={query}
          onChange={setQuery}
          placeholder="Search name, email or id"
          ariaLabel="Search accounts"
        >
          <MobileHeadButton
            onClick={() => setSortOpen(true)}
            label="Sort"
            marked={sort !== "joined" || dir !== "desc"}
          >
            <SlidersHorizontal className="size-[18px]" />
          </MobileHeadButton>
        </MobileSearchRow>

        <MobileFacetStrip
          items={facets}
          value={facet}
          onChange={(key) => setFacet(key)}
          ariaLabel="Filter accounts"
        />

        <MobileColumnHead
          label="Customer"
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
            title={refined ? "Nothing in this view" : "No accounts yet"}
            description={
              refined
                ? "Clear the search, or widen the filter."
                : "Accounts appear here as people sign up."
            }
            actionLabel={refined ? "Reset" : undefined}
            onAction={
              refined
                ? () => {
                    setQuery("")
                    setFacet("all")
                  }
                : undefined
            }
          />
        ) : (
          visible.map((user) => (
            <UserRowItem
              key={user.id}
              user={user}
              sort={sort}
              selecting={selecting}
              picked={picked.has(user.id)}
              onOpen={() => (selecting ? togglePick(user.id) : openRow(user))}
              onActions={() => openRow(user)}
            />
          ))
        )}
      </MobileListRows>

      {/* Clears the dock, or the bulk bar when selecting. */}
      <div className={cn("shrink-0", selecting ? "h-24" : "h-6")} />

      <MobileBulkBar
        visible={selecting}
        label={
          bulkPending
            ? "Sending…"
            : `${pickedIds.length} selected${
                pickedIds.length > remindableIds.length
                  ? ` · ${remindableIds.length} with a cart`
                  : ""
              }`
        }
      >
        <MobileBulkButton
          disabled={remindableIds.length === 0 || bulkPending}
          onClick={() => {
            onBulkRemind(remindableIds)
            leaveSelectMode()
          }}
        >
          Remind
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
        <UserActionSheet
          key={target.id}
          open={rowOpen}
          onOpenChange={setRowOpen}
          user={target}
          reminding={remindingId === target.id}
          onChangeRole={onChangeRole}
          onRemind={onRemind}
          onDelete={onDelete}
        />
      )}
    </MobileListScreen>
  )
}

/* -------------------------------------------------------------------- row */

function UserRowItem({
  user,
  sort,
  selecting,
  picked,
  onOpen,
  onActions,
}: {
  user: UserRow
  sort: SortKey
  selecting: boolean
  picked: boolean
  onOpen: () => void
  onActions: () => void
}) {
  const isAdmin = user.role === "admin"
  const hasCart = user.abandonedCartCount > 0

  /* The figure column shows whatever the list is sorted by. "Name" has no
     figure of its own, so it keeps showing the join date rather than leaving
     the column empty and the header lying. */
  const value = sort === "cart" ? String(user.abandonedCartCount) : shortDate(user.createdAt)

  const meta = hasCart
    ? `#${user.id} · ${user.abandonedCartCount} item${
        user.abandonedCartCount === 1 ? "" : "s"
      } in cart`
    : `#${user.id} · ${user.email}`

  return (
    <div className="relative flex min-h-[62px] items-center gap-2.5 px-4 transition-colors active:bg-wash sm:px-6">
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

        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-secondary text-[11.5px] font-semibold text-muted-foreground">
          {initialsOf(user.fullName)}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate text-[14px] font-medium tracking-[-0.008em] text-foreground">
              {user.fullName || "Unnamed account"}
            </span>
            {isAdmin && (
              <span className="shrink-0 font-mono text-[10px] tracking-[0.01em] text-faint">
                Admin
              </span>
            )}
          </span>
          <span className="truncate font-mono text-[11px] tracking-[0.01em] text-faint">
            {meta}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          {hasCart && (
            <span aria-hidden className="size-[5px] rounded-full bg-warning" />
          )}
          <span
            className={cn(
              "min-w-[26px] text-right text-[14px] font-medium tabular-nums",
              hasCart && sort === "cart" ? "text-warning" : "text-foreground"
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
          aria-label={`Actions for ${user.fullName || "this account"}`}
          className="-mr-2 flex h-[62px] w-9 shrink-0 items-center justify-center text-faint transition-colors active:text-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      )}

      <MobileRowRule inset={selecting ? 86 : 62} />
    </div>
  )
}

/* ------------------------------------------------------------------ sheet */

function UserActionSheet({
  open,
  onOpenChange,
  user,
  reminding,
  onChangeRole,
  onRemind,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow
  reminding: boolean
  onChangeRole: (user: UserRow) => void
  onRemind: (id: number) => void
  onDelete: (user: UserRow) => void
}) {
  const isAdmin = user.role === "admin"
  const hasCart = user.abandonedCartCount > 0

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={user.fullName || "Unnamed account"}
      description={`#${user.id} · joined ${fullDate(user.createdAt)}`}
      groups={[
        {
          actions: [
            {
              id: "role",
              label: isAdmin ? "Demote to customer" : "Promote to admin",
              icon: isAdmin ? ArrowDownCircle : ArrowUpCircle,
              description: isAdmin
                ? "Removes dashboard access"
                : "Grants full dashboard access",
              onSelect: () => onChangeRole(user),
            },
            {
              id: "orders",
              label: "View their orders",
              icon: ShoppingBag,
              href: `/dashboard/admin/orders?userId=${user.id}`,
            },
            {
              id: "remind",
              label: "Send cart reminder",
              icon: Send,
              description: hasCart
                ? `${user.abandonedCartCount} item${
                    user.abandonedCartCount === 1 ? "" : "s"
                  } left behind`
                : "Nothing left in their cart",
              disabled: !hasCart,
              pending: reminding,
              onSelect: () => onRemind(user.id),
            },
            {
              id: "email",
              label: "Email customer",
              icon: Mail,
              description: user.email,
              href: `mailto:${user.email}`,
            },
          ],
        },
        {
          actions: [
            {
              id: "delete",
              label: "Delete account",
              description: "Cannot be undone",
              icon: Trash2,
              destructive: true,
              onSelect: () => {
                onOpenChange(false)
                onDelete(user)
              },
            },
          ],
        },
      ]}
    />
  )
}
