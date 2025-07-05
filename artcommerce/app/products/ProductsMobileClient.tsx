'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import { Heart } from 'lucide-react'

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
      <p>Loading art pieces...</p>
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
          All
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
      
      <div className={styles.list}>
        {products.map((prod) => (
          <div key={prod.id} className={styles.card}>
            <Link href={`/products/${prod.id}`} className={styles.cardLink}>
              <div className={styles.imageContainer}>
                {prod.imageUrls[0] ? (
                  <img src={prod.imageUrls[0]} alt={prod.name} className={styles.image} />
                ) : (
                  <div className={styles.noImage}>No image</div>
                )}
                {prod.stockQuantity <= 5 && prod.stockQuantity > 0 && (
                  <div className={styles.lowStockBadge}>Low Stock</div>
                )}
                {prod.stockQuantity === 0 && (
                  <div className={styles.soldOutBadge}>Sold Out</div>
                )}
              </div>
              <div className={styles.info}>
                <h3 className={styles.name}>{prod.name}</h3>
                <div className={styles.details}>
                  <p className={styles.price}>₹{prod.price.toFixed(2)}</p>
                  {prod.avgRating > 0 && (
                    <div className={styles.rating}>
                      <span className={styles.stars}>{'★'.repeat(Math.round(prod.avgRating))}</span>
                      <span className={styles.ratingCount}>({prod.ratingCount})</span>
                    </div>
                  )}
                </div>
                {prod.category && (
                  <p className={styles.category}>{prod.category.name}</p>
                )}
              </div>
            </Link>
            <button className={styles.wishlistButton} aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 