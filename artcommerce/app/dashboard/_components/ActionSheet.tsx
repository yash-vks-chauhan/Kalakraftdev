"use client"

import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { Check, ChevronRight, Loader2, type LucideIcon } from "lucide-react"

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
  /** Secondary line under the label. Rendered as a mono micro-label. */
  description?: string
  /** Right-aligned value — a count, a current setting. */
  value?: ReactNode
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
   * Word on the closing control. "Cancel" is right when every row commits
   * something; a sheet whose rows apply as you tap them — the catalogue's
   * filters — has nothing to cancel and says "Done" instead.
   */
  dismissLabel?: string
  /** Extra control on the head row, left of the dismiss word (e.g. "Reset"). */
  headAction?: { label: string; onSelect: () => void }
  /** Rendered above the rows — a stock stepper, a summary. */
  children?: ReactNode
  /** Pinned below the rows. */
  footer?: ReactNode
}

/**
 * Bottom sheet for row-level admin actions.
 *
 * On desktop a table row affords three or four inline buttons; on a phone that
 * became a horizontal scroll of 32px targets. Collapsing them behind one "⋯"
 * and presenting them here gives every action a 52px target and room for a
 * label, so nothing has to be guessed from an icon.
 *
 * Drawn in the catalogue's language: hairline-separated rows on white rather
 * than bordered cards floating on a wash. A sheet is the only elevated surface
 * in the app, so it is the only one carrying a shadow.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  groups,
  keepOpenOnSelect = false,
  dismissLabel = "Cancel",
  headAction,
  children,
  footer,
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
        showClose={false}
        className="group dashboard-shell max-h-[86vh] gap-0 overflow-hidden rounded-t-xl border-t-hairline p-0 shadow-sheet"
      >
        {/* The grabber is the affordance for drag-to-dismiss, and the gesture
            is now real — SheetContent tracks the pointer. The 18px band round
            it is the actual target; the bar itself would be a 4px one. */}
        <span
          aria-hidden
          className="flex shrink-0 cursor-grab justify-center pb-1 pt-2.5 active:cursor-grabbing"
        >
          <span className="h-1 w-9 rounded-full bg-input transition-colors group-data-[dragging]:bg-faint" />
        </span>

        <div className="flex shrink-0 items-baseline gap-3 border-b px-4 pb-3 pt-3.5">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[15px] font-semibold tracking-[-0.012em]">
              {title}
            </SheetTitle>
            {description ? (
              <SheetDescription className="truncate font-mono text-[11px] tracking-[0.01em] text-faint">
                {description}
              </SheetDescription>
            ) : (
              <SheetDescription className="sr-only">
                Available actions
              </SheetDescription>
            )}
          </div>
          {headAction && (
            <button
              type="button"
              onClick={headAction.onSelect}
              className="shrink-0 py-1 font-mono text-[11px] tracking-[0.01em] text-muted-foreground transition-colors active:text-foreground"
            >
              {headAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 py-1 font-mono text-[11px] tracking-[0.01em] text-foreground"
          >
            {dismissLabel}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {children}

          {groups.map((group, gi) => (
            <Fragment key={group.label ?? gi}>
              {group.label && (
                <h3 className="px-4 pb-1.5 pt-4 font-mono text-[11px] tracking-[0.01em] text-faint">
                  {group.label}
                </h3>
              )}
              <ul>
                {group.actions.map((action) => (
                  <li key={action.id}>
                    <ActionRow
                      action={action}
                      onSelect={() => handleSelect(action)}
                    />
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}

          {/* Clears the home indicator when there is no footer. */}
          {!footer && <div className="h-4 pb-safe" />}
        </div>

        {footer && (
          <div className="shrink-0 border-t px-4 pb-safe pt-3">
            <div className="pb-3">{footer}</div>
          </div>
        )}
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
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[14.5px] font-normal tracking-[-0.006em]",
            action.destructive ? "text-destructive" : "text-foreground"
          )}
        >
          {action.label}
        </span>
        {action.description && (
          <span className="block truncate font-mono text-[11px] tracking-[0.01em] text-faint">
            {action.description}
          </span>
        )}
      </span>

      {action.value !== undefined && action.value !== null && (
        <span className="max-w-[55%] shrink-0 truncate text-right text-[13.5px] tabular-nums text-foreground">
          {action.value}
        </span>
      )}

      {action.selected && <Check className="size-[15px] shrink-0 text-foreground" />}

      {action.pending ? (
        <Loader2 className="size-[15px] shrink-0 animate-spin text-muted-foreground" />
      ) : Icon ? (
        <Icon
          className={cn(
            "size-[15px] shrink-0",
            action.destructive ? "text-destructive" : "text-faint"
          )}
        />
      ) : action.href ? (
        <ChevronRight className="size-[15px] shrink-0 text-faint" />
      ) : null}
    </>
  )

  const className = cn(
    "flex min-h-[52px] w-full items-center gap-3 border-b border-hairline px-4 py-2 text-left transition-colors",
    action.destructive ? "active:bg-destructive/5" : "active:bg-wash",
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
