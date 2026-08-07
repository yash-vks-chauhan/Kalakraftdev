"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { useNotificationContext } from "../../contexts/NotificationContext"

/**
 * One confirmation, in one place.
 *
 * Adding something to the cart used to produce two overlays at once: a glass
 * card under the header from NotificationContext, and a corner toast from
 * sonner. Both sat at the top of the screen, nowhere near the thumb that had
 * just tapped. Below lg the glass cards are replaced by this — every user
 * notification becomes a single black pill above the dock, and nothing else
 * fires.
 *
 * This renders nothing; it only forwards. Mounting it instead of
 * <UserNotifications /> is what turns the cards off, so there is exactly one
 * of the two on screen at any time.
 */

/** The card titles are written to sit above a body line. The pill is terser. */
const PHRASE: Record<string, string> = {
  "Added to Cart": "Added to cart",
  "Removed from Cart": "Removed from cart",
  "Added to Wishlist": "Saved for later",
  "Removed from Wishlist": "Removed from saved",
  "Quantity Adjusted": "Quantity updated",
}

export function MobileToasts() {
  const { notifications } = useNotificationContext()
  // Notifications live in the context for five seconds; without this every
  // re-render inside that window would fire the same toast again.
  const shown = useRef(new Set<string>())

  useEffect(() => {
    for (const note of notifications) {
      if (note.category !== "user" || shown.current.has(note.id)) continue
      shown.current.add(note.id)

      const message = PHRASE[note.title] ?? note.title
      if (note.severity === "error") toast.error(message)
      else if (note.severity === "warning") toast.warning(message)
      else toast(message)
    }

    // Forget ids once the context has dropped them, so the set stays small.
    const live = new Set(notifications.map((n) => n.id))
    for (const id of Array.from(shown.current)) {
      if (!live.has(id)) shown.current.delete(id)
    }
  }, [notifications])

  return null
}
