"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import { ChevronRight, Loader2, Package, ShoppingBag } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { QUICK_REACTIONS, timeAgo, type Review } from "./review"
import { Stars } from "./ReviewsMobile"

const MAX_REPLY = 2000

/**
 * Answering a review, from the bottom of the screen.
 *
 * The desktop composer is `<Sheet side="right">` — a drawer flying in from the
 * edge at full width, which is a desk pattern wearing a phone's dimensions.
 * This rises from the bottom like every other sheet in the app, and it is
 * where the reactions now live: in the list they were four unlabelled 32pt
 * circles that fired a PATCH on a single tap, with no undo, on a surface you
 * scroll with your thumb. Here they carry words, they show which one is
 * already set, and nothing commits until you send.
 */
export function ReplySheet({
  open,
  onOpenChange,
  review,
  reply,
  onReplyChange,
  reaction,
  onReactionChange,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  review: Review | null
  reply: string
  onReplyChange: (next: string) => void
  reaction: string | null
  onReactionChange: (next: string | null) => void
  saving: boolean
  onSubmit: (e?: FormEvent) => void
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <SheetContent
        side="bottom"
        showClose={false}
        className="dashboard-shell max-h-[92vh] gap-0 overflow-hidden rounded-t-xl border-t-hairline p-0 shadow-sheet"
      >
        <span
          aria-hidden
          className="flex shrink-0 cursor-grab justify-center pb-1 pt-2.5 active:cursor-grabbing"
        >
          <span className="h-1 w-9 rounded-full bg-input" />
        </span>

        {review ? (
          <>
            <div className="flex shrink-0 items-baseline gap-3 border-b px-4 pb-3 pt-1">
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-[15px] font-semibold tracking-[-0.012em]">
                  {review.user.fullName}
                </SheetTitle>
                <SheetDescription className="mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-[11px] tracking-[0.01em] text-faint">
                  <Stars value={review.rating} />
                  <span className="truncate">
                    {review.product ? review.product.name : "Product unavailable"} ·{" "}
                    {timeAgo(review.createdAt)}
                  </span>
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="shrink-0 py-1 font-mono text-[11px] tracking-[0.01em] text-foreground disabled:opacity-40"
              >
                Done
              </button>
            </div>

            <form
              id="review-reply-form"
              onSubmit={onSubmit}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {review.comment ? (
                <blockquote className="mx-4 mt-3 rounded-md border bg-wash px-3 py-2.5 text-[12.5px] leading-[1.45] text-foreground">
                  {review.comment}
                </blockquote>
              ) : (
                <p className="mx-4 mt-3 rounded-md border border-dashed px-3 py-2.5 text-[12.5px] text-faint">
                  A rating with no comment.
                </p>
              )}

              <span className="block px-4 pb-1.5 pt-4 font-mono text-[11px] tracking-[0.01em] text-faint">
                Reaction
              </span>
              <div className="flex flex-wrap gap-1.5 px-4">
                {QUICK_REACTIONS.map(({ value, icon: Icon, label }) => {
                  const on = reaction === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onReactionChange(on ? null : value)}
                      aria-pressed={on}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                        on
                          ? "border-foreground bg-foreground text-background"
                          : "border-input text-muted-foreground active:bg-wash"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-baseline gap-3 px-4 pb-1.5 pt-4">
                <label
                  htmlFor="review-reply"
                  className="flex-1 font-mono text-[11px] tracking-[0.01em] text-faint"
                >
                  Reply
                </label>
                <span className="font-mono text-[10px] tabular-nums text-faint">
                  {reply.length} / {MAX_REPLY}
                </span>
              </div>
              <div className="px-4">
                <textarea
                  id="review-reply"
                  value={reply}
                  onChange={(e) => onReplyChange(e.target.value)}
                  maxLength={MAX_REPLY}
                  rows={4}
                  placeholder="Thanks for taking the time to write this…"
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-[14px] leading-[1.45] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-foreground focus:shadow-[0_0_0_3px_hsl(var(--foreground)/0.07)]"
                />
              </div>

              {/* The two questions you actually have while writing an
                  apology, one tap from the review that prompted it. */}
              <div className="mt-4 border-t">
                {review.product && (
                  <SheetLink
                    href={`/products/${review.product.id}`}
                    icon={<Package className="size-[15px]" />}
                    label="View the product"
                  />
                )}
                <SheetLink
                  href={`/dashboard/admin/orders?userId=${review.user.id}`}
                  icon={<ShoppingBag className="size-[15px]" />}
                  label={`${review.user.fullName.split(" ")[0]}'s orders`}
                />
              </div>

              <div className="h-3" />
            </form>

            <div className="shrink-0 border-t px-4 pb-safe pt-3">
              <button
                type="submit"
                form="review-reply-form"
                disabled={saving}
                className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground text-[14.5px] font-medium text-background transition-opacity active:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {review.adminReply ? "Save reply" : "Send reply"}
              </button>
            </div>
          </>
        ) : (
          <>
            <SheetTitle className="sr-only">Respond to review</SheetTitle>
            <SheetDescription className="sr-only">
              No review selected
            </SheetDescription>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SheetLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 border-b px-4 py-3 text-[14px] text-foreground transition-colors last:border-b-0 active:bg-wash"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-faint" />
    </Link>
  )
}
