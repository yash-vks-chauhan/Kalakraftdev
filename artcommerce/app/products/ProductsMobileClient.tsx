'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import { Heart, SortAsc, Filter, ArrowLeft, Search, ShoppingBag } from 'lucide-react'

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
      <p>Loading products...</p>
    </div>
  )
  
  if (error) return <div className={styles.error}>Error: {error}</div>

  // Find active category name
  const activeCategoryName = activeCategory === 'all' 
    ? 'All Products' 
    : categories.find(c => c.slug === activeCategory)?.name || 'Products';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerTitle}>
            <div className={styles.brandLogo}>
              <span className={styles.brandLogoText}>A</span>
            </div>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>{activeCategoryName.toUpperCase()}</h1>
              <p className={styles.itemCount}>{products.length} Items</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.actionButton}>
              <Search size={20} />
            </button>
            <button className={styles.actionButton}>
              <Heart size={20} />
            </button>
            <button className={styles.actionButton}>
              <div className={styles.bagContainer}>
                <ShoppingBag size={20} />
                <span className={styles.bagCount}>2</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Category Pills */}
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
      
      {/* Product Grid */}
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
                <button className={styles.wishlistButton} aria-label="Add to wishlist">
                  <Heart size={18} />
                </button>
              </div>
              <div className={styles.info}>
                <h3 className={styles.brand}>{prod.category?.name || 'Art'}</h3>
                <p className={styles.name}>{prod.name}</p>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>₹{Math.floor(prod.price).toLocaleString()}</span>
                  <span className={styles.originalPrice}>₹{Math.floor(prod.price * 1.5).toLocaleString()}</span>
                  <span className={styles.discount}>50% OFF!</span>
                </div>
                {prod.avgRating > 0 && (
                  <div className={styles.ratingPill}>
                    <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
                    <span className={styles.ratingCount}>{prod.ratingCount}</span>
                  </div>
                )}
                <p className={styles.delivery}>2 Day Delivery</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Bottom Action Bar */}
      <div className={styles.bottomBar}>
        <button className={styles.bottomBarButton}>
          <SortAsc size={18} />
          <span>SORT</span>
        </button>
        <div className={styles.bottomBarDivider}></div>
        <button className={styles.bottomBarButton}>
          <Filter size={18} />
          <span>FILTER</span>
        </button>
      </div>
    </div>
  )
} 