// File: app/contexts/WishlistContext.tsx
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { useNotificationContext } from './NotificationContext'

export interface WishlistItem {
  id: number
  productId: number
  product: {
    id: number
    name: string
    price: number
    currency: string
    imageUrls: string[]
    category?: {
      id: number
      name: string
      slug: string
    }
  }
}

/** See CartContext — suppresses the success notification only. */
export interface MutationOptions {
  silent?: boolean
}

export interface WishlistContextValue {
  wishlistItems: WishlistItem[]
  addToWishlist: (productId: number, options?: MutationOptions) => Promise<WishlistItem>
  removeFromWishlist: (productId: number, options?: MutationOptions) => Promise<void>
  isInWishlist: (productId: number) => boolean
  loading: boolean
}

export const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const { addNotification } = useNotificationContext()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  // When token changes, fetch the wishlist (or clear it)
  useEffect(() => {
    if (!token) {
      setWishlistItems([])
      setLoading(false)
      return
    }
    async function fetchWishlist() {
      setLoading(true)
      try {
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          let errMsg = `Failed to fetch wishlist: ${res.status}`
          try {
            const errData = await res.json()
            errMsg = errData.error || errMsg
          } catch {
            // ignore JSON parse error
          }
          throw new Error(errMsg)
        }
        const data = await res.json()
        setWishlistItems(
          Array.isArray(data.wishlistItems) ? data.wishlistItems : []
        )
      } catch (err) {
        console.error('Error fetching wishlist:', err)
        setWishlistItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [token])

  // Add a product to wishlist
  async function addToWishlist(productId: number, options?: MutationOptions) {
    if (!token) throw new Error('Not authenticated')

    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    })

    if (!res.ok) {
      let errMsg = `Could not add to wishlist: ${res.status}`
      try {
        const errData = await res.json()
        errMsg = errData.error || errMsg
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errMsg)
    }

    const data = await res.json()
    setWishlistItems((prev) => [...prev, data.wishlistItem])

    // Removing already announced itself; adding did not, which left the
    // caller to invent its own confirmation. Both go through here now, so
    // there is one message per action wherever the wishlist is touched.
    if (!options?.silent) {
      addNotification({
        title: 'Added to Wishlist',
        body: 'Item saved to your wishlist',
        category: 'user',
        severity: 'success',
      })
    }

    return data.wishlistItem
  }

  // Remove from wishlist
  async function removeFromWishlist(productId: number, options?: MutationOptions) {
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      let errMsg = `Could not remove from wishlist: ${res.status}`
      try {
        const errData = await res.json()
        errMsg = errData.error || errMsg
      } catch {
        // if response wasn't JSON (e.g. HTML 404), ignore
      }
      addNotification({
        title: 'Error',
        body: 'Failed to remove from wishlist',
        category: 'user',
        severity: 'error'
      })
      throw new Error(errMsg)
    }

    // Successful delete; update state
    const removedItem = wishlistItems.find(wi => wi.productId === productId)
    setWishlistItems((prev) =>
      prev.filter((wi) => wi.productId !== productId)
    )

    if (options?.silent) return

    // Get product image from the removed item
    let productImageUrl = ''
    if (removedItem?.product?.imageUrls) {
      try {
        const imageUrls = Array.isArray(removedItem.product.imageUrls) 
          ? removedItem.product.imageUrls 
          : JSON.parse(removedItem.product.imageUrls || '[]')
        productImageUrl = imageUrls.find((url: string) => url && url.length > 0) || ''
      } catch {
        productImageUrl = ''
      }
    }
    
    addNotification({
      title: 'Removed from Wishlist',
      body: 'Item has been removed from your wishlist',
      category: 'user',
      severity: 'info',
      productData: removedItem?.product ? {
        id: removedItem.product.id,
        name: removedItem.product.name,
        price: removedItem.product.price,
        imageUrl: productImageUrl
      } : undefined
    })
  }

  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.productId === productId)
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        loading
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}