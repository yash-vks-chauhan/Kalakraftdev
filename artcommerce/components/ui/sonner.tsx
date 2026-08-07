'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
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
 * .k-toast from design/mobile-home-v2.html, to the pixel: a bar inset 16px on
 * each side, one radius, a check, the message, and the way out pushed to the
 * far end. sonner wraps its own rules in :where(), which has no specificity,
 * so plain classes are enough to replace them.
 */
const BAR = [
  'flex w-full items-center gap-2.5',
  'rounded-[var(--radius)] border-transparent bg-foreground text-background',
  'px-[13px] py-[11px] text-[13px]',
  'shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]',
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
        mobileOffset={{ bottom: ABOVE_DOCK, left: '16px', right: '16px' }}
        duration={2600}
        gap={8}
        visibleToasts={2}
        // The bar is one colour whatever happened, so the mark has to carry
        // the difference. Anything that worked gets the design's check.
        icons={{ success: <Check className="h-4 w-4" strokeWidth={2.4} /> }}
        toastOptions={{
          classNames: {
            toast: BAR,
            // A long product name ellipsizes rather than pushing View off.
            title: 'min-w-0 flex-1 truncate font-normal',
            description: 'text-background/70',
            icon: 'shrink-0',
            actionButton:
              'ml-auto shrink-0 bg-transparent p-0 text-[12px] font-normal text-background underline underline-offset-[3px]',
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
