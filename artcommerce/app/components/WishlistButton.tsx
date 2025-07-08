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
  const [localWishlistState, setLocalWishlistState] = useState<boolean | null>(null)

  // Use the actual wishlist state from context, but override with local state during animation
  const inWishlist = localWishlistState !== null ? localWishlistState : isInWishlist(productId)

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent elements
    e.stopPropagation()
    
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Get current wishlist state
    const currentlyInWishlist = isInWishlist(productId)
    
    // Start animation and set loading state
    setIsAnimating(true)
    setLoading(true)
    
    // Don't change the heart fill state yet - keep it as is during animation
    setLocalWishlistState(currentlyInWishlist)
    
    try {
      // Add a longer delay to show the animation clearly
      await new Promise(resolve => setTimeout(resolve, 800))
      
      if (currentlyInWishlist) {
        await removeFromWishlist(productId)
        // Update local state to reflect removal
        setLocalWishlistState(false)
        
        // Wait a moment to show the unfilled heart
        await new Promise(resolve => setTimeout(resolve, 200))
        
        addNotification({
          title: 'Removed from Wishlist',
          body: 'Item has been removed from your wishlist',
          category: 'user',
          severity: 'info'
        })
      } else {
        await addToWishlist(productId)
        // Update local state to reflect addition
        setLocalWishlistState(true)
        
        // Wait a moment to show the filled heart
        await new Promise(resolve => setTimeout(resolve, 200))
        
        addNotification({
          title: 'Added to Wishlist',
          body: 'Item has been added to your wishlist',
          category: 'user',
          severity: 'success'
        })
      }
    } catch (error) {
      // Reset to original state if there's an error
      setLocalWishlistState(null)
      
      addNotification({
        title: 'Error',
        body: 'Failed to update wishlist',
        category: 'user',
        severity: 'error'
      })
    } finally {
      // Stop animation but keep local state for a moment
      setIsAnimating(false)
      
      // Reset loading and local state after a short delay
      setTimeout(() => {
        setLoading(false)
        setLocalWishlistState(null)
      }, 300)
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
            animation: isAnimating ? 'wishlistRotate 1.2s infinite linear' : 'none'
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