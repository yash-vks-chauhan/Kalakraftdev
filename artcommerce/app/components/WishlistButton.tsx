// File: app/components/WishlistButton.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [showFlyingCard, setShowFlyingCard] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [animationCompleted, setAnimationCompleted] = useState(false)

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
      // Only show flying animation when adding to wishlist on mobile
      if (!inWishlist && window.innerWidth <= 768) {
        // Reset animation state
        setAnimationCompleted(false)
        // Show flying card animation
        setShowFlyingCard(true)
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
          setAnimationCompleted(true)
          setTimeout(() => {
            setShowFlyingCard(false)
          }, 300); // Short delay after completion animation
        }, 1000)
      }
      
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

  // Debug function to manually trigger the animation for testing
  const debugTriggerAnimation = () => {
    if (window.innerWidth <= 768) {
      setAnimationCompleted(false);
      setShowFlyingCard(true);
      setTimeout(() => {
        setAnimationCompleted(true);
        setTimeout(() => {
          setShowFlyingCard(false);
        }, 300);
      }, 1000);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
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

      {showFlyingCard && (
        <FlyingCardEffect buttonRef={buttonRef} animationCompleted={animationCompleted} />
      )}
      
      {/* Debug button - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={debugTriggerAnimation}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            zIndex: 9999,
            padding: '5px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '10px',
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
        >
          Test Animation
        </button>
      )}
    </>
  )
}

// Component to calculate position and animate the flying card
function FlyingCardEffect({ buttonRef, animationCompleted }: { 
  buttonRef: React.RefObject<HTMLButtonElement>,
  animationCompleted: boolean
}) {
  const [style, setStyle] = useState({
    top: '0px',
    left: '0px',
    '--end-x': '0px',
    '--end-y': '0px'
  } as React.CSSProperties)
  
  const [pulseStyle, setPulseStyle] = useState({
    top: '0px',
    left: '0px',
  } as React.CSSProperties)

  useEffect(() => {
    // Calculate the starting position (button location)
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      
      // Find the wishlist icon in the footer
      const wishlistFooterIcon = document.querySelector('[data-wishlist-footer-icon]') as HTMLElement
      
      if (wishlistFooterIcon) {
        const wishlistRect = wishlistFooterIcon.getBoundingClientRect()
        
        // Calculate the end position (wishlist icon in footer)
        const endX = wishlistRect.left - buttonRect.left + (wishlistRect.width / 2)
        const endY = wishlistRect.top - buttonRect.top + (wishlistRect.height / 2)
        
        setStyle({
          top: `${buttonRect.top + buttonRect.height/2}px`,
          left: `${buttonRect.left + buttonRect.width/2}px`,
          '--end-x': `${endX}px`,
          '--end-y': `${endY}px`
        } as React.CSSProperties)
        
        setPulseStyle({
          top: `${wishlistRect.top + wishlistRect.height/2}px`,
          left: `${wishlistRect.left + wishlistRect.width/2}px`,
        })
        
        console.log('Flying animation calculated:', {
          start: { x: buttonRect.left, y: buttonRect.top },
          end: { x: wishlistRect.left, y: wishlistRect.top },
          endX, endY
        });
      } else {
        console.warn('Wishlist footer icon not found, using fallback animation');
        // Fallback if wishlist icon not found - animate to bottom right
        setStyle({
          top: `${buttonRect.top + buttonRect.height/2}px`,
          left: `${buttonRect.left + buttonRect.width/2}px`,
          '--end-x': `${window.innerWidth - buttonRect.left - 50}px`,
          '--end-y': `${window.innerHeight - buttonRect.top - 50}px`
        } as React.CSSProperties)
        
        setPulseStyle({
          top: `${window.innerHeight - 50}px`,
          left: `${window.innerWidth - 50}px`,
        })
      }
    }
  }, [buttonRef])

  return (
    <>
      <div 
        className="flying-card-animation wishlist-flying-heart" 
        style={style}
        data-testid="flying-heart"
      >
        <svg viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      
      {animationCompleted && (
        <div 
          className="completion-animation" 
          style={pulseStyle}
          data-testid="completion-pulse"
        />
      )}
    </>
  )
}