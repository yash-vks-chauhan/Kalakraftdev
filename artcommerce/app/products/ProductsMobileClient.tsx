'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import { Heart, Eye } from 'lucide-react'

export default function ProductsMobileClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch categories')
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const url = activeCategory !== 'all' 
          ? `/api/products?category=${activeCategory}&inStock=true` 
          : '/api/products?inStock=true'
        
        const res = await fetch(url)
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
          return { ...p, imageUrls: urls }
        })
        setProducts(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [activeCategory])

  const handleCategoryChange = (categorySlug) => {
    setActiveCategory(categorySlug)
  }

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Curating art pieces...</p>
    </div>
  )
  
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.categoryScroll}>
        <button 
          className={`${styles.categoryButton} ${activeCategory === 'all' ? styles.activeCategory : ''}`}
          onClick={() => handleCategoryChange('all')}
        >
          All Art
        </button>
        {categories.map((category) => (
          <button 
            key={category.id}
            className={`${styles.categoryButton} ${activeCategory === category.slug ? styles.activeCategory : ''}`}
            onClick={() => handleCategoryChange(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      <div className={styles.artGrid}>
        {products.map((product) => (
          <div key={product.id} className={styles.artCard}>
            <div className={styles.imageFrame}>
              {product.imageUrls[0] ? (
                <img 
                  src={product.imageUrls[0]} 
                  alt={product.name} 
                  className={styles.artImage} 
                />
              ) : (
                <div className={styles.noImage}>No image available</div>
              )}
              
              <div className={styles.cardOverlay}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton} aria-label="Add to wishlist">
                    <Heart size={18} />
                  </button>
                  <Link href={`/products/${product.id}`} className={styles.viewButton}>
                    <Eye size={18} />
                    <span>View</span>
                  </Link>
                </div>
              </div>
              
              {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                <div className={styles.badge}>Limited Edition</div>
              )}
              {product.stockQuantity === 0 && (
                <div className={styles.soldOutBadge}>Sold Out</div>
              )}
            </div>
            
            <div className={styles.artInfo}>
              <h3 className={styles.artTitle}>{product.name}</h3>
              <div className={styles.artistInfo}>
                <span className={styles.artistName}>{product.category?.name || 'Art Collection'}</span>
                {product.avgRating > 0 && (
                  <div className={styles.rating}>
                    <span className={styles.stars}>{'★'.repeat(Math.round(product.avgRating))}</span>
                    <span className={styles.ratingCount}>{product.ratingCount}</span>
                  </div>
                )}
              </div>
              <div className={styles.priceRow}>
                <p className={styles.price}>₹{product.price.toLocaleString()}</p>
                {product.stockQuantity > 0 ? (
                  <span className={styles.availability}>In Stock</span>
                ) : (
                  <span className={styles.unavailable}>Out of Stock</span>
                )}
              </div>
              <div className={styles.description}>
                {product.shortDesc?.substring(0, 60)}
                {product.shortDesc?.length > 60 ? '...' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 