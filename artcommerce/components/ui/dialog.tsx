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

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          Z_INDEX,
          "rounded-xl border bg-background shadow-2xl outline-none",
          // Rise-and-settle: 8px up and a hair small on the way in. Transform
          // is composited, so this stays smooth on a mid-range phone.
          "origin-center transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
          "data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0",
          "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          "motion-reduce:transition-none",
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
