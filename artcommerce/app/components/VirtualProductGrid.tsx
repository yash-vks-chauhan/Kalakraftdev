/**
 * Virtual Product Grid Component
 * Renders large product lists efficiently using virtualization
 */

'use client'

import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useVirtualGrid } from '../hooks/useVirtualScroll'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import WishlistButton from './WishlistButton'
import styles from '../products/products.module.css'

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

interface VirtualProductGridProps {
  products: Product[]
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  className?: string
}

const LOW_STOCK_THRESHOLD = 5

export default function VirtualProductGrid({ 
  products, 
  onLoadMore, 
  hasMore, 
  loading,
  className 
}: VirtualProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerDimensions, setContainerDimensions] = useState({ 
    width: 0, 
    height: 600 
  })
  
  const { isSmallScreen } = useDeviceDetection()
  
  // Calculate item dimensions based on screen size
  const itemDimensions = {
    width: isSmallScreen ? 160 : 280,
    height: isSmallScreen ? 240 : 380,
    gap: isSmallScreen ? 8 : 16
  }
  
  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerDimensions({
          width: rect.width,
          height: Math.max(600, rect.height)
        })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  // Use virtual grid for efficient rendering
  const {
    visibleItems,
    containerStyle,
    scrollElementRef,
    scrollToItem,
    gridInfo
  } = useVirtualGrid(products, {
    itemWidth: itemDimensions.width,
    itemHeight: itemDimensions.height,
    containerWidth: containerDimensions.width,
    containerHeight: containerDimensions.height,
    gap: itemDimensions.gap,
    overscan: 2
  })
  
  // Load more items when approaching end
  useEffect(() => {
    if (!hasMore || loading || !onLoadMore) return
    
    const { visibleRange, totalRows } = gridInfo
    const loadMoreThreshold = Math.max(1, totalRows - 3)
    
    if (visibleRange.endRow >= loadMoreThreshold) {
      onLoadMore()
    }
  }, [gridInfo, hasMore, loading, onLoadMore])
  
  // Render individual product card
  const renderProductCard = (item: Product & { 
    index: number; 
    row: number; 
    col: number; 
    style: React.CSSProperties 
  }) => {
    const product = item
    
    return (
      <div
        key={product.id}
        style={item.style}
        className={styles.productCard}
        data-animate-on-scroll="true"
      >
        <Link href={`/products/${product.id}`}>
          {/* Stock badges */}
          {product.stockQuantity <= 0 ? (
            <span className={styles.outOfStockBadge}>
              OUT OF STOCK
            </span>
          ) : product.stockQuantity <= LOW_STOCK_THRESHOLD && (
            <span className={styles.lowStockBadge}>
              LOW STOCK
            </span>
          )}
          
          {/* Product image */}
          <div className={styles.productImageContainer}>
            {product.imageUrls[0] ? (
              <img 
                src={product.imageUrls[0]} 
                alt={product.name} 
                className={styles.productImage}
                loading="lazy"
              />
            ) : (
              <div className={`${styles.productImage} ${styles.noImage}`}>  
                <span className={styles.noImageText}>No image</span>
              </div>
            )}
            {!isSmallScreen && (
              <div className={styles.productImageOverlay}>
                <WishlistButton 
                  productId={product.id} 
                  className={styles.wishlistButton}
                  preventNavigation={true}
                />
              </div>
            )}
          </div>
          
          {/* Mobile wishlist button */}
          {isSmallScreen && (
            <div className={styles.mobileWishlistContainer} onClick={(e) => e.preventDefault()}>
              <WishlistButton 
                productId={product.id} 
                className={styles.mobileWishlistButton}
                preventNavigation={true}
              />
            </div>
          )}
          
          {/* Product info */}
          <div className={styles.productInfo}>
            {product.category && (
              <span className={styles.productCategory}>{product.category.name}</span>
            )}
            <h3 className={styles.productName}>{product.name}</h3>
            <div className={styles.productPriceContainer}>
              <p className={styles.productPrice}>
                {isSmallScreen ? product.price.toFixed(2) : `${product.currency} ${product.price.toFixed(2)}`}
              </p>
              {isSmallScreen && product.avgRating !== undefined && product.avgRating > 0 && (
                <p className={styles.productRating}>
                  <span className={styles.starFilled}>★</span> 
                  <span className={styles.ratingValue}>{product.avgRating.toFixed(1)}</span>
                </p>
              )}
            </div>
            
            {!isSmallScreen && product.avgRating !== undefined && (
              <p className={styles.productRating}>
                {[1,2,3,4,5].map((i, idx) => (
                  <span key={idx} className={i <= Math.round(product.avgRating!) ? styles.starFilled : styles.starEmpty}>
                    ★
                  </span>
                ))} 
                <span className={styles.ratingCount}>({product.ratingCount})</span>
              </p>
            )}
            
            {!isSmallScreen && <p className={styles.productShortDesc}>{product.shortDesc}</p>}
            
            {!isSmallScreen && (
              <span className={styles.viewDetailsButton}>
                View Details
              </span>
            )}
          </div>
        </Link>
      </div>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className={`${styles.virtualGridContainer} ${className || ''}`}
      style={{ height: containerDimensions.height }}
    >
      <div
        ref={scrollElementRef}
        className={styles.virtualScrollContainer}
        style={{
          height: '100%',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div style={containerStyle}>
          {visibleItems.map(renderProductCard)}
        </div>
        
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading more products...</p>
          </div>
        )}
      </div>
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <p>Total: {products.length} | Visible: {visibleItems.length}</p>
          <p>Grid: {gridInfo.columnsPerRow} cols × {gridInfo.totalRows} rows</p>
          <p>Visible rows: {gridInfo.visibleRange.startRow} - {gridInfo.visibleRange.endRow}</p>
        </div>
      )}
    </div>
  )
}
