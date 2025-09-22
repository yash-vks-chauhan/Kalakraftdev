'use client'

import React from 'react'
import Link from 'next/link'
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
  
  const cardStyle = animationDelay !== undefined ? {
    animationDelay: `${animationDelay}ms`
  } : index !== undefined ? {
    animationDelay: `${index * 0.1}s`
  } : {}

  return (
    <Link 
      href={`/products/${prod.id}`} 
      key={prod.id}
      className={`${styles.productCard} ${animationStyles.productCard} ${className}`}
      data-animate-on-scroll="true"
      style={cardStyle}
    >
      {/* Stock badges */}
      {prod.stockQuantity <= 0 ? (
        <span className={styles.outOfStockBadge}>
          OUT OF STOCK
        </span>
      ) : prod.stockQuantity <= LOW_STOCK_THRESHOLD && (
        <span className={styles.lowStockBadge}>
          LOW STOCK
        </span>
      )}
      
      {/* Product image */}
      <div className={`${styles.productImageContainer} ${animationStyles.productImage}`}>
        {prod.imageUrls[0] ? (
          <img 
            src={prod.imageUrls[0]} 
            alt={prod.name} 
            className={styles.productImage}
            loading="lazy"
          />
        ) : (
          <div className={`${styles.productImage} ${styles.noImage}`}>  
            <span className={styles.noImageText}>No image</span>
          </div>
        )}
        
        {/* Desktop wishlist overlay */}
        {!isMobileView && (
          <div className={styles.productImageOverlay}>
            <WishlistButton 
              productId={prod.id} 
              className={styles.wishlistButton}
              preventNavigation={true}
            />
          </div>
        )}
      </div>
      
      {/* Mobile wishlist button */}
      {isMobileView && (
        <div className={styles.mobileWishlistContainer} onClick={(e) => e.preventDefault()}>
          <WishlistButton 
            productId={prod.id} 
            className={styles.mobileWishlistButton}
            preventNavigation={true}
          />
        </div>
      )}
      
      {/* Product info */}
      <div className={`${styles.productInfo} ${animationStyles.productInfo}`}>
        {prod.category && (
          <span className={styles.productCategory}>{prod.category.name}</span>
        )}
        
        <h3 className={styles.productName}>{prod.name}</h3>
        
        <div className={styles.productPriceContainer}>
          <p className={styles.productPrice}>
            {isMobileView ? prod.price.toFixed(2) : `${prod.currency} ${prod.price.toFixed(2)}`}
          </p>
          
          {/* Mobile rating */}
          {isMobileView && prod.avgRating !== undefined && prod.avgRating > 0 && (
            <p className={styles.productRating}>
              <span className={styles.starFilled}>★</span> 
              <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
            </p>
          )}
        </div>
        
        {/* Desktop rating */}
        {!isMobileView && prod.avgRating !== undefined && (
          <p className={styles.productRating}>
            {[1,2,3,4,5].map((i, idx) => (
              <span key={idx} className={i <= Math.round(prod.avgRating!) ? styles.starFilled : styles.starEmpty}>
                ★
              </span>
            ))} 
            <span className={styles.ratingCount}>({prod.ratingCount})</span>
          </p>
        )}
        
        {/* Desktop description and view button */}
        {!isMobileView && <p className={styles.productShortDesc}>{prod.shortDesc}</p>}
        {!isMobileView && (
          <span className={styles.viewDetailsButton}>
            View Details
          </span>
        )}
      </div>
    </Link>
  )
}
