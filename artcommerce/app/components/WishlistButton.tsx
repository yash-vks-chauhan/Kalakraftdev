// File: app/components/WishlistButton.tsx
'use client'

import { useState, useEffect } from 'react'
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 600))
      
      if (inWishlist) {
        await removeFromWishlist(productId)
        setSuccessMessage('Removed from wishlist')
        addNotification({
          title: 'Removed from Wishlist',
          body: 'Item has been removed from your wishlist',
          category: 'user',
          severity: 'info'
        })
      } else {
        await addToWishlist(productId)
        setSuccessMessage('Added to your wishlist!')
        addNotification({
          title: 'Added to Wishlist',
          body: 'Item has been added to your wishlist',
          category: 'user',
          severity: 'success'
        })
      }
      
      // Show success message
      setShowSuccessMessage(true)
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 2000)
      
    } catch (error) {
      setSuccessMessage('Failed to update wishlist')
      setShowSuccessMessage(true)
      addNotification({
        title: 'Error',
        body: 'Failed to update wishlist',
        category: 'user',
        severity: 'error'
      })
      
      // Hide error message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 2000)
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
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={handleToggleWishlist}
          className={className}
          data-active={inWishlist}
          data-animating={isAnimating}
          data-loading={loading}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          disabled={loading}
        >
          {loading ? (
            // Loading spinner
            <svg 
              viewBox="0 0 24 24" 
              width="22" 
              height="22" 
              fill="none"
              style={{
                animation: 'spin 1s linear infinite'
              }}
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray="31.416" 
                strokeDashoffset="31.416"
                style={{
                  animation: 'dash 2s ease-in-out infinite'
                }}
              />
            </svg>
          ) : (
            // Heart icon
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
          )}
        </button>

        {/* Success Message Tooltip */}
        {showSuccessMessage && (
          <div 
            style={{
              position: 'absolute',
              top: '-45px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              animation: 'fadeInScale 0.3s ease-out',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            {successMessage}
            {/* Tooltip arrow */}
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(0, 0, 0, 0.9)'
              }}
            />
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35px;
          }
          100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124px;
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        
        @keyframes wishlistRotate {
          0% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </>
  )
}