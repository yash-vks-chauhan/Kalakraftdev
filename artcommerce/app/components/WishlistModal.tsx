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
  const closingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

 
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
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsClosing(false)
      closingRef.current = false
      onClose()
    }, 300)
  }, [onClose])

  // Handle modal open/close with animations
  useEffect(() => {
    if (isOpen && product && typeof document !== 'undefined') {
      setIsClosing(false)
      closingRef.current = false
      
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
        <div className={`wishlist-modal-content ${isAnimating && !isClosing ? 'visible' : ''}`}>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Header with title and icon */}
          <div className="wishlist-modal-header">
            <div className="wishlist-modal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="wishlist-modal-title">Added to Wishlist</h2>
          </div>

          {/* Product Info */}
          <div className="wishlist-modal-product">
            <div className="wishlist-modal-image">
              <img
                src={product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'https://placehold.co/48x48/f0f0f0/888?text=No+Image'}
                alt={product.name}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48/f0f0f0/888?text=No+Image')}
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

          {/* Divider */}
          <div className="wishlist-modal-divider" />

          {/* Action Button */}
          <Link 
            href="/dashboard/wishlist" 
            className="wishlist-modal-action"
            onClick={handleClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
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
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999 !important;
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

        .wishlist-modal-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px) saturate(180%);
          -webkit-backdrop-filter: blur(8px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 1rem;
          padding: 0.75rem;
          max-width: 320px;
          width: 100%;
          position: relative;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.08),
            inset 0 0 60px rgba(255, 255, 255, 0.2);
          transform: translateY(10px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
          will-change: transform, opacity, visibility, backdrop-filter;
          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        .wishlist-modal-content.visible {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .wishlist-modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(80px) saturate(180%);
          -webkit-backdrop-filter: blur(80px) saturate(180%);
          border: none;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .wishlist-modal-close:hover {
          background: rgba(255, 255, 255, 0.9);
          color: rgba(0, 0, 0, 0.9);
        }

        .wishlist-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wishlist-modal-close:disabled:hover {
          background: rgba(255, 255, 255, 0.75);
          color: rgba(0, 0, 0, 0.7);
        }

        .wishlist-modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
          margin-bottom: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .wishlist-modal-icon {
          color: #ff3b30;
          flex-shrink: 0;
          animation: heartBeat 0.8s ease-out;
        }

        .wishlist-modal-title {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 0.9375rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.8);
          margin: 0;
          letter-spacing: -0.005em;
        }

        .wishlist-modal-content-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          text-decoration: none;
          color: rgba(0, 0, 0, 0.7);
        }

        .wishlist-modal-content-item:hover {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(80px) saturate(180%);
          -webkit-backdrop-filter: blur(80px) saturate(180%);
          color: rgba(0, 0, 0, 0.9);
        }

        .wishlist-modal-product {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          text-align: left;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }

        .wishlist-modal-product:hover {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(80px) saturate(180%);
          -webkit-backdrop-filter: blur(80px) saturate(180%);
        }

        .wishlist-modal-image {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
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
          font-size: 0.9375rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.8);
          margin: 0 0 0.25rem 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .wishlist-modal-category {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.6);
          margin: 0 0 0.25rem 0;
          font-weight: 400;
        }

        .wishlist-modal-price {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.8);
          margin: 0;
        }

        .wishlist-modal-divider {
          height: 1px;
          background-color: rgba(0, 0, 0, 0.1);
          margin: 8px 0;
        }

        .wishlist-modal-action {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: rgba(0, 0, 0, 0.7);
          text-decoration: none;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-weight: 400;
        }

        .wishlist-modal-action:hover {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(80px) saturate(180%);
          -webkit-backdrop-filter: blur(80px) saturate(180%);
          color: rgba(0, 0, 0, 0.9);
        }

        @keyframes heartBeat {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .wishlist-modal-backdrop {
            align-items: flex-start;
            padding-top: 20vh;
          }

          .wishlist-modal-content {
            max-width: 280px;
            margin: 0 auto;
          }

          .wishlist-modal-header {
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.25rem;
          }

          .wishlist-modal-title {
            font-size: 0.875rem;
          }

          .wishlist-modal-product,
          .wishlist-modal-action {
            padding: 0.5rem 0.75rem;
          }

          .wishlist-modal-image {
            width: 40px;
            height: 40px;
          }

          .wishlist-modal-product-name {
            font-size: 0.875rem;
          }

          .wishlist-modal-price {
            font-size: 0.8125rem;
          }

          .wishlist-modal-action {
            font-size: 0.875rem;
          }

          .wishlist-modal-close {
            top: 0.5rem;
            right: 0.5rem;
            width: 24px;
            height: 24px;
            padding: 0.25rem;
          }

          .wishlist-modal-close svg {
            width: 14px;
            height: 14px;
          }
        }

        @media (max-width: 480px) {
          .wishlist-modal-content {
            max-width: 260px;
          }

          .wishlist-modal-header {
            padding: 0.5rem;
          }

          .wishlist-modal-product,
          .wishlist-modal-action {
            padding: 0.5rem;
          }

          .wishlist-modal-image {
            width: 36px;
            height: 36px;
          }

          .wishlist-modal-product-name {
            font-size: 0.8125rem;
          }

          .wishlist-modal-category {
            font-size: 0.6875rem;
          }

          .wishlist-modal-price {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </>
  )

  return createPortal(modalContent, document.body || document.documentElement)
}
