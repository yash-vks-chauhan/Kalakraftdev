"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Centred modal. There is no tailwindcss-animate in this project, so the
 * open/close transition is a plain CSS transition keyed off Radix's
 * data-state — the same approach sheet.tsx and drawer.tsx already use, and
 * the reason those two don't pull in an animation library either.
 *
 * z-index clears the app's fixed chrome (the mobile header is z-[1001] and the
 * route veil is z-[1000]), matching the drawer.
 */
const Z_INDEX = "z-[1100]"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 bg-black/45 backdrop-blur-[2px]",
        Z_INDEX,
        "transition-opacity duration-200 ease-out",
        "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

/*
 * Two shapes.
 *
 * "center" is the ordinary modal. "fullscreen" takes the whole viewport with
 * no radius and no visible page behind it — for a phone, where a panel that
 * leaves a strip of the page showing reads as a sheet you could drag, and
 * invites you to try.
 *
 * Height is 100dvh, not 100vh: vh is frozen at the largest viewport, so with
 * the on-screen keyboard up a vh-sized panel is taller than the space it has
 * and its pinned footer sits under the keyboard.
 */
const VARIANTS = {
  center: cn(
    "fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
    "rounded-xl border shadow-2xl",
    "origin-center transition-[opacity,transform] duration-200 ease-out",
    "data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0",
    "data-[state=open]:scale-100 data-[state=open]:opacity-100"
  ),
  fullscreen: cn(
    "fixed inset-0 h-[100dvh] w-screen max-w-none",
    // A short fade-and-rise rather than a long slide. On a phone the keyboard
    // comes up as this lands, and a slow travelling panel colliding with a
    // viewport resize is exactly what makes an opening feel broken.
    "transition-[opacity,transform] duration-[180ms] ease-out",
    "data-[state=closed]:translate-y-3 data-[state=closed]:opacity-0",
    "data-[state=open]:translate-y-0 data-[state=open]:opacity-100"
  ),
} as const

function DialogContent({
  className,
  children,
  showClose = true,
  variant = "center",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean
  variant?: keyof typeof VARIANTS
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        className={cn(
          Z_INDEX,
          "bg-background outline-none will-change-[opacity,transform] motion-reduce:transition-none",
          VARIANTS[variant],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute right-3.5 top-3.5 inline-flex h-8 w-8 items-center justify-center",
              "rounded-md text-muted-foreground transition-colors",
              "hover:bg-secondary hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 px-5 pb-3 pt-5", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-auto flex gap-2.5 border-t px-5 py-3", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[15px] font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
