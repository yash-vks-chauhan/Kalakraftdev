'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import WishlistButton from './WishlistButton'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import styles from '../products/products.module.css'
import animationStyles from '../products/products-animations.module.css'

const LOW_STOCK_THRESHOLD = 5

interface Product {
  id: number
  name: string
  slug: string
  shortDesc: string
  description?: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
  usageTags?: string[]
  avgRating?: number
  ratingCount?: number
}

interface ProductCardProps {
  product: Product
  index?: number
  className?: string
  animationDelay?: number
}

export default function ProductCard({ 
  product: prod, 
  index = 0, 
  className = '',
  animationDelay 
}: ProductCardProps) {
  const { isMobile: isMobileView } = useDeviceDetection()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [direction, setDirection] = useState(0) // -1 for prev, 1 for next
  
  const cardStyle = animationDelay !== undefined ? {
    animationDelay: `${animationDelay}ms`
  } : index !== undefined ? {
    animationDelay: `${index * 0.1}s`
  } : {}

  const hasMultipleImages = prod.imageUrls.length > 1

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDirection(-1)
    setCurrentImageIndex((prev) => (prev === 0 ? prod.imageUrls.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDirection(1)
    setCurrentImageIndex((prev) => (prev === prod.imageUrls.length - 1 ? 0 : prev + 1))
  }

  // Image animation variants - using position absolute wrapper
  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.96
    })
  }

  // Arrow button animation
  const arrowVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.08 },
    tap: { scale: 0.92 }
  }

  // Dot indicator animation
  const dotVariants = {
    inactive: { 
      scale: 1,
      width: 7,
      opacity: 0.4
    },
    active: { 
      scale: 1,
      width: 20,
      opacity: 1
    }
  }

  return (
    <Link 
      href={`/products/${prod.id}`} 
      key={prod.id}
      className={`${styles.productCard} ${className}`}
      style={cardStyle}
    >
      {/* Image Container */}
      <div className={styles.imageContainer}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentImageIndex}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '85%',
              height: '85%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src={prod.imageUrls[currentImageIndex]} 
              alt={prod.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              loading="lazy"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Wishlist Button */}
        {!isMobileView && (
          <div onClick={(e) => e.preventDefault()}>
            <WishlistButton 
              productId={prod.id} 
              className={styles.wishlistButton}
              preventNavigation={true}
            />
          </div>
        )}
        
        {/* Stock Badge */}
        {prod.stockQuantity <= LOW_STOCK_THRESHOLD && prod.stockQuantity > 0 && (
          <span className={`${styles.stockBadge} ${styles.lowStock}`}>
            Only {prod.stockQuantity} left
          </span>
        )}
        {prod.stockQuantity === 0 && (
          <span className={styles.stockBadge}>
            Out of Stock
          </span>
        )}

        {/* Image Navigation Arrows - Only show if multiple images exist */}
        {!isMobileView && hasMultipleImages && (
          <>
            <div className={styles.imageNavigation}>
              <motion.button
                className={styles.imageNavButton}
                onClick={handlePrevImage}
                aria-label="Previous image"
                variants={arrowVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                ‹
              </motion.button>
              <motion.button
                className={styles.imageNavButton}
                onClick={handleNextImage}
                aria-label="Next image"
                variants={arrowVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                ›
              </motion.button>
            </div>

            {/* Image Indicator Dots */}
            <div className={styles.imageIndicators}>
              {prod.imageUrls.map((_, idx) => (
                <motion.span
                  key={idx}
                  className={`${styles.imageIndicatorDot} ${idx === currentImageIndex ? styles.active : ''}`}
                  variants={dotVariants}
                  animate={idx === currentImageIndex ? "active" : "inactive"}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Card Content */}
      <div className={styles.cardContent}>
        {/* Category Label */}
        {prod.category && (
          <span className={styles.categoryLabel}>{prod.category.name.toUpperCase()}</span>
        )}
        
        {/* Product Name */}
        <h3 className={styles.productName}>{prod.name}</h3>
        
        {/* Price */}
        <p className={styles.productPrice}>
          {prod.currency} {prod.price.toFixed(2)}
        </p>
        
        {/* Rating */}
        {!isMobileView && prod.avgRating !== undefined && prod.avgRating > 0 && (
          <div className={styles.ratingContainer}>
            <div className={styles.stars}>
              {[1,2,3,4,5].map((i) => (
                <span key={i}>
                  {i <= Math.round(prod.avgRating!) ? '★' : '☆'}
                </span>
              ))} 
            </div>
            {prod.ratingCount && prod.ratingCount > 0 && (
              <span className={styles.ratingText}>({prod.ratingCount})</span>
            )}
          </div>
        )}
        
        {/* Add to Cart Button */}
        {!isMobileView && (
          <button 
            className={styles.addToCartButton}
            onClick={(e) => {
              e.preventDefault()
              // Add to cart logic will be handled by parent
            }}
            disabled={prod.stockQuantity === 0}
          >
            {prod.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  )
}
