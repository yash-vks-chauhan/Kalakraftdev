'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'

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

  // Function to render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating - fullStars >= 0.5
    const stars = []
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className={styles.star}>★</span>)
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<span key="half" className={styles.star}>★</span>)
    }
    
    // Add empty stars
    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className={styles.emptyStar}>★</span>)
    }
    
    return stars
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {products.map((prod) => (
          <Link href={`/products/${prod.id}`} key={prod.id} className={styles.card}>
            <div className={styles.imageContainer}>
              {prod.imageUrls[0] ? (
                <img src={prod.imageUrls[0]} alt={prod.name} className={styles.image} />
              ) : (
                <div className={styles.noImage}>No image</div>
              )}
              {prod.isNew && <span className={styles.badge}>New</span>}
              {prod.stockQuantity === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
            </div>
            <div className={styles.info}>
              <h3 className={styles.name}>{prod.name}</h3>
              <div className={styles.priceRow}>
                <p className={styles.price}>₹{prod.price.toFixed(2)}</p>
                {prod.avgRating > 0 && (
                  <div className={styles.rating}>
                    {renderStars(prod.avgRating)}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.overlay}>
              <span className={styles.viewDetails}>View Details</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 