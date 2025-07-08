// File: app/components/WishlistButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useNotificationContext } from '../contexts/NotificationContext'
import AuthModal from './AuthModal'

interface Props {
  productId: number;
  className?: string;
  preventNavigation?: boolean;
}

export default function WishlistButton({ productId, className = '', preventNavigation = false }: Props) {
  const { user } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotificationContext()
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const inWishlist = isInWishlist(productId)

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent elements
    e.stopPropagation()
    
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Start animation and set loading state
    setIsAnimating(true)
    setLoading(true)
    
    try {
      // Add a small delay to show the animation
      await new Promise(resolve => setTimeout(resolve, 400))
      
      if (inWishlist) {
        await removeFromWishlist(productId)
        addNotification({
          title: 'Removed from Wishlist',
          body: 'Item has been removed from your wishlist',
          category: 'user',
          severity: 'info'
        })
      } else {
        await addToWishlist(productId)
        addNotification({
          title: 'Added to Wishlist',
          body: 'Item has been added to your wishlist',
          category: 'user',
          severity: 'success'
        })
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        body: 'Failed to update wishlist',
        category: 'user',
        severity: 'error'
      })
    } finally {
      // Stop animation and loading state
      setTimeout(() => {
        setIsAnimating(false)
        setLoading(false)
      }, 100)
    }
  }

  return (
    <>
      <button
        onClick={handleToggleWishlist}
        className={className}
        data-active={inWishlist}
        data-animating={isAnimating}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        disabled={loading}
      >
        <svg 
          viewBox="0 0 24 24" 
          width="22" 
          height="22" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill={inWishlist ? "currentColor" : "none"}
          className={isAnimating ? "animate-wishlist" : ""}
          style={{
            animation: isAnimating ? 'wishlistRotate 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
          }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}