"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        className
      )}
      {...props}
    />
  )
}

type Side = "top" | "right" | "bottom" | "left"

const baseSide: Record<Side, string> = {
  top: "inset-x-0 top-0 border-b w-full",
  bottom: "inset-x-0 bottom-0 border-t w-full max-h-[92vh] rounded-t-xl",
  left: "inset-y-0 left-0 h-full w-80 max-w-[85vw] border-r",
  right: "inset-y-0 right-0 h-full w-80 max-w-[85vw] border-l",
}

/**
 * Keyframes, not transitions. Radix inserts the content already in its open
 * state, so a transition has no first frame to move from — and it unmounts on
 * `animationend`, so a transition gets no closing frame either. Both
 * directions were silent before this.
 */
const motion: Record<Side, string> = {
  top: "data-[state=open]:animate-sheet-in-top data-[state=closed]:animate-sheet-out-top",
  bottom:
    "data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom",
  left: "data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left",
  right:
    "data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right",
}

function SheetContent({
  side = "right",
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: Side
  /**
   * The floating × in the corner. Sheets that put a worded dismiss in their
   * own header — "Done", "Cancel" — should turn it off rather than offer the
   * same action twice.
   */
  showClose?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-xl will-change-transform",
          baseSide[side],
          motion[side],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <SheetPrimitive.Close
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-6 pb-2", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
