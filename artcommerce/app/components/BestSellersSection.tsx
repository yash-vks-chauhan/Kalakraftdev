'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  imageUrls: string[]
  category?: { name: string }
  stockQuantity?: number
}

interface BestSellersProps {
  styles: any // CSS modules styles
}

const BestSellersSection = ({ styles }: BestSellersProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({})
  
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { wishlistItems = [], addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const router = useRouter()
  
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const startTime = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)

  // Format price function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price)
  }

  // Fetch best sellers
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products/best-sellers?limit=4')
        const data = await response.json()
        
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error('Error fetching best sellers:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBestSellers()
  }, [])

  // Enhanced touch handling for smooth card-like swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return
    
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    currentX.current = touch.clientX
    isDragging.current = true
    startTime.current = Date.now()
    
    // Prevent default to ensure smooth tracking
    e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return
    
    const touch = e.touches[0]
    currentX.current = touch.clientX
    
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current
    
    // Only handle horizontal swipes (prevent interfering with vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      
      // Apply rubber band effect at boundaries
      let constrainedDelta = deltaX
      const maxDrag = 100
      
      // Left boundary (can't go before first item)
      if (currentIndex === 0 && deltaX > 0) {
        constrainedDelta = Math.sign(deltaX) * maxDrag * (1 - Math.exp(-Math.abs(deltaX) / maxDrag))
      }
      // Right boundary (can't go after last item)
      else if (currentIndex === products.length - 1 && deltaX < 0) {
        constrainedDelta = Math.sign(deltaX) * maxDrag * (1 - Math.exp(-Math.abs(deltaX) / maxDrag))
      }
      
      setDragOffset(constrainedDelta)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    
    isDragging.current = false
    const endTime = Date.now()
    const deltaTime = endTime - startTime.current
    const deltaX = currentX.current - touchStartX.current
    const velocity = Math.abs(deltaX) / deltaTime // pixels per millisecond
    
    // Reset drag offset with animation
    setDragOffset(0)
    
    // Determine if we should swipe based on distance and velocity
    const swipeThreshold = 80
    const velocityThreshold = 0.3
    
    const shouldSwipeLeft = (deltaX < -swipeThreshold) || (deltaX < -30 && velocity > velocityThreshold)
    const shouldSwipeRight = (deltaX > swipeThreshold) || (deltaX > 30 && velocity > velocityThreshold)
    
    if (shouldSwipeLeft && currentIndex < products.length - 1) {
      goToNext()
    } else if (shouldSwipeRight && currentIndex > 0) {
      goToPrevious()
    }
  }

  // Navigation functions with enhanced animations
  const goToNext = () => {
    if (isTransitioning || currentIndex >= products.length - 1) return
    setIsTransitioning(true)
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setIsTransitioning(false), 400)
  }

  const goToPrevious = () => {
    if (isTransitioning || currentIndex <= 0) return
    setIsTransitioning(true)
    setCurrentIndex(prev => prev - 1)
    setTimeout(() => setIsTransitioning(false), 400)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 400)
  }

  // Add to cart function
  const handleAddToCart = async (productId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }))
    
    try {
      await addToCart(Number(productId), 1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }))
    }
  }

  // Wishlist toggle function
  const handleWishlistToggle = async (productId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const isInWishlistStatus = isInWishlist(Number(productId))
    
    try {
      if (isInWishlistStatus) {
        await removeFromWishlist(Number(productId))
      } else {
        await addToWishlist(Number(productId))
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }

  if (loading) {
    return (
      <section className={styles.bestSellersSection} data-aos="fade-up">
        <div className={styles.sectionHeader} data-aos="fade-up">
          <div className={styles.headerLine}></div>
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <div className={styles.headerLine}></div>
        </div>
        <div className={styles.bestSellersLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading best sellers...</p>
        </div>
      </section>
    )
  }

  if (error || !products.length) {
    return null // Hide section if no data
  }

  return (
    <section className={styles.bestSellersSection} data-aos="fade-up">
      {/* Section Header */}
      <div className={styles.sectionHeader} data-aos="fade-up">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.headerLine}></div>
      </div>

      <div className={styles.bestSellersDescription} data-aos="fade-up" data-aos-delay="100">
        <p>Discover our most loved creations, chosen by customers like you. These handcrafted pieces have won hearts and found their way into homes across the country.</p>
      </div>

      {/* Best Sellers Layout - Desktop */}
      <div className={`${styles.bestSellersDesktop} ${styles.desktopOnly}`} data-aos="fade-up" data-aos-delay="200">
        {products.map((product, index) => (
          <div key={product.id} className={styles.bestSellerCard} data-aos="fade-up" data-aos-delay={`${300 + (index * 100)}`}>
            <Link href={`/products/${product.id}`}>
              <div className={styles.bestSellerImageContainer}>
                <img 
                  src={product.imageUrls[0] || 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'} 
                  alt={product.name}
                  className={styles.bestSellerImage}
                  onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x300/f0f0f0/888?text=No+Image')}
                />
              </div>
              <div className={styles.bestSellerInfo}>
                <h3 className={styles.bestSellerTitle}>{product.name}</h3>
                <p className={styles.bestSellerPrice}>{formatPrice(product.price)}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Best Sellers Mobile Carousel */}
      <div className={`${styles.bestSellersMobileCarousel} ${styles.mobileOnly}`} data-aos="fade-up" data-aos-delay="200">
        <div 
          className={styles.mobileCarouselContainer}
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className={styles.mobileCarouselTrack}
            style={{ 
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {products.map((product, index) => {
              const isInWishlistStatus = isInWishlist(Number(product.id))
              
              return (
                <div key={`${product.id}-${index}`} className={styles.mobileCarouselSlide}>
                  <div className={styles.mobileProductCard}>
                    {/* Left side - Product Image */}
                    <div className={styles.mobileProductImageSection}>
                      <Link href={`/products/${product.id}`} className={styles.mobileImageLink}>
                        <div className={styles.mobileProductImageContainer}>
                          <img
                            src={product.imageUrls[0] || 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'}
                            alt={product.name}
                            className={styles.mobileProductImage}
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x300/f0f0f0/888?text=No+Image')}
                          />
                        </div>
                      </Link>
                    </div>

                    {/* Right side - Product Details */}
                    <div className={styles.mobileProductDetailsSection}>
                      <div className={styles.mobileProductDetails}>
                        {product.category && (
                          <span className={styles.mobileProductCategory}>
                            {product.category.name}
                          </span>
                        )}
                        
                        <Link href={`/products/${product.id}`}>
                          <h3 className={styles.mobileProductName}>
                            {product.name}
                          </h3>
                        </Link>
                        
                        <p className={styles.mobileProductPrice}>
                          {formatPrice(product.price)}
                        </p>

                        <div className={styles.mobileProductActions}>
                          <button
                            className={styles.mobileAddToCartButton}
                            onClick={() => handleAddToCart(product.id)}
                            disabled={addingToCart[product.id]}
                          >
                            <ShoppingCart size={16} />
                            <span>
                              {addingToCart[product.id] ? 'Adding...' : 'Add to Cart'}
                            </span>
                          </button>

                          <button
                            className={`${styles.mobileWishlistButton} ${isInWishlistStatus ? styles.mobileWishlistActive : ''}`}
                            onClick={() => handleWishlistToggle(product.id)}
                          >
                            <Heart size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation arrows */}
        <button 
          className={`${styles.mobileCarouselNav} ${styles.mobileCarouselPrev}`}
          onClick={goToPrevious}
          disabled={currentIndex === 0 || isTransitioning}
        >
          <ChevronLeft size={20} />
        </button>

        <button 
          className={`${styles.mobileCarouselNav} ${styles.mobileCarouselNext}`}
          onClick={goToNext}
          disabled={currentIndex === products.length - 1 || isTransitioning}
        >
          <ChevronRight size={20} />
        </button>

        {/* Pagination dots */}
        <div className={styles.mobileCarouselPagination}>
          {products.map((_, index) => (
            <button
              key={index}
              className={`${styles.mobileCarouselDot} ${index === currentIndex ? styles.mobileCarouselDotActive : ''}`}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default BestSellersSection
