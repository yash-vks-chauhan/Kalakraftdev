'use client'

import { useEffect, useState } from 'react'
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

/**
 * Two shapes for two devices.
 *
 * On a phone the dock owns the bottom of the screen and the thumb is already
 * there, so a confirmation rises from below and parks just above it: one
 * black pill, no icon, no close button, gone in a couple of seconds. A corner
 * toast under the notch is the one place a thumb never looks.
 *
 * Above lg nothing floats at the bottom, so toasts stay top-right where the
 * rest of the app has always put them.
 */

/** Dock: 58px tall, sitting 14px above the safe area. Clear it by a hair. */
const ABOVE_DOCK = 'calc(84px + env(safe-area-inset-bottom, 0px))'

/**
 * sonner wraps its own rules in :where(), which has no specificity, so a plain
 * class beats them. The one exception is its under-600px block — not wrapped,
 * and it pins every toast to the full width — hence the ! on the width and
 * the auto margins that re-centre what is left.
 */
const PILL = [
  'flex items-center justify-center gap-2',
  '!w-fit !mx-auto !max-w-[calc(100vw-3rem)]',
  'rounded-full border-transparent bg-foreground text-background',
  'px-4 py-2.5 text-[13px] font-medium leading-none',
  'shadow-[0_14px_34px_-10px_rgba(0,0,0,0.5)]',
].join(' ')

function Toaster(props: ToasterProps) {
  // Matches the lg: breakpoint the dock hides at.
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    const sync = () => setCompact(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  if (compact) {
    return (
      <SonnerToaster
        position="bottom-center"
        offset={ABOVE_DOCK}
        // Zero on the sides on purpose: under 600px sonner pins the container
        // to left + width:100%, so any inset shifts the whole thing right
        // instead of insetting it. The pill keeps its own max-width.
        mobileOffset={{ bottom: ABOVE_DOCK, left: '0px', right: '0px' }}
        duration={2600}
        gap={8}
        visibleToasts={2}
        toastOptions={{
          classNames: {
            toast: PILL,
            title: 'font-medium',
            description: 'text-background/70',
            // Colour already carries the meaning at this size.
            icon: 'hidden',
            actionButton: 'h-7 rounded-full bg-background px-3 text-foreground',
          },
        }}
        {...props}
      />
    )
  }

  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
