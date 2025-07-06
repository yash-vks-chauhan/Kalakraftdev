'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiStar, FiHeart } from 'react-icons/fi'
import { ChevronRight, Filter, X } from 'lucide-react'

// Define known categories similar to desktop version
const KNOWN_CATEGORIES = [
  { name: 'All Products', slug: '' },
  { name: 'Wall Art', slug: 'wall-art' },
  { name: 'Vases', slug: 'vases' },
  { name: 'Trays', slug: 'trays' },
  { name: 'Sculptures', slug: 'sculptures' },
  { name: 'Clocks', slug: 'clocks' },
]

interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  currency: string
  images: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
  rating?: number
}

const ProductsMobileClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(searchParams.get('category') || '')
  const [currentRating, setCurrentRating] = useState(searchParams.get('rating') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true')
  const [currentSort, setCurrentSort] = useState(searchParams.get('sort') || 'featured')
  const [error, setError] = useState<string | null>(null)
  
  // Track which filter sections are open
  const [openSections, setOpenSections] = useState({
    category: true,
    rating: false,
    stock: false,
    sort: false
  })

  // Prevent body scroll when filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMobileFilterOpen])

  // Fetch products data
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      
      if (currentCategory) {
        params.set('category', currentCategory)
      }
      
      if (currentRating) {
        params.set('ratingMin', currentRating)
      }
      
      if (inStockOnly) {
        params.set('inStock', 'true')
      }
      
      if (currentSort && currentSort !== 'featured') {
        params.set('sort', currentSort)
      }
      
      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        
        // Normalize image URLs
        const processedProducts = data.products.map((p: any) => {
          let images: string[] = []
          
          if (Array.isArray(p.imageUrls)) {
            images = p.imageUrls
          } else if (p.imageUrls) {
            try {
              const parsed = JSON.parse(p.imageUrls)
              images = Array.isArray(parsed) ? parsed : []
            } catch {
              images = []
            }
          }
          
          // Ensure all images have proper paths
          images = images.map((img: string) => {
            return img.startsWith('http') || img.startsWith('/') 
              ? img 
              : `/uploads/${img}`
          })
          
          return { 
            ...p, 
            images,
            rating: p.avgRating || 0
          }
        })
        
        setProducts(processedProducts)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }
    
    // Fetch categories
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    
    fetchProducts()
    fetchCategories()
  }, [currentCategory, currentRating, inStockOnly, currentSort])

  // Toggle filter sections
  const toggleSection = (section: 'category' | 'rating' | 'stock' | 'sort') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Handle navigation
  const handleFilterChange = (param: string, value: string) => {
    const qs = new URLSearchParams(searchParams.toString())
    
    if (value === '' || value === 'featured' || value === 'false') {
      qs.delete(param)
    } else {
      qs.set(param, value)
    }
    
    router.replace(qs.toString() ? `/products?${qs}` : '/products')
  }

  // Clear all filters
  const clearAllFilters = () => {
    router.replace('/products')
    setIsMobileFilterOpen(false)
  }

  // Render filter section with enhanced UI and animations
  const renderFilterSection = (
    title: string,
    content: React.ReactNode,
    section: 'category' | 'rating' | 'stock' | 'sort',
    isOpen: boolean = false
  ) => {
    return (
      <details 
        className={styles.filterSection} 
        open={openSections[section]}
        onClick={(e) => {
          // Prevent default only if clicking on summary
          if ((e.target as HTMLElement).tagName === 'SUMMARY') {
            e.preventDefault()
            toggleSection(section)
          }
        }}
      >
        <summary className={styles.filterHeader}>
          {title}
          <ChevronRight className={styles.arrow} />
        </summary>
        <div className={styles.filterContent}>
          {content}
        </div>
      </details>
    );
  };

  // Filter content components with enhanced UI
  const categoryFilterContent = (
    <>
      {KNOWN_CATEGORIES.map((category) => (
        <label key={category.slug} className={styles.filterOption}>
          <input
            type="radio"
            name="categoryFilter"
            checked={currentCategory === category.slug}
            onChange={() => {
              setCurrentCategory(category.slug)
              handleFilterChange('category', category.slug)
            }}
          />
          {category.name}
        </label>
      ))}
      {currentCategory && (
        <button 
          className={styles.clearButton} 
          onClick={() => {
            setCurrentCategory('')
            handleFilterChange('category', '')
          }}
        >
          Clear Category
        </button>
      )}
    </>
  );

  const ratingFilterContent = (
    <>
      {[4, 3, 2, 1].map((rating) => (
        <label key={rating} className={styles.filterOption}>
          <input
            type="radio"
            name="ratingFilter"
            checked={currentRating === rating.toString()}
            onChange={() => {
              setCurrentRating(rating.toString())
              handleFilterChange('rating', rating.toString())
            }}
          />
          {rating}+ Stars
        </label>
      ))}
      {currentRating && (
        <button 
          className={styles.clearButton} 
          onClick={() => {
            setCurrentRating('')
            handleFilterChange('rating', '')
          }}
        >
          Clear Rating
        </button>
      )}
    </>
  );

  const stockFilterContent = (
    <>
      <label className={styles.filterOption}>
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => {
            setInStockOnly(e.target.checked)
            handleFilterChange('inStock', e.target.checked ? 'true' : 'false')
          }}
        />
        In stock only
      </label>
    </>
  );

  const sortFilterContent = (
    <>
      <label className={styles.filterOption}>
        <input
          type="radio"
          name="sortFilter"
          checked={currentSort === 'featured'}
          onChange={() => {
            setCurrentSort('featured')
            handleFilterChange('sort', '')
          }}
        />
        Featured
      </label>
      <label className={styles.filterOption}>
        <input
          type="radio"
          name="sortFilter"
          checked={currentSort === 'newest'}
          onChange={() => {
            setCurrentSort('newest')
            handleFilterChange('sort', 'newest')
          }}
        />
        Newest Arrivals
      </label>
      <label className={styles.filterOption}>
        <input
          type="radio"
          name="sortFilter"
          checked={currentSort === 'price_asc'}
          onChange={() => {
            setCurrentSort('price_asc')
            handleFilterChange('sort', 'price_asc')
          }}
        />
        Price: Low to High
      </label>
      <label className={styles.filterOption}>
        <input
          type="radio"
          name="sortFilter"
          checked={currentSort === 'price_desc'}
          onChange={() => {
            setCurrentSort('price_desc')
            handleFilterChange('sort', 'price_desc')
          }}
        />
        Price: High to Low
      </label>
    </>
  );

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
    </div>
  )
  
  if (error) return (
    <div className={styles.errorContainer}>
      <p>Error: {error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  )

  return (
    <div className={styles.container}>
      {/* Mobile Filter Button with enhanced UI */}
      <button 
        className={styles.mobileFilterButton} 
        onClick={() => setIsMobileFilterOpen(true)}
      >
        <Filter size={16} />
        Filter
      </button>
      
      {/* Improved Filter Drawer with smooth transitions */}
      {isMobileFilterOpen && (
        <div 
          className={`${styles.mobileFilterOverlay} ${isMobileFilterOpen ? styles.mobileFilterOverlayVisible : ''}`}
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}
      
      <div className={`${styles.mobileFilterDrawer} ${isMobileFilterOpen ? styles.mobileFilterDrawerOpen : ''}`}>
        <div className={styles.mobileFilterHeader}>
          <h2>Filters</h2>
          <button 
            className={styles.mobileFilterCloseButton} 
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.mobileFilterContent}>
          {renderFilterSection('Categories', categoryFilterContent, 'category', true)}
          {renderFilterSection('Rating', ratingFilterContent, 'rating')}
          {renderFilterSection('Availability', stockFilterContent, 'stock')}
          {renderFilterSection('Sort By', sortFilterContent, 'sort')}
          
          {(currentCategory || currentRating || inStockOnly || currentSort !== 'featured') && (
            <button 
              className={styles.clearButton} 
              onClick={clearAllFilters}
              style={{ marginTop: '2rem', background: '#1a202c', color: 'white' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className={styles.productGrid}>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <Link href={`/products/${product.id}`} className={styles.productLink}>
                <div className={styles.imageContainer}>
                  {product.images && product.images.length > 0 && (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.productImage}
                      priority={false}
                    />
                  )}
                  <button className={styles.wishlistButton} aria-label="Add to wishlist">
                    <FiHeart className={styles.wishlistIcon} />
                  </button>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  {product.description && (
                    <p className={styles.productDescription}>
                      {product.description.substring(0, 60)}
                      {product.description.length > 60 ? '...' : ''}
                    </p>
                  )}
                  <div className={styles.productMeta}>
                    <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                    <div className={styles.productRating}>
                      <FiStar className={styles.starIcon} />
                      <span>{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className={styles.noProducts}>
            <p>No products found matching your filters.</p>
            <button 
              className={styles.clearButton} 
              onClick={clearAllFilters}
              style={{ marginTop: '1rem', background: '#1a202c', color: 'white' }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsMobileClient; 