"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Overlay
      ref={ref}
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        className
      )}
      {...props}
    />
  )
})

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

/* --- drag-to-dismiss tuning ------------------------------------------- */

/** Past this, releasing dismisses regardless of how slowly you got there. */
const DISMISS_DISTANCE = 96
/** A flick: px per ms. Below the distance threshold, speed still dismisses. */
const DISMISS_VELOCITY = 0.55
/** How far a deliberate pull past the top edge can stretch the sheet. */
const RUBBER_BAND_MAX = 44
/** The gesture only counts as a drag after this much travel. */
const SLOP = 5

const SETTLE_OUT = 200
const SETTLE_BACK = 260

/**
 * True when nothing between `target` and the sheet is a scroll container that
 * has already been scrolled. A downward drag inside a half-scrolled list is
 * the list scrolling back up, not the sheet being dismissed.
 */
function startsAtScrollTop(target: Element | null, root: HTMLElement) {
  let node: Element | null = target
  while (node && node !== root) {
    const el = node as HTMLElement
    if (el.scrollHeight > el.clientHeight + 1) {
      const overflowY = getComputedStyle(el).overflowY
      if (overflowY === "auto" || overflowY === "scroll") return el.scrollTop <= 0
    }
    node = el.parentElement
  }
  return true
}

function SheetContent({
  side = "right",
  className,
  children,
  showClose = true,
  dismissible,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: Side
  /**
   * The floating × in the corner. Sheets that put a worded dismiss in their
   * own header — "Done", "Cancel" — should turn it off rather than offer the
   * same action twice.
   */
  showClose?: boolean
  /**
   * Drag the sheet down to dismiss it. On by default for bottom sheets, which
   * is the only side where the gesture matches how the sheet arrived. Put
   * `data-sheet-no-drag` on anything inside that owns its own vertical
   * gesture (a slider, a signature pad) to opt that subtree out.
   */
  dismissible?: boolean
}) {
  const draggable = dismissible ?? side === "bottom"

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const closeRef = React.useRef<HTMLButtonElement | null>(null)
  const settleTimer = React.useRef<number | null>(null)

  /* The drag itself is written straight to the DOM rather than through state:
     a re-render per pointermove is exactly the lag the gesture is meant to
     remove. React only hears about the two moments that change the styling
     rules — the drag starting, and the sheet settling. */
  const gesture = React.useRef({
    pointerId: -1,
    armed: false,
    active: false,
    startX: 0,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    fromTop: true,
  })

  const [dragging, setDragging] = React.useState(false)
  const [settling, setSettling] = React.useState(false)

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  React.useEffect(
    () => () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current)
    },
    []
  )

  /* Pointer capture keeps the events coming, but on touch the browser will
     still try to scroll the page underneath. Only a non-passive listener can
     say no. */
  React.useEffect(() => {
    const el = contentRef.current
    if (!el || !draggable) return
    const block = (e: TouchEvent) => {
      if (gesture.current.active) e.preventDefault()
    }
    el.addEventListener("touchmove", block, { passive: false })
    return () => el.removeEventListener("touchmove", block)
  }, [draggable])

  const paint = React.useCallback((offset: number) => {
    const el = contentRef.current
    if (!el) return
    const y =
      offset >= 0
        ? offset
        : -Math.min(RUBBER_BAND_MAX, Math.pow(-offset, 0.72) * 1.6)
    el.style.transform = `translate3d(0, ${y}px, 0)`
    const overlay = overlayRef.current
    if (overlay) {
      const height = el.offsetHeight || 1
      overlay.style.opacity = String(
        Math.max(0, Math.min(1, 1 - Math.max(0, y) / height))
      )
    }
  }, [])

  const release = React.useCallback(() => {
    const el = contentRef.current
    const overlay = overlayRef.current
    if (el) {
      el.style.transition = ""
      el.style.transform = ""
    }
    if (overlay) {
      overlay.style.transition = ""
      overlay.style.opacity = ""
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (!draggable || settling || e.defaultPrevented) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    const el = contentRef.current
    if (!el) return
    const target = e.target as Element
    if (target.closest?.("[data-sheet-no-drag]")) return

    const g = gesture.current
    g.pointerId = e.pointerId
    g.armed = true
    g.active = false
    g.startX = e.clientX
    g.startY = e.clientY
    g.lastY = e.clientY
    g.lastTime = e.timeStamp
    g.velocity = 0
    g.fromTop = startsAtScrollTop(target, el)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const g = gesture.current
    if (!g.armed || g.pointerId !== e.pointerId) return

    const dy = e.clientY - g.startY
    const dx = e.clientX - g.startX

    if (!g.active) {
      if (Math.abs(dy) < SLOP && Math.abs(dx) < SLOP) return
      // A sideways swipe, an upward swipe, or a scroll that has somewhere to
      // go — none of those are this gesture.
      if (Math.abs(dx) > Math.abs(dy) || dy <= 0 || !g.fromTop) {
        g.armed = false
        return
      }
      g.active = true
      setDragging(true)
      contentRef.current?.setPointerCapture(e.pointerId)
    }

    const dt = e.timeStamp - g.lastTime
    if (dt > 0) g.velocity = (e.clientY - g.lastY) / dt
    g.lastY = e.clientY
    g.lastTime = e.timeStamp
    paint(dy)
  }

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (g.pointerId !== e.pointerId) return
    const wasActive = g.active
    g.armed = false
    g.active = false
    g.pointerId = -1
    if (!wasActive) return

    setDragging(false)
    const el = contentRef.current
    if (!el) return

    const travelled = Math.max(0, e.clientY - g.startY)
    const flicked = g.velocity > DISMISS_VELOCITY && travelled > 24
    const ease = "cubic-bezier(0.32, 0.72, 0, 1)"

    if (travelled > DISMISS_DISTANCE || flicked) {
      setSettling(true)
      const ms = reduceMotion ? 1 : SETTLE_OUT
      el.style.transition = `transform ${ms}ms ${ease}`
      el.style.transform = `translate3d(0, ${el.offsetHeight}px, 0)`
      if (overlayRef.current) {
        overlayRef.current.style.transition = `opacity ${ms}ms linear`
        overlayRef.current.style.opacity = "0"
      }
      // `settling` also switches the exit keyframe off, so Radix unmounts the
      // moment it is told to — from where the finger left it, with no jump
      // back to the top to replay a slide it has already performed.
      settleTimer.current = window.setTimeout(() => {
        closeRef.current?.click()
      }, ms)
    } else {
      const ms = reduceMotion ? 1 : SETTLE_BACK
      el.style.transition = `transform ${ms}ms cubic-bezier(0.22, 1.15, 0.36, 1)`
      el.style.transform = "translate3d(0, 0, 0)"
      if (overlayRef.current) {
        overlayRef.current.style.transition = `opacity ${ms}ms ease-out`
        overlayRef.current.style.opacity = "1"
      }
      settleTimer.current = window.setTimeout(release, ms + 20)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
    finishDrag(e)
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(e)
    finishDrag(e)
  }

  return (
    <SheetPortal>
      <SheetOverlay ref={overlayRef} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-dragging={dragging ? "" : undefined}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-xl will-change-transform",
          baseSide[side],
          motion[side],
          draggable && "touch-pan-y",
          className
        )}
        style={{
          // An inline `animation: none` is the only thing that reliably beats
          // an `animate-*` class, and both states need it: a keyframe running
          // against the finger stutters, and a keyframe on exit would replay
          // the slide the drag just finished.
          animation: dragging || settling ? "none" : undefined,
          ...style,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        {...props}
        ref={contentRef}
      >
        {children}
        {draggable && (
          <SheetPrimitive.Close
            ref={closeRef}
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
          />
        )}
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
