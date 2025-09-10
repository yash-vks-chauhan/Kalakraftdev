'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true)
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
    setIsAnimating(false)
    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset'
    }
    // Wait for animation to complete before hiding
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  // Handle modal open/close with animations
  useEffect(() => {
    if (isOpen && product && typeof document !== 'undefined') {
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
      const timer = setTimeout(() => {
        handleClose()
      }, 6500)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('keydown', handleEscape)
        // Restore body scroll when modal closes
        document.body.style.overflow = 'unset'
      }
    } else if (!isOpen) {
      setIsAnimating(false)
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, product, handleClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!mounted || !isOpen || !product) return null

  const modalContent = (
    <>
      {/* Modal Backdrop */}
      <div 
        className={`wishlist-modal-backdrop ${isAnimating ? 'visible' : ''}`}
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div className={`wishlist-modal-content ${isAnimating ? 'visible' : ''}`}>
          {/* Close Button */}
          <button 
            className="wishlist-modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Success Icon */}
          <div className="wishlist-modal-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="wishlist-modal-title">Added to Wishlist!</h2>

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
            View Your Wishlist
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
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999 !important;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 1rem;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          transform: none !important;
          clip: unset !important;
          overflow: visible !important;
        }

        .wishlist-modal-backdrop.visible {
          opacity: 1;
        }

        .wishlist-modal-content {
          background: #ffffff;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          max-width: 480px;
          width: 100%;
          position: relative;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          transform: translateY(40px) scale(0.85);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-align: center;
          border: none;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
        }

        .wishlist-modal-content.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .wishlist-modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          color: #666;
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
          background: rgba(0, 0, 0, 0.1);
          color: #333;
          transform: scale(1.1);
        }

        .wishlist-modal-icon {
          color: #ff3b30;
          margin-bottom: 1.5rem;
          animation: heartBeat 0.8s ease-out;
        }

        .wishlist-modal-title {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 2rem 0;
          letter-spacing: -0.01em;
        }

        .wishlist-modal-product {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          background: #f8f9fa;
          border-radius: 16px;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .wishlist-modal-image {
          flex-shrink: 0;
          width: 90px;
          height: 90px;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
          font-size: 1.05rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          letter-spacing: -0.005em;
        }

        .wishlist-modal-category {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-size: 0.8rem;
          color: #8e8e93;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.75rem 0;
          font-weight: 500;
        }

        .wishlist-modal-price {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .wishlist-modal-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #007aff;
          color: #ffffff;
          text-decoration: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          letter-spacing: -0.005em;
          min-width: 200px;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .wishlist-modal-action:hover {
          background: #0056d6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
        }

        .wishlist-modal-action:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }

        @keyframes heartBeat {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
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
            padding: 0;
            align-items: flex-end;
          }

          .wishlist-modal-content {
            max-width: none;
            width: 100%;
            margin: 0;
            border-radius: 20px 20px 0 0;
            padding: 2rem 1.5rem;
            transform: translateY(100%);
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
          }

          .wishlist-modal-content.visible {
            transform: translateY(0);
          }

          .wishlist-modal-title {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .wishlist-modal-product {
            gap: 1rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .wishlist-modal-image {
            width: 75px;
            height: 75px;
          }

          .wishlist-modal-product-name {
            font-size: 1rem;
          }

          .wishlist-modal-price {
            font-size: 1.1rem;
          }

          .wishlist-modal-action {
            width: 100%;
            padding: 1.2rem;
            font-size: 1.05rem;
            min-width: none;
          }

          .wishlist-modal-close {
            top: 1rem;
            right: 1rem;
            width: 32px;
            height: 32px;
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .wishlist-modal-content {
            padding: 1.5rem;
          }

          .wishlist-modal-title {
            font-size: 1.4rem;
          }

          .wishlist-modal-product {
            gap: 0.875rem;
            padding: 0.875rem;
          }

          .wishlist-modal-image {
            width: 70px;
            height: 70px;
          }

          .wishlist-modal-product-name {
            font-size: 0.95rem;
          }

          .wishlist-modal-price {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </>
  )

  return createPortal(modalContent, document.body)
}
