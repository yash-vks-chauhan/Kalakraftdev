'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Filter, X, ChevronDown, ChevronUp, Star } from 'lucide-react'
import MobileProductCard from './MobileProductCard'
import styles from './mobile.module.css'

const KNOWN_CATEGORIES = [
  { slug: 'clocks', name: 'Clocks' },
  { slug: 'pots', name: 'Pots' },
  { slug: 'tray', name: 'Trays' },
  { slug: 'Tray', name: 'Jewelry Trays' },
  { slug: 'rangoli', name: 'Rangoli' },
  { slug: 'decor', name: 'Wall Decor' },
  { slug: 'matt rangoli', name: 'Matt Rangoli' },
  { slug: 'mirror work', name: 'Mirror Work' }
]

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

export default function MobileProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('usageTag') || ''
  const priceMinParam = searchParams.get('priceMin') || ''
  const priceMaxParam = searchParams.get('priceMax') || ''
  const sortParam = searchParams.get('sort') || ''
  const ratingMinParam = searchParams.get('ratingMin') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [priceMin, setPriceMin] = useState(priceMinParam)
  const [priceMax, setPriceMax] = useState(priceMaxParam)
  const [sortOrder, setSortOrder] = useState(sortParam)
  const [ratingMin, setRatingMin] = useState(ratingMinParam)
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStock') === 'true')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true')
  
  // Fetch list of available usage tags once
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/products/usage-tags')
        const data = await res.json()
        if (Array.isArray(data.tags)) setUsageTags(data.tags)
      } catch (err) {
        console.error('Failed to fetch usage tags', err)
      }
    }
    fetchTags()
  }, [])
  
  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (currentCategory) {
        params.set('category', currentCategory)
      }
      if (currentTag) {
        params.set('usageTag', currentTag)
      }
      if (priceMin) params.set('priceMin', priceMin)
      if (priceMax) params.set('priceMax', priceMax)
      if (sortOrder) params.set('sort', sortOrder)
      if (lowStockOnly) params.set('lowStock', 'true')
      if (inStockOnly) params.set('inStock', 'true')
      if (ratingMin) params.set('ratingMin', ratingMin)
      
      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        
        // Normalize imageUrls and prefix any bare filename with '/uploads/'
        let filteredProducts = (Array.isArray(data.products) ? data.products : []).map((p: any) => {
          let rawImgs: string[] = []
          if (Array.isArray(p.imageUrls)) {
            rawImgs = p.imageUrls
          } else {
            try {
              const parsed = JSON.parse(p.imageUrls || '[]')
              rawImgs = Array.isArray(parsed) ? parsed : []
            } catch {
              rawImgs = []
            }
          }
          const imgs = rawImgs
            .filter((img: string | null): img is string => typeof img === 'string' && img.length > 0)
            .map((img: string) => {
              // If already a URL or absolute path, leave it, otherwise prefix uploads
              return img.startsWith('http') || img.startsWith('/')
                ? img
                : `/uploads/${img}`
            })
          const tagsArr = Array.isArray(p.usageTags) ? p.usageTags : (() => {
            try {
              const parsed = JSON.parse(p.usageTags || '[]')
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
          return { ...p, imageUrls: imgs, usageTags: tagsArr, avgRating: p.avgRating ?? 0, ratingCount: p.ratingCount ?? 0 }
        })
        
        setProducts(filteredProducts)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])
  
  // Apply filters and update URL
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    if (currentTag) params.set('usageTag', currentTag)
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    if (sortOrder) params.set('sort', sortOrder)
    if (lowStockOnly) params.set('lowStock', 'true')
    if (inStockOnly) params.set('inStock', 'true')
    if (ratingMin) params.set('ratingMin', ratingMin)
    
    router.replace(`/products?${params.toString()}`)
    setIsFilterOpen(false)
  }
  
  // Reset filters
  const resetFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setSortOrder('')
    setRatingMin('')
    setLowStockOnly(false)
    setInStockOnly(false)
    router.replace('/products')
    setIsFilterOpen(false)
  }
  
  // Handle category selection
  const handleCategoryChange = (slug: string) => {
    router.replace(slug === currentCategory ? '/products' : `/products?category=${encodeURIComponent(slug)}`)
  }
  
  if (loading) return (
    <div className={styles.loadingContainer}>
      <Image
        src="/images/loading.png"
        alt="Loading..."
        width={50}
        height={50}
        className={styles.loadingSpinner}
      />
    </div>
  )
  
  if (error) return <p className={styles.errorMessage}>Error: {error}</p>
  
  return (
    <div className={styles.mobileProductsPage}>
      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <button 
          className={styles.filterButton} 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter size={18} />
          <span>Filter</span>
        </button>
        
        <div className={styles.activeCategoryContainer}>
          {currentCategory ? (
            <div className={styles.activeCategory}>
              {KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory}
              <button 
                className={styles.clearCategoryButton}
                onClick={() => router.replace('/products')}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <span className={styles.allProductsLabel}>All Products</span>
          )}
        </div>
      </div>
      
      {/* Filter Panel */}
      <div className={`${styles.filterPanel} ${isFilterOpen ? styles.filterPanelOpen : ''}`}>
        <div className={styles.filterHeader}>
          <h2>Filters</h2>
          <button 
            className={styles.closeFilterButton}
            onClick={() => setIsFilterOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.filterContent}>
          {/* Categories */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Categories</h3>
            <div className={styles.categoryOptions}>
              {KNOWN_CATEGORIES.map(cat => (
                <label key={cat.slug} className={styles.categoryOption}>
                  <input
                    type="radio"
                    name="category"
                    checked={currentCategory === cat.slug}
                    onChange={() => handleCategoryChange(cat.slug)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Price Range */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Price Range</h3>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className={styles.priceInput}
              />
              <span className={styles.priceSeparator}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className={styles.priceInput}
              />
            </div>
          </div>
          
          {/* Sort Order */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Sort By</h3>
            <div className={styles.sortOptions}>
              <label className={styles.sortOption}>
                <input
                  type="radio"
                  name="sort"
                  value="price_asc"
                  checked={sortOrder === 'price_asc'}
                  onChange={() => setSortOrder('price_asc')}
                />
                <span>Price: Low to High</span>
              </label>
              <label className={styles.sortOption}>
                <input
                  type="radio"
                  name="sort"
                  value="price_desc"
                  checked={sortOrder === 'price_desc'}
                  onChange={() => setSortOrder('price_desc')}
                />
                <span>Price: High to Low</span>
              </label>
              <label className={styles.sortOption}>
                <input
                  type="radio"
                  name="sort"
                  value="rating_desc"
                  checked={sortOrder === 'rating_desc'}
                  onChange={() => setSortOrder('rating_desc')}
                />
                <span>Highest Rated</span>
              </label>
            </div>
          </div>
          
          {/* Other Filters */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Other Filters</h3>
            <div className={styles.otherOptions}>
              <label className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={() => setInStockOnly(!inStockOnly)}
                />
                <span>In Stock Only</span>
              </label>
              <label className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={() => setLowStockOnly(!lowStockOnly)}
                />
                <span>Low Stock Items</span>
              </label>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className={styles.filterActions}>
            <button 
              className={styles.resetButton}
              onClick={resetFilters}
            >
              Reset
            </button>
            <button 
              className={styles.applyButton}
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      {products.length === 0 ? (
        <div className={styles.noProducts}>
          <p>No products found matching your criteria.</p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {products.map(product => (
            <MobileProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {/* Overlay when filter panel is open */}
      {isFilterOpen && (
        <div 
          className={styles.filterOverlay}
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  )
} 