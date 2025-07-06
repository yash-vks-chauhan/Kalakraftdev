'use client'

import React, { useState, useEffect, useRef } from 'react'
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

interface ProductsMobileClientProps {
  products: any[]
  categories: any[]
}

const ProductsMobileClient: React.FC<ProductsMobileClientProps> = ({ products, categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(searchParams.get('category') || '')
  const [currentRating, setCurrentRating] = useState(searchParams.get('rating') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true')
  const [currentSort, setCurrentSort] = useState(searchParams.get('sort') || 'featured')
  
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
        {products.map((product) => (
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
                <p className={styles.productDescription}>{product.description?.substring(0, 60)}...</p>
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
        ))}
      </div>
    </div>
  );
};

export default ProductsMobileClient; 