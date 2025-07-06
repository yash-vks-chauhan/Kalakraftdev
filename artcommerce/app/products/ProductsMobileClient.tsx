'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import WishlistButton from '../components/WishlistButton'
import Image from 'next/image'

export default function ProductsMobileClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        // Normalize image URLs
        const normalized = (Array.isArray(data.products) ? data.products : []).map((p) => {
          let urls = []
          try {
            urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
          } catch {
            urls = []
          }
          
          // Check if product is new (less than 14 days old)
          const isNew = p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          
          return { ...p, imageUrls: urls, isNew }
        })
        setProducts(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Handle wishlist button click to prevent navigation
  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Format price with commas for thousands
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}></div>
      <span>Loading artworks...</span>
    </div>
  );
  
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {products.map((prod) => (
          <div key={prod.id} className={styles.cardWrapper}>
            <Link href={`/products/${prod.id}`} className={styles.card}>
              <div className={styles.imageContainer}>
                {prod.imageUrls[0] ? (
                  <img 
                    src={prod.imageUrls[0]} 
                    alt={prod.name} 
                    className={styles.image}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.noImage}>No image</div>
                )}
                {prod.isNew && <span className={styles.badge}>New</span>}
                {prod.stockQuantity === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
                {prod.stockQuantity > 0 && prod.stockQuantity <= 5 && (
                  <div className={styles.lowStock}>Limited Edition</div>
                )}
                <div className={styles.overlay}>
                  <span className={styles.viewDetails}>View Details</span>
                </div>
              </div>
              <div className={styles.info}>
                {prod.category && (
                  <div className={styles.categoryTag}>
                    {prod.category.name}
                  </div>
                )}
                <h3 className={styles.name}>{prod.name}</h3>
                <p className={styles.shortDesc}>
                  {prod.shortDesc 
                    ? `${prod.shortDesc.substring(0, 60)}${prod.shortDesc.length > 60 ? '...' : ''}`
                    : 'Handcrafted art piece'}
                </p>
                <div className={styles.priceRow}>
                  <p className={styles.price}>{formatPrice(prod.price)}</p>
                  {prod.avgRating > 0 ? (
                    <p className={styles.productRating}>
                      <span className={styles.starFilled}>★</span> 
                      <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
                    </p>
                  ) : (
                    <p className={styles.productRating}>
                      <span className={styles.starFilled}>★</span> 
                      <span className={styles.ratingValue}>New</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
            <div className={styles.wishlistContainer} onClick={handleWishlistClick}>
              <WishlistButton 
                productId={prod.id} 
                className={styles.wishlistButton}
                preventNavigation={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 