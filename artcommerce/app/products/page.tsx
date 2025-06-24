// File: app/products/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from '../components/WishlistButton'
import styles from './products.module.css'

const LOW_STOCK_THRESHOLD = 5 // Products with stock <= 5 will show low stock warning

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
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''
  const productGridRef = useRef<HTMLDivElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

  function handleCategoryClick(slug: string) {
    // Use exact slug from database, no transformations needed
    router.replace(slug === currentCategory ? '/products' : `/products?category=${encodeURIComponent(slug)}`)
  }

  // fetch products from API (with category and search filter)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (currentCategory) {
        // Use exact category slug, no transformations needed
        params.set('category', currentCategory)
      }
      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        
        let filteredProducts = Array.isArray(data.products) ? data.products : []
        
        // Client-side category filtering as backup
        if (currentCategory && filteredProducts.length > 0) {
          filteredProducts = filteredProducts.filter((product: Product) => {
            const categorySlug = product.category?.slug || ''
            return categorySlug === currentCategory
          })
        }
        
        setProducts(filteredProducts)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory])

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply scroll-based transformations to products
  useEffect(() => {
    if (!productGridRef.current) return

    const cards = productGridRef.current.querySelectorAll(`.${styles.productCard}`)
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const distanceFromCenter = Math.abs(window.innerHeight / 2 - centerY)
      const scale = Math.max(0.9, 1 - distanceFromCenter / 1000)
      const opacity = Math.max(0.6, 1 - distanceFromCenter / 800)
      const translateY = distanceFromCenter * 0.05
      
      ;(card as HTMLElement).style.transform = `scale(${scale}) translateY(${translateY}px)`
      ;(card as HTMLElement).style.opacity = opacity.toString()
    })
  }, [scrollY, products])

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
    <main className={styles.productsContainer}>
      <h1 className={styles.title}>Discover Our Collection</h1>

      {/* Category badges */}
      <div className={styles.categoryContainer}>
        {KNOWN_CATEGORIES.map(cat => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`${styles.categoryButton} ${cat.slug === currentCategory ? styles.active : ''}`}
          >{cat.name}</button>
        ))}
        {currentCategory && (
          <button onClick={() => router.replace('/products')} className={`${styles.categoryButton} ${styles.clearCategoryButton}`}>
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {(products.length === 0) ? (
        <p className={styles.emptyProducts}>No products found.</p>
      ) : (
        <div className={styles.productGrid} ref={productGridRef}>
          {(products).map((prod, index) => (
            <div 
              key={prod.id} 
              className={styles.productCard}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {prod.stockQuantity <= 0 ? (
                <span className={styles.outOfStockBadge}>
                  Out of stock
                </span>
              ) : prod.stockQuantity <= LOW_STOCK_THRESHOLD && (
                <span className={styles.lowStockBadge}>
                  Low stock
                </span>
              )}
              <div className={styles.productImageContainer}>
                {prod.imageUrls[0] ? (
                  <img 
                    src={prod.imageUrls[0]} 
                    alt={prod.name} 
                    className={styles.productImage}
                    loading="lazy"
                  />
                ) : (
                  <div className={`${styles.productImage} ${styles.noImage}`}>
                    <span className={styles.noImageText}>No image</span>
                  </div>
                )}
                <div className={styles.productImageOverlay}>
                  <WishlistButton 
                    productId={prod.id} 
                    className={styles.wishlistButton}
                    preventNavigation={true}
                  />
                </div>
              </div>
              <div className={styles.productInfo}>
                {prod.category && (
                  <span className={styles.productCategory}>{prod.category.name}</span>
                )}
                <h3 className={styles.productName}>{prod.name}</h3>
                <p className={styles.productPrice}>{prod.currency} {prod.price.toFixed(2)}</p>
                <p className={styles.productShortDesc}>{prod.shortDesc}</p>
                <Link href={`/products/${prod.id}`} className={styles.viewDetailsButton}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
