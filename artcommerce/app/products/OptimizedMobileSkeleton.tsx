'use client'

import { useState, useEffect } from 'react'
import styles from './optimizedSkeleton.module.css'

interface OptimizedMobileSkeletonProps {
  mode?: 'initial' | 'filter' | 'pagination'
  count?: number
}

export default function OptimizedMobileSkeleton({ 
  mode = 'initial', 
  count 
}: OptimizedMobileSkeletonProps) {
  const [mounted, setMounted] = useState(false)
  const [visibleCards, setVisibleCards] = useState(0)

  // Calculate skeleton count based on screen size
  const getSkeletonCount = () => {
    if (count) return count
    if (typeof window === 'undefined') return 6
    
    const width = window.innerWidth
    if (width <= 360) return 4 // Small phones
    if (width <= 480) return 6 // Regular phones
    return 8 // Larger screens
  }

  const skeletonCount = getSkeletonCount()

  useEffect(() => {
    setMounted(true)
    
    // Progressive loading animation for initial load
    if (mode === 'initial') {
      const interval = setInterval(() => {
        setVisibleCards(prev => {
          if (prev >= skeletonCount) {
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, 100) // Stagger by 100ms

      return () => clearInterval(interval)
    } else {
      // Show all immediately for filter/pagination changes
      setVisibleCards(skeletonCount)
    }
  }, [mode, skeletonCount])

  if (!mounted) return null

  return (
    <div className={styles.container} role="status" aria-label="Loading products">
      {/* Page header skeleton */}
      <div className={styles.pageHeader}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      {/* Filter/Sort bar skeleton */}
      {mode !== 'pagination' && (
        <div className={styles.filterBar}>
          <div className={styles.filterButtonSkeleton} />
          <div className={styles.sortButtonSkeleton} />
        </div>
      )}

      {/* Product grid skeleton */}
      <div className={styles.grid}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ProductCardSkeleton 
            key={index} 
            delay={mode === 'initial' ? index * 100 : 0}
            visible={index < visibleCards}
          />
        ))}
      </div>

      {/* Hidden text for screen readers */}
      <span className={styles.srOnly}>
        Loading product information, please wait...
      </span>
    </div>
  )
}

interface ProductCardSkeletonProps {
  delay: number
  visible: boolean
}

function ProductCardSkeleton({ delay, visible }: ProductCardSkeletonProps) {
  return (
    <div 
      className={`${styles.card} ${visible ? styles.cardVisible : ''}`}
      style={{ 
        animationDelay: `${delay}ms`,
        '--skeleton-delay': `${delay}ms`
      } as React.CSSProperties}
    >
      {/* Image skeleton */}
      <div className={styles.imageContainer}>
        <div className={styles.imageSkeleton} />
        
        {/* Image indicators */}
        <div className={styles.indicators}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.indicator} />
          ))}
        </div>

        {/* Wishlist button skeleton */}
        <div className={styles.wishlistSkeleton} />
      </div>

      {/* Content skeleton */}
      <div className={styles.content}>
        {/* Category skeleton */}
        <div className={styles.categorySkeleton} />
        
        {/* Title skeleton - varied widths for realism */}
        <div className={`${styles.titleSkeleton} ${styles[`titleWidth${(Math.floor(Math.random() * 3) + 1)}`]}`} />
        
        {/* Price and rating row */}
        <div className={styles.priceRow}>
          <div className={styles.priceSkeleton} />
          <div className={styles.ratingSkeleton} />
        </div>
      </div>
    </div>
  )
}
