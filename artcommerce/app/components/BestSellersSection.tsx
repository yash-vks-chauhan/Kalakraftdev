'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Play, Pause, Plus, Share2 } from 'lucide-react'

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
  const [isPaused, setIsPaused] = useState(false)
  
  // Action wheel states
  const [expandedWheel, setExpandedWheel] = useState<string | null>(null)
  
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

  // Simple infinite scroll navigation
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
  };

  // Auto-play functionality with proper cleanup
  const startAutoPlay = useCallback(() => {
    if (!isAutoPlaying || products.length <= 1) return
    
    // Clear any existing timeout first
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current)
      autoPlayRef.current = null
    }
    
    autoPlayRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length)
    }, autoPlaySpeed)
  }, [isAutoPlaying, products.length, autoPlaySpeed])

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

  // Handle pause on interaction
  const handleInteractionStart = () => {
    setIsPaused(true)
    stopAutoPlay()
  }

  const handleInteractionEnd = () => {
    setIsPaused(false)
    if (isAutoPlaying) {
      setTimeout(() => {
        if (isAutoPlaying && !isPaused) {
          startAutoPlay()
        }
      }, 1000)
    }
  }

  // Auto-play effect - simplified dependencies
  useEffect(() => {
    if (isAutoPlaying && products.length > 1) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => stopAutoPlay()
  }, [currentIndex, isAutoPlaying, products.length, startAutoPlay, stopAutoPlay])

  // Pause auto-play on user interaction and visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoPlay()
      } else if (isAutoPlaying && products.length > 1) {
        // Add a small delay before restarting when tab becomes visible
        setTimeout(() => {
          if (isAutoPlaying && !document.hidden) {
            startAutoPlay()
          }
        }, 500)
      }
    }

    const handleFocus = () => {
      if (isAutoPlaying && products.length > 1) {
        startAutoPlay()
      }
    }

    const handleBlur = () => {
      stopAutoPlay()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isAutoPlaying, products.length, startAutoPlay, stopAutoPlay])

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

  // Initialize auto-play when products are loaded
  useEffect(() => {
    if (products.length > 1 && isAutoPlaying && !loading) {
      // Small delay to ensure component is fully rendered
      const initTimer = setTimeout(() => {
        startAutoPlay()
      }, 1000)
      
      return () => clearTimeout(initTimer)
    }
  }, [products.length, isAutoPlaying, loading, startAutoPlay])

  // Reset progress animation when slide changes
  useEffect(() => {
    // Force re-render of progress capsules to reset animation
    const progressElements = document.querySelectorAll(`.${styles.mobileProgressCapsuleActive} .${styles.mobileProgressFill}`)
    progressElements.forEach((element) => {
      const htmlElement = element as HTMLElement
      htmlElement.style.animation = 'none'
      htmlElement.offsetHeight // Trigger reflow
      htmlElement.style.animation = ''
    })
  }, [currentIndex])

  // Close action wheel when slide changes
  useEffect(() => {
    setExpandedWheel(null)
  }, [currentIndex])

  // Close action wheel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedWheel(null)
      }
    }

    if (expandedWheel) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [expandedWheel])

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
    startTime.current = Date.now()
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
    const endTime = Date.now()
    const touchTime = endTime - startTime.current
    
    // Reset drag offset with animation
    setDragOffset(0)
    
    // Determine if swipe is significant enough (minimum 50px or fast swipe)
    const swipeThreshold = 50
    const isQuickSwipe = touchTime < 300 && Math.abs(deltaX) > 30
    const shouldSwipeLeft = deltaX < -swipeThreshold || (isQuickSwipe && deltaX < 0)
    const shouldSwipeRight = deltaX > swipeThreshold || (isQuickSwipe && deltaX > 0)
    
    if (shouldSwipeLeft) {
      goToNext()
    } else if (shouldSwipeRight) {
      goToPrevious()
    }
    
    // Resume auto-play after touch interaction with a longer delay
    if (isAutoPlaying) {
      setTimeout(() => {
        if (isAutoPlaying) { // Check again in case it was toggled
          startAutoPlay()
        }
      }, 2000) // Longer delay to prevent immediate restart
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
        setTimeout(() => {
          if (isAutoPlaying) {
            startAutoPlay()
          }
        }, 2000) // Resume auto-play after longer delay
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

  // Action wheel functions
  const toggleActionWheel = (productId: string) => {
    setExpandedWheel(expandedWheel === productId ? null : productId)
  }

  const handleWheelAction = async (action: 'cart' | 'wishlist' | 'share', productId: string) => {
    setExpandedWheel(null) // Close wheel after action
    
    switch (action) {
      case 'cart':
        await handleAddToCart(productId)
        break
      case 'wishlist':
        await handleWishlistToggle(productId)
        break
      case 'share':
        handleShare(productId)
        break
    }
  }

  const handleShare = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const shareData = {
      title: product.name,
      text: `Check out this amazing ${product.name}`,
      url: `${window.location.origin}/products/${productId}`
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error)
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareData.url).then(() => {
        // You could show a toast notification here
        console.log('Link copied to clipboard')
      }).catch(console.error)
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
                    <div className={styles.mobileSkeletonStock}></div>
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
        <div 
          className={styles.mobileCarouselContainer}
          onTouchStart={(e) => {
            handleInteractionStart()
            handleTouchStart(e)
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => {
            handleTouchEnd(e)
            handleInteractionEnd()
          }}
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
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
                    transition: isDragging.current ? 'none' : 'transform 0.25s ease'
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
                        {/* Product Info Section */}
                        <div className={styles.mobileProductInfo}>
                          <div className={styles.mobileProductMeta}>
                            {/* Product Category */}
                            {product.category && (
                              <span className={styles.mobileProductCategory}>
                                {product.category.name}
                              </span>
                            )}
                            
                            {/* Product Name */}
                            <Link href={`/products/${product.id}`}>
                              <h3 className={styles.mobileProductName}>
                                {product.name}
                              </h3>
                            </Link>
                          </div>
                          
                          {/* Product Price */}
                          <p className={styles.mobileProductPrice}>
                            {formatPrice(product.price)}
                          </p>

                          {/* Stock Information */}
                          {product.stockQuantity !== undefined && (
                            <div className={styles.mobileProductStockInfo}>
                              <span 
                                className={`${styles.mobileStockIndicator} ${
                                  product.stockQuantity === 0 
                                    ? styles.mobileStockOutOfStock
                                    : product.stockQuantity <= 5 
                                      ? styles.mobileStockLowStock 
                                      : styles.mobileStockInStock
                                }`}
                              >
                                {product.stockQuantity === 0 
                                  ? 'Out of Stock'
                                  : product.stockQuantity <= 5 
                                    ? `Only ${product.stockQuantity} left`
                                    : 'In Stock'
                                }
                              </span>
                            </div>
                          )}
                        </div>



                        {/* Rotating Action Wheel */}
                        <div className={styles.mobileActionWheel}>
                          {/* Backdrop for closing menu */}
                          {expandedWheel === product.id && (
                            <div 
                              className={`${styles.mobileActionWheelBackdrop} ${styles.mobileActionWheelBackdropVisible}`}
                              onClick={() => setExpandedWheel(null)}
                            />
                          )}
                          
                          {/* Main Action Button */}
                          <button
                            className={`${styles.mobileActionWheelMain} ${
                              expandedWheel === product.id ? styles.mobileActionWheelExpanded : ''
                            }`}
                            onClick={() => toggleActionWheel(product.id)}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <Plus 
                              size={20} 
                              className={`${styles.mobileActionWheelIcon} ${
                                expandedWheel === product.id ? styles.mobileActionWheelIconExpanded : ''
                              }`}
                            />
                          </button>

                          {/* Action Buttons */}
                          <div className={expandedWheel === product.id ? styles.mobileActionWheelExpanded : ''}>
                            {/* Cart Action */}
                            <button
                              className={`${styles.mobileActionWheelButton} ${styles.mobileActionWheelCart}`}
                              onClick={() => handleWheelAction('cart', product.id)}
                              disabled={addingToCart[product.id] || product.stockQuantity === 0}
                              title="Add to Cart"
                              aria-label="Add to Cart"
                            >
                              <ShoppingCart size={16} />
                            </button>

                            {/* Wishlist Action */}
                            <button
                              className={`${styles.mobileActionWheelButton} ${styles.mobileActionWheelWishlist} ${
                                isInWishlistStatus ? styles.mobileActionWheelWishlistActive : ''
                              }`}
                              onClick={() => handleWheelAction('wishlist', product.id)}
                              title={isInWishlistStatus ? 'Remove from Wishlist' : 'Add to Wishlist'}
                              aria-label={isInWishlistStatus ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                              <Heart size={16} fill={isInWishlistStatus ? 'currentColor' : 'none'} />
                            </button>

                            {/* Share Action */}
                            <button
                              className={`${styles.mobileActionWheelButton} ${styles.mobileActionWheelShare}`}
                              onClick={() => handleWheelAction('share', product.id)}
                              title="Share Product"
                              aria-label="Share Product"
                            >
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        {products.length > 1 && (
          <div className={styles.mobileCarouselBottomNav}>
            {/* Left Side - Previous Arrow */}
            <div className={styles.mobileBottomNavLeft}>
              <button 
                className={styles.mobileBottomNavArrow}
                onClick={() => {
                  stopAutoPlay()
                  goToPrevious()
                  if (isAutoPlaying) {
                    setTimeout(() => {
                      if (isAutoPlaying) {
                        startAutoPlay()
                      }
                    }, 1500)
                  }
                }}
                disabled={isTransitioning}
                title="Previous slide"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Center - Progress Capsules */}
            <div className={styles.mobileBottomNavCenter}>
              {products.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.mobileProgressCapsule} ${
                    index === currentIndex 
                      ? `${styles.mobileProgressCapsuleActive} ${!isAutoPlaying || isPaused ? styles.paused : ''}` 
                      : index < currentIndex 
                        ? styles.mobileProgressCapsuleCompleted 
                        : ''
                  }`}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  title={`Go to slide ${index + 1}`}
                  aria-label={`Go to slide ${index + 1} of ${products.length}`}
                >
                  <div className={styles.mobileProgressFill}></div>
                </button>
              ))}
            </div>

            {/* Right Side - Next Arrow & Auto-play Toggle */}
            <div className={styles.mobileBottomNavRight}>
              <button 
                className={styles.mobileBottomNavArrow}
                onClick={() => {
                  stopAutoPlay()
                  goToNext()
                  if (isAutoPlaying) {
                    setTimeout(() => {
                      if (isAutoPlaying) {
                        startAutoPlay()
                      }
                    }, 1500)
                  }
                }}
                disabled={isTransitioning}
                title="Next slide"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
              
              <button 
                className={`${styles.mobileBottomNavAutoPlay} ${isAutoPlaying ? styles.mobileBottomNavAutoPlayActive : ''}`}
                onClick={toggleAutoPlay}
                title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
                aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
              >
                {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

export default BestSellersSection
