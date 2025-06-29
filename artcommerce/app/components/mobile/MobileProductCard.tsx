'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '../../contexts/WishlistContext'
import styles from './mobile.module.css'

interface ProductCardProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    currency: string
    imageUrls: string[]
    stockQuantity: number
    category?: { id: number; name: string; slug: string } | null
    avgRating?: number
    ratingCount?: number
  }
}

export default function MobileProductCard({ product }: ProductCardProps) {
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist()
  const isInWishlist = wishlistItems.some(item => item.id === product.id)
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }
  
  // Format price with currency symbol
  const formatPrice = () => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
      minimumFractionDigits: 0,
    })
    return formatter.format(product.price)
  }
  
  return (
    <Link href={`/products/${product.slug}`} className={styles.productCard}>
      <div className={styles.productImageContainer}>
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={styles.productImage}
            priority={false}
          />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
        
        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <span className={styles.lowStockBadge}>Low Stock</span>
        )}
        
        {product.stockQuantity === 0 && (
          <span className={styles.outOfStockBadge}>Out of Stock</span>
        )}
        
        <button 
          className={`${styles.wishlistButton} ${isInWishlist ? styles.active : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} fill={isInWishlist ? "#e53e3e" : "none"} color={isInWishlist ? "#e53e3e" : "#1a202c"} />
        </button>
      </div>
      
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        
        <div className={styles.productMeta}>
          {product.category && (
            <span className={styles.productCategory}>{product.category.name}</span>
          )}
          
          <span className={styles.productPrice}>{formatPrice()}</span>
        </div>
      </div>
    </Link>
  )
} 