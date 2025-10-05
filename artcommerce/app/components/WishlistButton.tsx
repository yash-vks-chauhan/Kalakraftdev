// File: app/components/WishlistButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useNotificationContext } from '../contexts/NotificationContext'
import AuthModal from './AuthModal'
import WishlistModal from './WishlistModal'
import WishlistLoader from './WishlistLoader'

interface Product {
  id: number
  name: string
  price: number
  imageUrls: string[]
  category?: { name: string }
}

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
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [productData, setProductData] = useState<Product | null>(null)

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
        // Note: Notification is handled by WishlistContext
      } else {
        const wishlistItem = await addToWishlist(productId)
        
        // Extract product data from the wishlist response
        if (wishlistItem && wishlistItem.product) {
          // Normalize imageUrls
          let imageUrls = []
          try {
            imageUrls = Array.isArray(wishlistItem.product.imageUrls) 
              ? wishlistItem.product.imageUrls 
              : JSON.parse(wishlistItem.product.imageUrls || '[]')
          } catch {
            imageUrls = []
          }
          
          const productData = {
            id: wishlistItem.product.id,
            name: wishlistItem.product.name,
            price: wishlistItem.product.price,
            imageUrls: imageUrls.filter((url: string) => url && url.length > 0),
            category: wishlistItem.product.category
          }
          
          setProductData(productData)
          setShowWishlistModal(true)
        } else {
          // Fallback: fetch product data if not available from wishlist response
          try {
            const productRes = await fetch(`/api/products/${productId}`)
            if (productRes.ok) {
              const productData = await productRes.json()
              if (productData.product) {
                let imageUrls = []
                try {
                  imageUrls = Array.isArray(productData.product.imageUrls) 
                    ? productData.product.imageUrls 
                    : JSON.parse(productData.product.imageUrls || '[]')
                } catch {
                  imageUrls = []
                }
                
                setProductData({
                  id: productData.product.id,
                  name: productData.product.name,
                  price: productData.product.price,
                  imageUrls: imageUrls.filter((url: string) => url && url.length > 0),
                  category: productData.product.category
                })
                setShowWishlistModal(true)
              }
            }
          } catch (error) {
            console.error('Error fetching product data:', error)
          }
        }
        
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
            // Beautiful animated loader
            <WishlistLoader size="small" />
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

      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <WishlistModal
        isOpen={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
        product={productData}
      />

      {/* Inline Styles for Animations */}
      <style jsx>{`
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