"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "../../contexts/AuthContext"
import { useNotificationContext } from "../../contexts/NotificationContext"

/**
 * One confirmation, in one place.
 *
 * Adding something to the cart used to produce two overlays at once: a glass
 * card under the header from NotificationContext, and a corner toast from
 * sonner. Both sat at the top of the screen, nowhere near the thumb that had
 * just tapped. Below lg the glass cards are replaced by this — every user
 * notification becomes the bar above the dock, and nothing else fires.
 *
 * This renders nothing; it only forwards. Mounting it instead of
 * <UserNotifications /> is what turns the cards off, so there is exactly one
 * of the two on screen at any time.
 */

/** The card titles are written to sit above a body line. The bar is terser. */
const PHRASE: Record<string, string> = {
  "Added to Cart": "Added to cart",
  "Removed from Cart": "Removed from cart",
  "Added to Wishlist": "Saved for later",
  "Removed from Wishlist": "Removed from saved",
  "Quantity Adjusted": "Quantity updated",
}

/** Where "View" goes. Anything not listed here gets no way out — an error
 *  has nowhere useful to send you. */
const DESTINATION: Record<string, "cart" | "saved"> = {
  "Added to Cart": "cart",
  "Removed from Cart": "cart",
  "Quantity Adjusted": "cart",
  "Added to Wishlist": "saved",
  "Removed from Wishlist": "saved",
}

export function MobileToasts() {
  const { notifications } = useNotificationContext()
  const { user } = useAuth()
  const router = useRouter()

  // Notifications live in the context for five seconds; without this every
  // re-render inside that window would fire the same toast again.
  const shown = useRef(new Set<string>())

  useEffect(() => {
    for (const note of notifications) {
      if (note.category !== "user" || shown.current.has(note.id)) continue
      shown.current.add(note.id)

      // The design names the piece — "Ocean Pour Tray added" — which reads as
      // a receipt rather than a status line. Only adds carry a name.
      const message =
        note.title === "Added to Cart" && note.productData?.name
          ? `${note.productData.name} added`
          : PHRASE[note.title] ?? note.title

      const target = DESTINATION[note.title]
      const options = target
        ? {
            action: {
              label: "View",
              onClick: () =>
                router.push(
                  target === "saved"
                    ? "/dashboard/wishlist"
                    : user
                      ? "/dashboard/cart"
                      : "/cart"
                ),
            },
          }
        : undefined

      if (note.severity === "error") toast.error(message, options)
      else if (note.severity === "warning") toast.warning(message, options)
      else toast.success(message, options)
    }

    // Forget ids once the context has dropped them, so the set stays small.
    const live = new Set(notifications.map((n) => n.id))
    for (const id of Array.from(shown.current)) {
      if (!live.has(id)) shown.current.delete(id)
    }
  }, [notifications, router, user])

  return null
}
