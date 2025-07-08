// File: app/components/WishlistButton.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useNotificationContext } from '../contexts/NotificationContext'
import AuthModal from './AuthModal'

interface Props {
  productId: number;
  className?: string;
  preventNavigation?: boolean;
  productImageUrl?: string;
}

export default function WishlistButton({ productId, className = '', preventNavigation = false, productImageUrl }: Props) {
  const { user } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotificationContext()
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFlyingImage, setShowFlyingImage] = useState(false)
  const [flyingImageStyle, setFlyingImageStyle] = useState({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const flyingImageRef = useRef<HTMLDivElement>(null)
  const [flyToCoords, setFlyToCoords] = useState({ x: 0, y: 0 })

  const inWishlist = isInWishlist(productId)

  // Create a flying image element in the document body when needed
  useEffect(() => {
    if (showFlyingImage && flyingImageRef.current) {
      document.body.appendChild(flyingImageRef.current)
      return () => {
        if (flyingImageRef.current && flyingImageRef.current.parentNode) {
          flyingImageRef.current.parentNode.removeChild(flyingImageRef.current)
        }
      }
    }
  }, [showFlyingImage])

  // Function to calculate the distance to the wishlist icon in the bottom nav
  const calculateDistanceToWishlist = () => {
    if (!buttonRef.current) return { x: 0, y: 0 }

    // Get the button's position
    const buttonRect = buttonRef.current.getBoundingClientRect()
    
    // Try multiple selectors to find the wishlist icon in the footer
    const wishlistIcon = 
      document.querySelector('.footerNavItem [href*="wishlist"] svg') || // SVG inside wishlist link
      document.querySelector('.footerNavItem [href*="wishlist"]') ||     // Wishlist link
      document.querySelector('nav [href*="wishlist"]') ||                // Any wishlist link in nav
      document.querySelector('a[href*="wishlist"]');                     // Any wishlist link
    
    if (!wishlistIcon) {
      // If we can't find the wishlist icon, use a default position (bottom right)
      return { 
        x: window.innerWidth - buttonRect.left - buttonRect.width/2, 
        y: window.innerHeight - buttonRect.top - buttonRect.height/2 - 10
      }
    }
    
    const wishlistRect = wishlistIcon.getBoundingClientRect()
    
    // Calculate the distance from button center to wishlist icon center
    const distanceX = wishlistRect.left + wishlistRect.width/2 - (buttonRect.left + buttonRect.width/2)
    const distanceY = wishlistRect.top + wishlistRect.height/2 - (buttonRect.top + buttonRect.height/2)
    
    return { x: distanceX, y: distanceY }
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent elements
    e.stopPropagation()
    e.preventDefault()
    
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Start animation and set loading state
    setIsAnimating(true)
    setLoading(true)
    
    // Only animate when adding to wishlist
    if (!inWishlist) {
      // Calculate the distance to the wishlist icon
      const { x, y } = calculateDistanceToWishlist()
      setFlyToCoords({ x, y })
      
      // Get the parent product card element
      const productCard = buttonRef.current?.closest('.card, [class*="productCard"], [class*="card"]')
      
      // Apply shrink animation to the product card
      if (productCard) {
        productCard.classList.add('animate-shrinkProduct')
        setTimeout(() => {
          productCard.classList.remove('animate-shrinkProduct')
        }, 600)
      }
      
      // If we have a product image, show the flying image animation
      if (productImageUrl) {
        // Create a new div for the flying image
        const flyingImage = document.createElement('div')
        flyingImage.className = 'flying-image'
        flyingImage.style.position = 'fixed'
        flyingImage.style.width = '60px'
        flyingImage.style.height = '60px'
        flyingImage.style.borderRadius = '50%'
        flyingImage.style.backgroundImage = `url(${productImageUrl})`
        flyingImage.style.backgroundSize = 'cover'
        flyingImage.style.backgroundPosition = 'center'
        flyingImage.style.zIndex = '9999'
        flyingImage.style.pointerEvents = 'none'
        flyingImage.style.border = '2px solid white'
        
        // Position at the button's location
        const buttonRect = buttonRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
        flyingImage.style.left = `${buttonRect.left}px`
        flyingImage.style.top = `${buttonRect.top}px`
        
        // Set CSS variables for the animation
        document.documentElement.style.setProperty('--fly-x', `${x}px`)
        document.documentElement.style.setProperty('--fly-y', `${y}px`)
        
        // Add the animation class
        flyingImage.style.animation = 'flyToWishlist 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        
        // Add to the DOM
        document.body.appendChild(flyingImage)
        
        // Remove after animation completes
        setTimeout(() => {
          if (flyingImage.parentNode) {
            flyingImage.parentNode.removeChild(flyingImage)
          }
        }, 1500)
        
        // Animate the wishlist icon in the navigation
        // Try multiple selectors to find the wishlist icon
        const wishlistIcon = 
          document.querySelector('.footerNavItem [href*="wishlist"]') || 
          document.querySelector('nav [href*="wishlist"]') || 
          document.querySelector('a[href*="wishlist"]');
          
        if (wishlistIcon) {
          // Find the heart icon inside the wishlist link
          const heartIcon = wishlistIcon.querySelector('svg') || wishlistIcon;
          
          // Add the pulse animation after a delay to match when the flying image arrives
          setTimeout(() => {
            heartIcon.classList.add('animate-wishlistBadgePulse');
            wishlistIcon.classList.add('highlight-wishlist-icon');
            
            // Remove the animation classes after it completes
            setTimeout(() => {
              heartIcon.classList.remove('animate-wishlistBadgePulse');
              wishlistIcon.classList.remove('highlight-wishlist-icon');
            }, 800);
          }, 1200);
        }
      }
    }
    
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
    </>
  )
}