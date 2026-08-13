"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Subscribes to a CSS media query.
 *
 * Used where mobile and desktop need genuinely different component trees rather
 * than the same tree restyled — rendering both and hiding one with `lg:hidden`
 * would mount two copies of every chart, and the hidden one measures zero.
 *
 * `useSyncExternalStore` is deliberate: React uses `getServerSnapshot` for the
 * server render *and* for hydration, then re-renders with the real value, so
 * this never produces a hydration mismatch. `serverFallback` decides which tree
 * paints first — pass the value that suits the smaller screen, since a phone
 * swapping layouts on hydration is far more noticeable than a desktop doing it.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => serverFallback, [serverFallback])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Matches Tailwind's `lg` breakpoint, which is where the dashboard shell switches. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
