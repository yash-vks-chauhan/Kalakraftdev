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
      className={`${styles.productCard} ${className}`}
      style={cardStyle}
    >
      {/* Image Container */}
      <div className={styles.imageContainer}>
        {prod.imageUrls[0] ? (
          <img 
            src={prod.imageUrls[0]} 
            alt={prod.name} 
            className={styles.productImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.productImage} style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>  
            <span style={{ color: '#666', fontSize: '0.85rem' }}>No image</span>
          </div>
        )}
        
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
