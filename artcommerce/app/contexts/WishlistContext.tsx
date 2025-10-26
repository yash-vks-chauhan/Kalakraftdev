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

export interface WishlistContextValue {
  wishlistItems: WishlistItem[]
  addToWishlist: (productId: number) => Promise<WishlistItem>
  removeFromWishlist: (productId: number) => Promise<void>
  isInWishlist: (productId: number) => boolean
  loading: boolean
}

export const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { addNotification } = useNotificationContext()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  // When token changes, fetch the wishlist (or clear it)
  useEffect(() => {
    if (!user) {
      setWishlistItems([])
      setLoading(false)
      return
    }
    async function fetchWishlist() {
      setLoading(true)
      try {
        const res = await fetch('/api/wishlist', { credentials: 'include' })
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
  }, [user])

  // Add a product to wishlist
  async function addToWishlist(productId: number) {
    if (!user) throw new Error('Not authenticated')

    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
    return data.wishlistItem
  }

  // Remove from wishlist
  async function removeFromWishlist(productId: number) {
    if (!user) throw new Error('Not authenticated')

    const res = await fetch(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
