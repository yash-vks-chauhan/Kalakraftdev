'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

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
  const [gapSize, setGapSize] = useState(2) // Default gap in rem
  
  // Auto-play states
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [autoPlaySpeed] = useState(5000) // 5 seconds for more elegant timing
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  
  // Image loading states
  const [imageLoadStates, setImageLoadStates] = useState<{ [key: string]: 'loading' | 'loaded' | 'error' }>({})
  
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

  // Image loading handlers
  const handleImageLoad = (productId: string) => {
    setImageLoadStates(prev => ({ ...prev, [productId]: 'loaded' }))
  }

  const handleImageError = (productId: string) => {
    setImageLoadStates(prev => ({ ...prev, [productId]: 'error' }))
  }

  // Enhanced infinite scroll navigation with smoother transitions
  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev + 1) % products.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning, products.length])

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev - 1 + products.length) % products.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning, products.length])

  // Auto-play functionality with explicit direction
  const startAutoPlay = useCallback(() => {
    if (!isAutoPlaying || products.length <= 1) return
    
    autoPlayRef.current = setTimeout(() => {
      goToNext() // Use the goToNext function for consistency
    }, autoPlaySpeed)
  }, [isAutoPlaying, products.length, autoPlaySpeed, goToNext])

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }, [])

  // Toggle auto-play
  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev)
  }

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && products.length > 1) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => stopAutoPlay()
  }, [currentIndex, isAutoPlaying, startAutoPlay, stopAutoPlay, products.length])

  // Pause auto-play on user interaction
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoPlay()
      } else if (isAutoPlaying) {
        startAutoPlay()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay])

  // Initialize image loading states
  useEffect(() => {
    const initialStates: { [key: string]: 'loading' | 'loaded' | 'error' } = {}
    products.forEach(product => {
      initialStates[product.id] = 'loading'
    })
    setImageLoadStates(initialStates)
  }, [products])

  // Update gap size based on screen width
  useEffect(() => {
    const updateGapSize = () => {
      setGapSize(window.innerWidth <= 480 ? 1 : 2)
    }
    
    updateGapSize()
    window.addEventListener('resize', updateGapSize)
    
    return () => window.removeEventListener('resize', updateGapSize)
  }, [])

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
    
    // Pause auto-play during touch interaction
    stopAutoPlay()
    
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    currentX.current = touch.clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current
    
    // Only handle horizontal swipes (prevent interfering with vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault()
      
      // Apply drag offset with rubber band effect (no boundaries for infinite scroll)
      setDragOffset(deltaX)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    
    isDragging.current = false
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    
    // Reset drag offset with animation
    setDragOffset(0)
    
    // Determine if swipe is significant enough (minimum 60px)
    const swipeThreshold = 60
    const shouldSwipeLeft = deltaX < -swipeThreshold
    const shouldSwipeRight = deltaX > swipeThreshold
    
    if (shouldSwipeLeft) {
      goToNext()
    } else if (shouldSwipeRight) {
      goToPrevious()
    }
    
    // Resume auto-play after touch interaction
    if (isAutoPlaying) {
      setTimeout(startAutoPlay, 1000) // Delay restart
    }
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    stopAutoPlay() // Pause auto-play on manual navigation
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => {
      setIsTransitioning(false)
      if (isAutoPlaying) {
        setTimeout(startAutoPlay, 1500) // Resume auto-play after delay
      }
    }, 600)
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
        
        {/* Desktop Skeleton */}
        <div className={`${styles.bestSellersDesktop} ${styles.desktopOnly}`}>
          {[...Array(4)].map((_, index) => (
            <div key={index} className={styles.bestSellerCardSkeleton}>
              <div className={styles.skeletonImage}></div>
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonPrice}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Skeleton */}
        <div className={`${styles.bestSellersMobileCarousel} ${styles.mobileOnly}`}>
          <div className={styles.mobileCarouselContainer}>
            <div className={styles.mobileCarouselWrapper}>
              <div className={styles.mobileCarouselSlide}>
                <div className={styles.mobileProductCardSkeleton}>
                  <div className={styles.mobileSkeletonImageSection}>
                    <div className={styles.mobileSkeletonImage}></div>
                  </div>
                  <div className={styles.mobileSkeletonDetailsSection}>
                    <div className={styles.mobileSkeletonCategory}></div>
                    <div className={styles.mobileSkeletonTitle}></div>
                    <div className={styles.mobileSkeletonPrice}></div>
                    <div className={styles.mobileSkeletonActions}>
                      <div className={styles.mobileSkeletonButton}></div>
                      <div className={styles.mobileSkeletonWishlist}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.bestSellersSection} data-aos="fade-up">
        <div className={styles.sectionHeader} data-aos="fade-up">
          <div className={styles.headerLine}></div>
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <div className={styles.headerLine}></div>
        </div>
        <div className={styles.bestSellersError}>
          <div className={styles.errorContent}>
            <p>Unable to load best sellers at the moment.</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) {
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
                {imageLoadStates[product.id] === 'loading' && (
                  <div className={styles.imageLoadingSkeleton}></div>
                )}
                <img 
                  src={product.imageUrls[0] || 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'} 
                  alt={product.name}
                  className={`${styles.bestSellerImage} ${imageLoadStates[product.id] === 'loaded' ? styles.imageLoaded : ''}`}
                  onLoad={() => handleImageLoad(product.id)}
                  onError={(e) => {
                    handleImageError(product.id)
                    e.currentTarget.src = 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'
                  }}
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
        {/* Auto-play Control */}
        {products.length > 1 && (
          <button 
            className={styles.autoPlayToggle}
            onClick={toggleAutoPlay}
            title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
          >
            {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}
        <div 
          className={styles.mobileCarouselContainer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.mobileCarouselWrapper}>
            {products.map((product, index) => {
              const isInWishlistStatus = isInWishlist(Number(product.id))
              
              return (
                <div 
                  key={product.id} 
                  className={styles.mobileCarouselSlide}
                  style={{
                    transform: `translateX(calc(${(index - currentIndex) * 100}vw + ${(index - currentIndex) * gapSize}rem + ${dragOffset}px))`,
                    transition: isDragging.current ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform'
                  }}
                >
                  <div className={styles.mobileProductCard}>
                    {/* Left side - Product Image */}
                    <div className={styles.mobileProductImageSection}>
                      <Link href={`/products/${product.id}`} className={styles.mobileImageLink}>
                        <div className={styles.mobileProductImageContainer}>
                          {imageLoadStates[product.id] === 'loading' && (
                            <div className={styles.mobileImageLoadingSkeleton}></div>
                          )}
                          <img
                            src={product.imageUrls[0] || 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'}
                            alt={product.name}
                            className={`${styles.mobileProductImage} ${imageLoadStates[product.id] === 'loaded' ? styles.mobileImageLoaded : ''}`}
                            onLoad={() => handleImageLoad(product.id)}
                            onError={(e) => {
                              handleImageError(product.id)
                              e.currentTarget.src = 'https://placehold.co/300x300/f0f0f0/888?text=No+Image'
                            }}
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
          onClick={() => {
            stopAutoPlay()
            goToPrevious()
            if (isAutoPlaying) {
              setTimeout(startAutoPlay, 1000)
            }
          }}
          disabled={isTransitioning}
        >
          <ChevronLeft size={20} />
        </button>

        <button 
          className={`${styles.mobileCarouselNav} ${styles.mobileCarouselNext}`}
          onClick={() => {
            stopAutoPlay()
            goToNext()
            if (isAutoPlaying) {
              setTimeout(startAutoPlay, 1000)
            }
          }}
          disabled={isTransitioning}
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
