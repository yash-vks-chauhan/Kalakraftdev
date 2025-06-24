// File: app/products/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import WishlistButton from '../../components/WishlistButton'
import Link from 'next/link'
import styles from './product_details.module.css'

// SVG icons for navigation
const ChevronLeft = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
)

const ChevronRight = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
)

interface Product {
  id: number
  name: string
  slug: string
  description: string
  shortDesc: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
}

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Fetch product details on mount
  useEffect(() => {
    if (!id) {
      router.replace('/products')
      return
    }

    async function fetchProduct() {
      setLoading(true)
      setFetchError(null)

      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            router.replace('/404')
            return
          }
          setFetchError(`Server error: ${res.status}`)
          return
        }
        const data = await res.json()
        setProduct(data.product)
        setSelectedImage(0) // Reset selected image when product changes
      } catch (err: any) {
        console.error('Network error:', err)
        setFetchError('Network error—please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

  // Loading state
  if (loading) {
    return (
      <main className={styles.container}>
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-32 bg-gray-100 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 w-24 bg-gray-100 rounded"></div>
              <div className="h-12 w-3/4 bg-gray-100 rounded"></div>
              <div className="h-8 w-32 bg-gray-100 rounded"></div>
              <div className="h-24 w-full bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <main className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          ← Back to Products
        </Link>
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{fetchError}</p>
          <Link href="/products" className={styles.backLink}>
            Return to Products
          </Link>
        </div>
      </main>
    )
  }

  // Not found state
  if (!product) {
    return (
      <main className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          ← Back to Products
        </Link>
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Product not found</p>
          <Link href="/products" className={styles.backLink}>
            Return to Products
          </Link>
        </div>
      </main>
    )
  }

  // Handle add to cart
  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const quantity = Number(qty)
    if (isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1')
      return
    }

    try {
      await addToCart(product.id, quantity)
      setAdded(true)
      setTimeout(() => {
        setAdded(false)
      }, 3000)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to add to cart')
    }
  }

  // Stock status
  const getStockStatus = () => {
    if (product.stockQuantity <= 0) return { text: 'Out of stock', className: styles.outOfStock }
    if (product.stockQuantity <= 5) return { text: `Only ${product.stockQuantity} left!`, className: styles.lowStock }
    return { text: 'In stock', className: styles.inStock }
  }
  const stockStatus = getStockStatus()

  const handlePrevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? product!.imageUrls.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === product!.imageUrls.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <main className={styles.container}>
      <Link href="/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      {added && (
        <div className={styles.successBanner}>
          Product added to cart successfully
        </div>
      )}

      <div className={styles.productGrid}>
        {/* Left column: Images */}
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            {product.imageUrls[0] ? (
              <img
                src={product.imageUrls[selectedImage]}
                alt={product.name}
                className={`${styles.mainImage} ${styles.imageTransition}`}
                loading="lazy"
                key={selectedImage} // Force re-render for transition
              />
            ) : (
              <div className={styles.mainImage} style={{ 
                background: '#f8f8f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <span style={{ color: '#666666', fontSize: '0.9rem' }}>No image available</span>
              </div>
            )}

            {product.imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className={`${styles.imageNav} ${styles.prevImage}`}
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={handleNextImage}
                  className={`${styles.imageNav} ${styles.nextImage}`}
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {product.imageUrls.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImage(index)}
                  className={styles.thumbnailButton}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={url}
                    alt={`${product.name} - View ${index + 1}`}
                    className={`${styles.thumbnail} ${index === selectedImage ? styles.thumbnailActive : ''}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Product info */}
        <div className={styles.productInfo}>
          <div className={styles.wishlistContainer}>
            <WishlistButton productId={product.id} className={styles.wishlistButton} />
          </div>

          {product.category && (
            <span className={styles.category}>{product.category.name}</span>
          )}
          
          <h1 className={styles.title}>{product.name}</h1>
          
          <div className={styles.price}>
            <span className={styles.currency}>{product.currency}</span>
            {product.price.toFixed(2)}
          </div>

          <p className={styles.shortDesc}>{product.shortDesc}</p>
          
          <div className={styles.stockInfo}>
            <span className={stockStatus.className}>
              {stockStatus.text}
            </span>
          </div>

          {product.stockQuantity > 0 ? (
            <form onSubmit={handleAddToCart} className={styles.addToCartForm}>
              <div>
                <label htmlFor="qty" className={styles.qtyLabel}>Quantity</label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={product.stockQuantity}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className={styles.qtyInput}
                />
              </div>
              <button type="submit" className={styles.addToCartButton}>
                Add to Cart
              </button>
            </form>
          ) : (
            <button
              disabled
              className={styles.addToCartButton}
            >
              Out of Stock
            </button>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <p className={styles.description}>{product.description}</p>
        </div>
      </div>
    </main>
  )
}