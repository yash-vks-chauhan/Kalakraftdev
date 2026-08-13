"use client"

import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { Check, Loader2, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

export interface SheetAction {
  id: string
  label: string
  icon?: LucideIcon
  /** Secondary line under the label. */
  description?: string
  /** Renders as a link instead of a button. */
  href?: string
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
  /** Shows a spinner and blocks interaction. */
  pending?: boolean
  /** Shows a checkmark — for pick-one groups like order status. */
  selected?: boolean
}

export interface ActionSheetGroup {
  label?: string
  actions: SheetAction[]
}

interface ActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  groups: ActionSheetGroup[]
  /** Keep the sheet open after a selection (e.g. while a save is in flight). */
  keepOpenOnSelect?: boolean
  /**
   * Word on the closing button. "Cancel" is right when every row commits
   * something; a sheet whose rows apply as you tap them — the catalogue's
   * filters — has nothing to cancel and says "Done" instead.
   */
  dismissLabel?: string
}

/**
 * Bottom action sheet for row-level admin actions.
 *
 * On desktop each table row can afford three or four inline buttons; on a
 * phone that same row became a horizontal scroll of 32px targets. Collapsing
 * them behind one "⋯" and presenting them here gives every action a full-width
 * 52px target and room for a label, so nothing has to be guessed from an icon.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  groups,
  keepOpenOnSelect = false,
  dismissLabel = "Cancel",
}: ActionSheetProps) {
  const handleSelect = (action: SheetAction) => {
    if (action.disabled || action.pending) return
    if (!keepOpenOnSelect) onOpenChange(false)
    action.onSelect?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dashboard-shell max-h-[85vh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <span aria-hidden className="h-1 w-9 rounded-full bg-border" />
        </div>

        {/* pr-14 clears SheetContent's built-in close button (top-4 right-4),
            which would otherwise sit on top of a truncated title. */}
        <div className="px-5 pb-3 pr-14 pt-1.5">
          <SheetTitle className="truncate text-[15px] font-semibold">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="truncate text-[13px]">
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">
              Available actions
            </SheetDescription>
          )}
        </div>

        {groups.map((group, gi) => (
          <Fragment key={group.label ?? gi}>
            <section className="px-4 pb-2">
              {group.label && (
                <h3 className="px-1 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
              )}
              <ul className="overflow-hidden rounded-xl border bg-card">
                {group.actions.map((action, ai) => (
                  <li key={action.id} className={cn(ai > 0 && "border-t")}>
                    <ActionRow
                      action={action}
                      onSelect={() => handleSelect(action)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </Fragment>
        ))}

        <div className="px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl border bg-card text-[15px] font-semibold text-foreground transition-colors active:bg-secondary"
          >
            {dismissLabel}
          </button>
        </div>

        <div className="pb-safe" />
      </SheetContent>
    </Sheet>
  )
}

function ActionRow({
  action,
  onSelect,
}: {
  action: SheetAction
  onSelect: () => void
}) {
  const Icon = action.icon
  const inert = action.disabled || action.pending

  const inner = (
    <>
      {Icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            action.destructive
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {action.pending ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Icon className="h-[18px] w-[18px]" />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px] font-medium",
            action.destructive ? "text-destructive" : "text-foreground"
          )}
        >
          {action.label}
        </span>
        {action.description && (
          <span className="block truncate text-[13px] text-muted-foreground">
            {action.description}
          </span>
        )}
      </span>
      {action.selected && (
        <Check className="h-[18px] w-[18px] shrink-0 text-foreground" />
      )}
    </>
  )

  const className = cn(
    "flex min-h-[52px] w-full items-center gap-3.5 px-3.5 text-left transition-colors",
    action.destructive ? "active:bg-destructive/10" : "active:bg-secondary/70",
    inert && "pointer-events-none opacity-45"
  )

  if (action.href && !inert) {
    return (
      <Link href={action.href} onClick={onSelect} className={className}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={inert}
      aria-disabled={inert}
      className={className}
    >
      {inner}
    </button>
  )
}
