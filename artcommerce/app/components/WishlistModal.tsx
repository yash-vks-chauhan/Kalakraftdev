'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  price: number
  imageUrls: string[]
  category?: { name: string }
}

interface WishlistModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export default function WishlistModal({ isOpen, onClose, product }: WishlistModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const closingRef = useRef(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

 
  useEffect(() => {
    setMounted(true)
    

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }, [])

  // Format price to INR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleClose = useCallback(() => {
    if (closingRef.current) return // Prevent multiple close calls
    
    closingRef.current = true
    setIsClosing(true)
    setIsAnimating(false)
    
    // Clear any existing auto-close timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset'
    }
    
    // Wait for slower animation to complete before hiding
    setTimeout(() => {
      setIsClosing(false)
      closingRef.current = false
      onClose()
    }, 600) // Increased to match slower CSS transition
  }, [onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (closingRef.current) return
    
    const touch = e.touches[0]
    startYRef.current = touch.clientY
    currentYRef.current = touch.clientY
    setIsDragging(true)
    setTranslateY(0)
    
    // Prevent body scroll while dragging
    e.preventDefault()
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || closingRef.current) return
    
    const touch = e.touches[0]
    currentYRef.current = touch.clientY
    const deltaY = currentYRef.current - startYRef.current
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setTranslateY(deltaY)
      
      // Add resistance effect for far swipes
      const resistance = Math.min(deltaY / 200, 1)
      const dampedDelta = deltaY * (1 - resistance * 0.5)
      setTranslateY(dampedDelta)
    }
    
    e.preventDefault()
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || closingRef.current) return
    
    const deltaY = currentYRef.current - startYRef.current
    const velocity = Math.abs(deltaY) / 150 // Simple velocity calculation
    
    setIsDragging(false)
    
    // If swiped down enough or with enough velocity, close the modal
    if (deltaY > 100 || velocity > 0.8) {
      handleClose()
    } else {
      // Snap back to original position
      setTranslateY(0)
    }
    
    e.preventDefault()
  }, [isDragging, handleClose])

  // Handle modal open/close with animations
  useEffect(() => {
    if (isOpen && product && typeof document !== 'undefined') {
      setIsClosing(false)
      closingRef.current = false
      setTranslateY(0)
      setIsDragging(false)
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 50)
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      
      // Auto-close after 6.5 seconds
      timerRef.current = setTimeout(() => {
        handleClose()
      }, 6500)
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        document.removeEventListener('keydown', handleEscape)
        // Restore body scroll when modal closes
        if (typeof document !== 'undefined') {
          document.body.style.overflow = 'unset'
        }
      }
    } else if (!isOpen) {
      setIsAnimating(false)
      setIsClosing(false)
      closingRef.current = false
      setTranslateY(0)
      setIsDragging(false)
      
      // Clear timer when modal is closed
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, product, handleClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !closingRef.current) {
      handleClose()
    }
  }

  if (!mounted || (!isOpen && !isClosing) || !product) return null

  const modalContent = (
    <>
      {/* Modal Backdrop */}
      <div 
        className={`wishlist-modal-backdrop ${isAnimating && !isClosing ? 'visible' : ''}`}
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className={`wishlist-modal-content ${isAnimating && !isClosing ? 'visible' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {/* Drag Handle Indicator */}
          <div className="drag-handle">
            <div className="drag-handle-bar"></div>
          </div>
          
          {/* Close Button */}
          <button 
            className="wishlist-modal-close"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleClose()
            }}
            aria-label="Close modal"
            disabled={isClosing || closingRef.current}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Success Icon */}
          <div className="wishlist-modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="wishlist-modal-title">Item Added to Wishlist</h2>

          {/* Product Info */}
          <div className="wishlist-modal-product">
            <div className="wishlist-modal-image">
              <img
                src={product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'https://placehold.co/120x120/f0f0f0/888?text=No+Image'}
                alt={product.name}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/120x120/f0f0f0/888?text=No+Image')}
              />
            </div>
            <div className="wishlist-modal-details">
              <h3 className="wishlist-modal-product-name">{product.name}</h3>
              {product.category && (
                <p className="wishlist-modal-category">{product.category.name}</p>
              )}
              <p className="wishlist-modal-price">{formatPrice(product.price)}</p>
            </div>
          </div>

          {/* Action Button */}
          <Link 
            href="/dashboard/wishlist" 
            className="wishlist-modal-action"
            onClick={handleClose}
          >
            View Wishlist
          </Link>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .wishlist-modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999 !important;
          opacity: 0;
          visibility: hidden;
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 1rem;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          transform: none !important;
          clip: unset !important;
          overflow: visible !important;
          pointer-events: none;
        }

        .wishlist-modal-backdrop.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .drag-handle {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 0;
          cursor: grab;
          z-index: 10;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .drag-handle-bar {
          width: 40px;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        .drag-handle:hover .drag-handle-bar {
          background: rgba(0, 0, 0, 0.5);
          width: 50px;
        }

        .wishlist-modal-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px) saturate(180%);
          -webkit-backdrop-filter: blur(8px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 20px;
          padding: 3rem 2rem 2.5rem;
          max-width: 480px;
          width: 100%;
          position: relative;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.08),
            inset 0 0 60px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          transform: translateY(60px) scale(0.9);
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
          touch-action: pan-y;
        }

        .wishlist-modal-content.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
        }        .wishlist-modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(80px) saturate(180%);
          -webkit-backdrop-filter: blur(80px) saturate(180%);
          border: none;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }

        .wishlist-modal-close:hover {
          background: rgba(255, 255, 255, 0.9);
          color: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .wishlist-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .wishlist-modal-close:disabled:hover {
          background: rgba(255, 255, 255, 0.75);
          color: rgba(0, 0, 0, 0.7);
          transform: none;
        }

        .wishlist-modal-icon {
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 1rem;
          animation: fadeIn 0.6s ease-out;
        }

        .wishlist-modal-title {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.9);
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .wishlist-modal-product {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          margin-bottom: 1.5rem;
          text-align: left;
          border: 1px solid rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05);
        }

        .wishlist-modal-image {
          flex-shrink: 0;
          width: 70px;
          height: 70px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .wishlist-modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .wishlist-modal-details {
          flex: 1;
          min-width: 0;
        }

        .wishlist-modal-product-name {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.9);
          margin: 0 0 0.25rem 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .wishlist-modal-category {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.5);
          margin: 0 0 0.5rem 0;
          font-weight: 400;
          text-transform: capitalize;
          letter-spacing: 0.01em;
        }

        .wishlist-modal-price {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.9);
          margin: 0;
        }

        .wishlist-modal-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.9);
          color: #ffffff;
          text-decoration: none;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          letter-spacing: 0.005em;
          min-width: 160px;
        }

        .wishlist-modal-action:hover {
          background: rgba(0, 0, 0, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .wishlist-modal-action:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        @keyframes fadeIn {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .wishlist-modal-backdrop {
            padding: 0;
            align-items: flex-end;
          }

          .wishlist-modal-content {
            max-width: none;
            width: 100%;
            margin: 0;
            border-radius: 16px 16px 0 0;
            padding: 3rem 1.5rem 1.5rem;
            transform: translateY(100%);
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .wishlist-modal-content.visible {
            transform: translateY(0);
          }

          .wishlist-modal-title {
            font-size: 1.25rem;
            margin-bottom: 1.25rem;
          }

          .wishlist-modal-product {
            gap: 0.875rem;
            padding: 0.875rem;
            margin-bottom: 1.25rem;
          }

          .wishlist-modal-image {
            width: 60px;
            height: 60px;
          }

          .wishlist-modal-product-name {
            font-size: 0.9rem;
          }

          .wishlist-modal-price {
            font-size: 0.95rem;
          }

          .wishlist-modal-action {
            width: 100%;
            padding: 1rem;
            font-size: 0.95rem;
            min-width: none;
          }

          .wishlist-modal-close {
            top: 0.875rem;
            right: 0.875rem;
            width: 30px;
            height: 30px;
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .wishlist-modal-content {
            padding: 1.25rem;
          }

          .wishlist-modal-title {
            font-size: 1.125rem;
          }

          .wishlist-modal-product {
            gap: 0.75rem;
            padding: 0.75rem;
          }

          .wishlist-modal-image {
            width: 56px;
            height: 56px;
          }

          .wishlist-modal-product-name {
            font-size: 0.85rem;
          }

          .wishlist-modal-price {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  )

  return createPortal(modalContent, document.body || document.documentElement)
}
