'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import { auth } from '../lib/firebase-client'

import { onAuthStateChanged } from 'firebase/auth'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './home.module.css'
import { getImageUrl } from '../lib/cloudinaryImages'
import Link from 'next/link'
import MobileVideoSection from './components/MobileVideoSection';

// Add this to detect mobile view
const isMobileView = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 1024;
};

// Featured Products Grid Component
const FeaturedProductsGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageIndices, setImageIndices] = useState({});

  // Format price function
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price);
  };

  // Product Card Component (similar to ProductsMobileClient)
  const ProductCard = ({ product }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const handleImageTap = (e) => {
      e.preventDefault();
      if (product.imageUrls && product.imageUrls.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
      }
    };

    // Format stock status
    const getStockStatus = () => {
      if (product.stockQuantity <= 0) return "Out of Stock";
      if (product.stockQuantity <= 5) return "Low Stock";
      return "In Stock";
    };

    // Check if product is new (within 14 days)
    const isNewProduct = () => {
      if (!product.createdAt) return false;
      const createdDate = new Date(product.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    };

    return (
      <Link href={`/products/${product.id}`} className={styles.mobileFeaturedCard}>
        <div className={styles.mobileFeaturedCardInner}>
          <div 
            className={styles.mobileFeaturedImageContainer}
            onClick={handleImageTap}
          >
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <img
                src={product.imageUrls[currentImageIndex]}
                alt={product.name}
                className={styles.mobileFeaturedImage}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x300/f0f0f0/888?text=No+Image')}
              />
            ) : (
              <div className={styles.mobileFeaturedNoImage}>No Image</div>
            )}
            
            {/* Stock badges */}
            {product.stockQuantity === 0 && (
              <div className={`${styles.mobileFeaturedBadge} ${styles.mobileFeaturedOutOfStock}`}>
                Out of Stock
              </div>
            )}
            
            {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
              <div className={`${styles.mobileFeaturedBadge} ${styles.mobileFeaturedLowStock}`}>
                Only {product.stockQuantity} left
              </div>
            )}

            {isNewProduct() && product.stockQuantity > 0 && (
              <div className={`${styles.mobileFeaturedBadge} ${styles.mobileFeaturedNew}`}
                   style={{ top: product.stockQuantity <= 5 ? '40px' : '10px' }}>
                New
              </div>
            )}
            
            {/* Image indicators */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className={styles.mobileFeaturedImageIndicators}>
                {product.imageUrls.map((_, index) => (
                  <div 
                    key={index} 
                    className={`${styles.mobileFeaturedIndicator} ${
                      index === currentImageIndex ? styles.mobileFeaturedActiveIndicator : ''
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Quick action buttons */}
            <div className={styles.mobileFeaturedQuickActions}>
              <button 
                className={styles.mobileFeaturedActionButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Wishlist functionality would go here
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            </div>

            {/* Product details overlay */}
            <div className={styles.mobileFeaturedDetails}>
              <div className={styles.mobileFeaturedDetailsContent}>
                <div className={styles.mobileFeaturedDetailRow}>
                  <span className={styles.mobileFeaturedDetailLabel}>Status</span>
                  <span className={styles.mobileFeaturedDetailValue}>{getStockStatus()}</span>
                </div>
                {product.material && (
                  <div className={styles.mobileFeaturedDetailRow}>
                    <span className={styles.mobileFeaturedDetailLabel}>Material</span>
                    <span className={styles.mobileFeaturedDetailValue}>{product.material}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className={styles.mobileFeaturedDetailRow}>
                    <span className={styles.mobileFeaturedDetailLabel}>Dimensions</span>
                    <span className={styles.mobileFeaturedDetailValue}>{product.dimensions}</span>
                  </div>
                )}
                <div className={styles.mobileFeaturedViewButton}>
                  View Details
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.mobileFeaturedCardInfo}>
            {product.category && (
              <div className={styles.mobileFeaturedCategory}>
                {product.category.name}
              </div>
            )}
            <h3 className={styles.mobileFeaturedProductName}>{product.name}</h3>
            <div className={styles.mobileFeaturedPriceRow}>
              <p className={styles.mobileFeaturedPrice}>{formatPrice(product.price)}</p>
              {product.avgRating > 0 && (
                <p className={styles.mobileFeaturedRating}>
                  <span className={styles.mobileFeaturedStarFilled}>★</span>
                  <span className={styles.mobileFeaturedRatingValue}>{product.avgRating.toFixed(1)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Fetch products and randomize
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products...');
        const response = await fetch('/api/products');
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.products && Array.isArray(data.products)) {
          // Normalize imageUrls and filter active products
          const normalizedProducts = data.products
            .filter(p => p.isActive && p.stockQuantity >= 0)
            .map(p => {
              let imageUrls = [];
              try {
                imageUrls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]');
              } catch {
                imageUrls = [];
              }
              return { ...p, imageUrls };
            });
          
          // Shuffle and take 4 random products
          const shuffled = [...normalizedProducts].sort(() => Math.random() - 0.5);
          console.log('Processed products:', shuffled.slice(0, 4));
          setProducts(shuffled.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className={styles.mobileFeaturedLoading}>
        <div className={styles.mobileFeaturedLoadingSpinner}></div>
        <p>Loading featured products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mobileFeaturedError}>
        <p>Unable to load featured products</p>
      </div>
    );
  }

  // Add fallback for when there are no products
  if (!products || products.length === 0) {
    return (
      <div className={styles.mobileFeaturedProductsGrid}>
        {[1, 2, 3, 4].map((_, index) => (
          <div key={index} className={styles.mobileFeaturedCard}>
            <div className={styles.mobileFeaturedCardInner}>
              <div className={styles.mobileFeaturedImageContainer}>
                <div className={styles.mobileFeaturedNoImage}>Product {index + 1}</div>
              </div>
              <div className={styles.mobileFeaturedCardInfo}>
                <h3 className={styles.mobileFeaturedProductName}>Sample Product</h3>
                <p className={styles.mobileFeaturedPrice}>{formatPrice(1200)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.mobileFeaturedProductsGrid}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// Mobile Featured Carousel Component - Optimized for Smooth Performance
const MobileFeaturedCarousel = ({ products = [] }) => {
  // Simplified state for better performance
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef(null);
  const startPos = useRef(0);
  const lastPos = useRef(0);
  const startTime = useRef(0);
  const lastManualChange = useRef(Date.now());
  
  // Format price to INR
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Always ensure we have exactly 8 products for the circular carousel
  const defaultProducts = [
    {
      id: '1',
      name: 'Handcrafted Resin Clock',
      price: 4999,
      imageUrls: ['/images/featured1.png', '/images/category1.png'],
      stockQuantity: 5,
      isNew: true,
      category: { name: 'Clocks' }
    },
    {
      id: '2',
      name: 'Decorative Wall Piece',
      price: 3499,
      imageUrls: ['/images/featured2.png', '/images/category2.png'],
      stockQuantity: 8,
      category: { name: 'Wall Decor' }
    },
    {
      id: '3',
      name: 'Resin Tray Set',
      price: 2999,
      imageUrls: ['/images/featured3.JPG', '/images/category3.png'],
      stockQuantity: 3,
      category: { name: 'Trays' }
    },
    {
      id: '4',
      name: 'Designer Flower Vase',
      price: 1999,
      imageUrls: ['/images/category4.png', '/images/category5.png'],
      stockQuantity: 0,
      category: { name: 'Decor' }
    },
    {
      id: '5',
      name: 'Artistic Coaster Set',
      price: 1499,
      imageUrls: ['/images/category1.png', '/images/category6.png'],
      stockQuantity: 12,
      category: { name: 'Coasters' }
    },
    {
      id: '6',
      name: 'Resin Wall Art',
      price: 5999,
      imageUrls: ['/images/category2.png', '/images/category7.png'],
      stockQuantity: 2,
      category: { name: 'Wall Art' }
    },
    {
      id: '7',
      name: 'Jewelry Tray',
      price: 2499,
      imageUrls: ['/images/category3.png', '/images/category8.png'],
      stockQuantity: 7,
      category: { name: 'Trays' }
    },
    {
      id: '8',
      name: 'Custom Resin Piece',
      price: 7999,
      imageUrls: ['/images/category4.png', '/images/category1.png'],
      stockQuantity: 1,
      isNew: true,
      category: { name: 'Custom' }
    }
  ];

  // Memoize displayProducts so it doesn't reshuffle on every render
  const displayProducts = useMemo(() => {
    if (products.length >= 8) {
      return [...products].sort(() => Math.random() - 0.5).slice(0, 8);
    } else if (products.length > 0) {
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      let arr = [...shuffled];
      while (arr.length < 8) {
        arr = [...arr, ...shuffled];
      }
      return arr.slice(0, 8);
    } else {
      return defaultProducts;
    }
  }, [products]);
  // Completely disable any autoplay functionality
  const autoplayTimerRef = useRef(null);
  
  // Clear any potential autoplay timers on component mount/unmount
  useEffect(() => {
    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, []);

  // Prevent any unexpected currentIndex changes
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastManual = now - lastManualChange.current;
    
    // If currentIndex changed but it wasn't from a manual action (within last 500ms), reset it
    if (timeSinceLastManual > 500) {
      console.warn('Prevented potential autoplay: currentIndex changed without user action');
      // Don't auto-correct as it might cause infinite loops
    }
  }, [currentIndex]);

  // Buttery smooth rubber band effect
  const applyRubberBand = (offset) => {
    const maxDrag = 160; // Slightly more range for ultra-smooth feel
    if (Math.abs(offset) <= maxDrag) return offset;
    
    const excess = Math.abs(offset) - maxDrag;
    const damped = maxDrag + excess * 0.12; // Even less resistance for smoothness
    return offset > 0 ? damped : -damped;
  };

  // Simple transition management
  const startTransition = () => {
    setIsTransitioning(true);
  };

  const endTransition = () => {
    setIsTransitioning(false);
  };
  
  // Ultra-immediate touch response
  const handleTouchStart = (e) => {
    // Don't start new drag if transitioning
    if (isTransitioning) return;
    
    setIsDragging(true);
    startPos.current = e.touches[0].clientX;
    lastPos.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setDragOffset(0);
    
    // Prevent any delays or conflicts
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging || isTransitioning) return;
    
    const currentPos = e.touches[0].clientX;
    const rawOffset = currentPos - startPos.current;
    
    // Apply ultra-responsive rubber band
    const constrainedOffset = applyRubberBand(rawOffset);
    
    lastPos.current = currentPos;
    setDragOffset(constrainedOffset);
    
    // Prevent scrolling and improve responsiveness
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const totalDistance = lastPos.current - startPos.current;
    const swipeTime = Date.now() - startTime.current;
    const velocity = Math.abs(totalDistance) / swipeTime; // pixels per ms
    
    const threshold = 25; // Ultra responsive
    const quickSwipeThreshold = 0.3; // pixels per ms - very sensitive
    
    // Determine if we should change cards - ultra responsive
    const shouldNext = totalDistance < -threshold || 
                      (totalDistance < -10 && velocity > quickSwipeThreshold);
    const shouldPrev = totalDistance > threshold || 
                      (totalDistance > 10 && velocity > quickSwipeThreshold);
    
    if (shouldNext || shouldPrev) {
      startTransition();
      
      if (shouldNext) {
        lastManualChange.current = Date.now();
        setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
      } else {
        lastManualChange.current = Date.now();
        setCurrentIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
      }
      
      // Instant transition
      setDragOffset(0);
      setIsDragging(false);
      
      setTimeout(() => {
        endTransition();
      }, 300);
          } else {
        // Return to center instantly
        setDragOffset(0);
        setTimeout(() => {
          setIsDragging(false);
        }, 100);
      }
  };

  // Navigate to specific card - instant response
  const goToCard = (index) => {
    if (index === currentIndex || isTransitioning) return;
    
    // Stop any ongoing drag
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
    
    startTransition();
    lastManualChange.current = Date.now();
    setCurrentIndex(index);
    
    setTimeout(() => {
      endTransition();
    }, 300);
  };
  
  // Circular 3D carousel styling - creates a ring of cards
  const getCardStyle = (index) => {
    const totalCards = 8; // Always 8 cards in the ring
    let position = index - currentIndex;
    if (position < 0) position += totalCards;
    if (position >= totalCards) position -= totalCards;
    
    // Calculate angle for circular positioning (360° / 8 cards = 45° per card)
    const angle = (position * 360) / totalCards;
    const angleRad = (angle * Math.PI) / 180;
    
    // Radius of the circle (distance from center)
    const radius = 180;
    
    // Calculate 3D position in the circle
    const x = Math.sin(angleRad) * radius;
    const z = Math.cos(angleRad) * radius;
    const y = Math.abs(Math.sin(angleRad)) * 10; // Slight vertical movement for depth
    
         // Drag offset for the center card - ultra responsive
     let dragOffsetX = 0;
     let dragRotationY = 0;
     if (isDragging && position === 0) {
       dragOffsetX = dragOffset * 1.0; // Full responsiveness
       dragRotationY = dragOffset * 0.2; // More rotation feedback
     }
    
    const style: React.CSSProperties = {
      position: 'absolute',
      width: '280px',
      height: '420px',
      borderRadius: '8px',
      overflow: 'hidden',
      transformOrigin: 'center center',
      willChange: 'transform, opacity, filter',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)', // Force hardware acceleration
      cursor: position === 0 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      left: '50%',
      top: '50%',
      marginLeft: '-140px',
      marginTop: '-210px',
      contain: 'layout style paint',
    };
    
    // Silky smooth transitions - only animate transform and opacity
    if (isDragging && position === 0) {
      style.transition = 'none';
    } else if (isTransitioning) {
      style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease, filter 0.3s ease';
    } else {
      style.transition = 'transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.25s ease, filter 0.25s ease';
    }
    
    // Center card (current/active)
    if (position === 0) {
      style.transform = `translate3d(${dragOffsetX}px, 0px, 60px) rotateY(${dragRotationY}deg) scale3d(1, 1, 1)`;
      style.zIndex = 100;
      style.opacity = 1;
      style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.2), 0 15px 30px rgba(0, 0, 0, 0.15)';
      style.filter = 'brightness(1)';
    } else {
      // Cards arranged in a circle around the center
      const scale = 0.7 - (Math.abs(Math.sin(angleRad)) * 0.1); // Scale based on position
      const opacity = 0.4 + (Math.cos(angleRad) * 0.3); // More visible when closer to front
      const brightness = 0.7 + (Math.cos(angleRad) * 0.2); // Brighter when closer
      
      style.transform = `translate3d(${x}px, ${y}px, ${z - 100}px) rotateY(${-angle}deg) scale3d(${scale}, ${scale}, 1)`;
      style.zIndex = Math.round(50 + z); // Higher z-index for cards closer to front
      style.opacity = Math.max(0.3, opacity);
      style.boxShadow = `0 ${10 + z/10}px ${20 + z/5}px rgba(0, 0, 0, ${0.1 + (Math.cos(angleRad) * 0.1)})`;
      style.filter = `brightness(${brightness})`;
    }
    
    return style;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      <div 
        ref={carouselRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '540px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          zIndex: 3,
          perspective: '1200px',
          perspectiveOrigin: 'center center',
          transformStyle: 'preserve-3d',
          overflow: 'visible',
          willChange: 'auto',
          contain: 'layout style',
          // Explicitly disable any inherited animations
          animation: 'none !important',
          transition: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Prevent any CSS class inheritance that might cause autoplay
        className=""
      >
        {displayProducts.map((product, index) => (
          <div key={product.id} style={getCardStyle(index)}>
            <Link href={`/products/${product.id}`} style={{
              textDecoration: 'none',
              display: 'block',
              height: '100%',
              width: '100%',
              background: '#fff',
              color: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1/1.1',
                position: 'relative',
                overflow: 'hidden',
                background: '#f5f5f5',
              }}>
                <img 
                  src={product.imageUrls[0]} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
              
              <div style={{
                padding: '14px',
                background: '#fff',
                position: 'relative',
                minHeight: '80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}>
                {product.category && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#666',
                    marginBottom: '6px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {product.category.name}
                  </div>
                )}
                
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  margin: '0 0 8px 0',
                  lineHeight: 1.3,
                  color: '#000',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </h3>
                
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#000',
                  marginTop: 'auto',
                }}>
                  {formatPrice(product.price)}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Simplified navigation */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '10px',
      }}>
        {/* Progress bar */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '2px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '1px',
          overflow: 'hidden',
        }}>
                  <div style={{
          width: `${((currentIndex + 1) / 8) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #000, #333)',
          transition: 'width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }} />
        </div>

        {/* Dot indicators */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '25px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}>
          {displayProducts.map((_, index) => (
            <button 
              key={index} 
              onClick={() => goToCard(index)}
              disabled={isTransitioning || isDragging}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex 
                  ? 'linear-gradient(135deg, #000 0%, #333 100%)' 
                  : 'rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
                boxShadow: index === currentIndex 
                  ? '0 3px 12px rgba(0, 0, 0, 0.3)' 
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: (isTransitioning || isDragging) ? 'not-allowed' : 'pointer',
                opacity: (isTransitioning || isDragging) ? 0.6 : 1,
              }}
            />
          ))}
        </div>

        {/* Card counter */}
        <div style={{
          position: 'absolute',
          bottom: '-35px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.7rem',
          color: '#666',
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}>
          {currentIndex + 1} of 8
        </div>
      </div>
    </div>
  );
};

export default function Home() {

const [message, setMessage] = useState<string|null>(null)
const [featuredProducts, setFeaturedProducts] = useState([]);

// Adjust the typing speed parameters to be slower
const [rotatingText, setRotatingText] = useState('coasters')
const [displayText, setDisplayText] = useState('')
const [isTyping, setIsTyping] = useState(true)
const [currentWordIndex, setCurrentWordIndex] = useState(0)
const words = ['coasters', 'wall art', 'home decor', 'custom pieces']
const typingSpeed = 180 // milliseconds per character (slower typing)
const deletingSpeed = 100 // milliseconds per character (slower deletion)
const pauseBeforeTyping = 800 // longer pause before typing a new word
const pauseBeforeDeletion = 2500 // longer pause before deleting the word

const carouselTrackRef = useRef<HTMLDivElement>(null)

const [isManualNav, setIsManualNav] = useState(false)

const [slidePosition, setSlidePosition] = useState(0)

const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)



// Product categories for the grid - expanded with more items

const productCategories = [

{

image: getImageUrl('imagecollection1.png'),

title: 'COASTERS',

alt: 'Handcrafted resin coasters'

},

{

image: getImageUrl('imageclock.png'),

title: 'WALL ART',

alt: 'Resin wall art pieces'

},

{

image: getImageUrl('imagecollection99.png'),

title: 'HOME DECOR',

alt: 'Decorative resin items'

},

{

image: getImageUrl('collectionwall.png'),

title: 'CUSTOM PIECES',

alt: 'Custom resin artwork'

},

{

image: getImageUrl('category1.png'),

title: 'CLOCKS',

alt: 'Handcrafted resin clocks'

},

{

image: getImageUrl('trayscollection.png'),

title: 'JEWELRY TRAYS',

alt: 'Elegant resin jewelry trays'

},

{

image: getImageUrl('vases.png'),

title: 'VASES',

alt: 'Decorative resin vases'

},

{

image: getImageUrl('category4.png'),

title: 'TRAYS',

alt: 'Stylish resin serving trays'

}

]



useEffect(() => {

const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {

if (!fbUser) {

setMessage('Not signed in')

return

}

// Get fresh ID token

const idToken = await fbUser.getIdToken()



// Call your protected API

const res = await fetch('/api/secure/hello', {

headers: { Authorization: `Bearer ${idToken}` },

})

if (res.ok) {

const json = await res.json()

setMessage(json.message || json.error)

} else {

console.error('Failed to fetch secure data:', res.status)

// Optional: Set a message to indicate the failure

// setMessage('Could not authenticate with server.');

}

})



return () => unsubscribe()

}, [])



useEffect(() => {

// Add required fonts

const fonts = [

'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap',

'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap'

]



const links = fonts.map(font => {

const link = document.createElement('link')

link.href = font

link.rel = 'stylesheet'

document.head.appendChild(link)

return link

})



// Smooth scroll to content when clicking the scroll indicator

const handleScrollClick = () => {

window.scrollTo({

top: window.innerHeight,

behavior: 'smooth'

})

}



const scrollIndicator = document.querySelector(`.${styles.scrollIndicator}`)

scrollIndicator?.addEventListener('click', handleScrollClick)



return () => {

links.forEach(link => document.head.removeChild(link))

scrollIndicator?.removeEventListener('click', handleScrollClick)

}

}, [])



useEffect(() => {
  let timer: NodeJS.Timeout;
  
  // Handle the typewriter effect
  if (isTyping) {
    // If we're typing and haven't completed the word
    if (displayText.length < words[currentWordIndex].length) {
      timer = setTimeout(() => {
        setDisplayText(words[currentWordIndex].substring(0, displayText.length + 1));
      }, typingSpeed);
    } 
    // If we've completed typing the word
    else {
      setIsTyping(false);
      timer = setTimeout(() => {
        setIsTyping(false);
      }, pauseBeforeDeletion);
    }
  } else {
    // If we're deleting and there's still text left
    if (displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(displayText.substring(0, displayText.length - 1));
      }, deletingSpeed);
    } 
    // If we've deleted all text
    else {
      setIsTyping(true);
      // Move to the next word
      setCurrentWordIndex((currentWordIndex + 1) % words.length);
      timer = setTimeout(() => {
        // Small delay before typing next word
      }, pauseBeforeTyping);
    }
  }
  
  // Update the main rotating text state for any components that use it
  setRotatingText(displayText);
  
  return () => clearTimeout(timer);
}, [displayText, isTyping, currentWordIndex])



// Handle carousel navigation

const handleCarouselNav = (direction: 'prev' | 'next') => {

if (!carouselTrackRef.current) return;



// If this is the first manual navigation, stop the auto-scrolling

if (!isManualNav) {

setIsManualNav(true);

}



// Clear any existing timer to reset the idle timeout

if (resumeTimerRef.current) {

clearTimeout(resumeTimerRef.current)

}



const cardWidth = 380; // Width of each card

const gap = 40; // Gap between cards (2.5rem)

const containerWidth = carouselTrackRef.current.parentElement?.clientWidth || 0;

const totalWidth = productCategories.length * (cardWidth + gap);



// Calculate the step size (one card width + gap)

const step = cardWidth + gap;



// Update the position based on direction

let newPosition = slidePosition;

if (direction === 'next') {

newPosition = Math.max(slidePosition - step, -totalWidth + containerWidth);

} else {

newPosition = Math.min(slidePosition + step, 0);

}



setSlidePosition(newPosition);



// Set a timer to resume auto-scrolling after 5 seconds of inactivity

resumeTimerRef.current = setTimeout(() => {

setIsManualNav(false)

}, 5000) // 5 seconds



// Apply the transform

carouselTrackRef.current.style.transform = `translateX(${newPosition}px)`;

}



// Cleanup timer on component unmount

useEffect(() => {

return () => {

if (resumeTimerRef.current) {

clearTimeout(resumeTimerRef.current)

}

}

}, [])



useEffect(() => {

AOS.init({

duration: 800,

once: true,

easing: 'ease-in-out',

})

}, [])



// Add this new useEffect for video loading
useEffect(() => {
  // Function to handle video loading
  const handleVideoLoading = () => {
    const videoElement = document.querySelector(`.${styles.videoBackground}`) as HTMLVideoElement;
    const fallbackImage = document.getElementById('videoFallback');
    
    if (videoElement && fallbackImage) {
      // Check if video loaded successfully
      videoElement.addEventListener('loadeddata', () => {
        // Video loaded successfully
        videoElement.style.display = 'block';
        fallbackImage.style.display = 'none';
      });
      
      videoElement.addEventListener('error', () => {
        // Video failed to load
        videoElement.style.display = 'none';
        fallbackImage.style.display = 'block';
      });
      
      // Force reload the video
      videoElement.load();
    }
  };
  
  // Small delay to ensure DOM is ready
  const timer = setTimeout(handleVideoLoading, 300);
  
  return () => clearTimeout(timer);
}, []);



// Fetch featured products for mobile carousel
useEffect(() => {
  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        // Get active products with stock and images
        let availableProducts = data.products
          .filter(p => p.isActive && p.imageUrls && p.imageUrls.length > 0)
          .map(p => ({
            ...p,
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
          }));
          
        // Ensure we always have exactly 8 products for the circular carousel
        if (availableProducts.length >= 8) {
          // Shuffle products randomly and take 8
          const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
          availableProducts = shuffled.slice(0, 8);
        } else if (availableProducts.length > 0) {
          // Shuffle available products first, then repeat to make 8
          const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
          availableProducts = [...shuffled];
          while (availableProducts.length < 8) {
            availableProducts = [...availableProducts, ...shuffled];
          }
          availableProducts = availableProducts.slice(0, 8);
        }
          
        setFeaturedProducts(availableProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  fetchFeaturedProducts();
}, []);



return (

<main data-page="home" style={{background: '#f8f8f8'}}>

<section className={`relative overflow-hidden ${styles.desktopOnly}`}>

<div className={styles.videoContainer}>
  {/* Video with fallback image */}
  <picture>
    {/* Fallback image that will be shown if video fails */}
    <img 
      src={getImageUrl('featured3.JPG')}
      alt="Handcrafted resin art" 
      className={styles.videoBackground}
      style={{ display: 'none' }}
      id="videoFallback"
    />
  </picture>

  <video
    className={styles.videoBackground}
    autoPlay
    loop
    muted
    playsInline
    preload="metadata"
    poster="/images/loading.png"
    onError={(e) => {
      // If video fails to load, show the fallback image
      const videoElement = e.currentTarget;
      videoElement.style.display = 'none';
      document.getElementById('videoFallback')!.style.display = 'block';
    }}
  >
    <source 
      src={process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_URL || '/images/homepage_video.mp4'} 
      type="video/mp4" 
    />
    Your browser does not support the video tag.
  </video>

  <div className={styles.overlay} />


<div className={styles.content}>

<div className={styles.headerText}>

<div className={styles.topText} data-aos="fade-in" data-aos-delay="200">A HANDCRAFTED ART STUDIO</div>

<img

src={getImageUrl('logo.png')}

alt="Kalakraft Logo"

className={styles.logo}

data-aos="fade-in"

data-aos-delay="400"

/>

<h1 className={styles.title} data-aos="fade-up" data-aos-delay="600">

Handcrafted resin art for <span id="rotator">{displayText}</span>

</h1>

{/* New button for "Discover All Pieces" - Desktop only */}
<div className={`${styles.buttonContainer} ${styles.desktopOnly}`} data-aos="fade-up" data-aos-delay="700">
  <Link href="/products" className={styles.discoverAllButton} prefetch={false}>
    <span className={styles.buttonText}>Discover All Pieces</span>
    <ChevronRight size={18} className={styles.buttonIcon} />
  </Link>
</div>

</div>


<div
  className={styles.scrollIndicator}
  onClick={() => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }}
/>

</div>

</div>

</section>



{/* Product Categories Grid Section */}

<section className={styles.productGridSection} data-aos="fade-up">

{/* Section Header with description */}

<div className={styles.sectionHeader} data-aos="fade-up">

<div className={styles.headerLine}></div>

<h2 className={styles.sectionTitle}>Our Collections</h2>

<div className={styles.headerLine}></div>

</div>


<div className={styles.collectionDescription} data-aos="fade-up" data-aos-delay="100">

<p>Discover our handcrafted resin art pieces, each one uniquely created with passion and precision. 
Our collections showcase the perfect blend of artistic expression and functional elegance, 
bringing the beauty of fluid art into your everyday life.</p>

</div>

<div className={styles.carouselContainer} data-aos="fade-up" data-aos-delay="200">

<div 

ref={carouselTrackRef}

className={`${styles.carouselTrack} ${isManualNav ? styles.manualNav : ''}`}

style={isManualNav ? { transform: `translateX(${slidePosition}px)` } : {}}

>

{/* First set of items */}

{productCategories.map((category, index) => (

<div

key={`original-${index}`}

className={styles.productCard}

style={{animationDelay: `${index * 0.15}s`}}

>

<div className={styles.cardInner}>

<img

src={category.image}

alt={category.alt}

className={styles.productImage}

// Add a fallback for broken images

onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}

/>

<div className={styles.cardOverlay}>

<button className={styles.viewAllButton}>Explore Collection</button>

</div>

<h3 className={styles.categoryTitle}>{category.title}</h3>

</div>

</div>

))}



{/* Duplicate set for seamless looping */}

{productCategories.map((category, index) => (

<div

key={`duplicate-${index}`}

className={styles.productCard}

style={{animationDelay: `${index * 0.15}s`}}

>

<div className={styles.cardInner}>

<img

src={category.image}

alt={category.alt}

className={styles.productImage}

// Add a fallback for broken images

onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}

/>

<div className={styles.cardOverlay}>

<button className={styles.viewAllButton}>Explore Collection</button>

</div>

<h3 className={styles.categoryTitle}>{category.title}</h3>

</div>

</div>

))}

</div>



{/* Navigation arrows */}

<div 

className={`${styles.carouselNav} ${styles.prevNav}`}

onClick={() => handleCarouselNav('prev')}

>

<ChevronLeft size={24} color="white" />

</div>

<div 

className={`${styles.carouselNav} ${styles.nextNav}`}

onClick={() => handleCarouselNav('next')}

>

<ChevronRight size={24} color="white" />

</div>

  </div>
  
  <div className={styles.collectionFooter} data-aos="fade-up" data-aos-delay="300">
    <p>Each piece tells a story through layers of color and texture, inviting you to bring the essence of artistic expression into your home.</p>
    <button className={styles.exploreAllButton}>View All Collections</button>
  </div>
  
  {/* Decorative elements */}
  <div className={styles.watercolorSplash}></div>
  <div className={styles.watercolorSplash2}></div>
  <div className={styles.inkSplash}></div>
  <div className={styles.lightEffect}></div>
  <div className={styles.brushAccent}></div>
  
  </section>
  
  {/* Mobile Video Section - Using the original component */}
  <MobileVideoSection />
  
  {/* Explore Our Artisan Creations section - Restored */}
  <section className={`${styles.mobileExploreSection} ${styles.mobileOnly}`} style={{ padding: '5rem 1.5rem 6rem' }}>
    {/* Architectural design elements */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '5px',
      background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)',
      zIndex: 2
    }}></div>
    
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '5px',
      background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)',
      zIndex: 2
    }}></div>

    <div className={styles.mobileExploreHeader}>
      <div className={styles.headerLine}></div>
      <h2 className={styles.mobileExploreTitle} style={{ 
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '2.2rem', 
        fontWeight: 300, 
        marginBottom: '1.5rem',
        letterSpacing: '0.05em',
        fontStyle: 'italic',
        color: '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        Explore Our Artisan Creations
      </h2>
      <div className={styles.headerLine}></div>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
        fontWeight: 300,
        color: 'rgba(255,255,255,0.7)',
        maxWidth: '300px',
        margin: '1.5rem auto 0',
        letterSpacing: '0.03em',
        lineHeight: 1.6
      }}>
        Discover our curated collection of handcrafted pieces
      </p>
    </div>

    <div className={styles.mobileExploreGrid}>
      {[
        {
          title: 'Artistic Journals',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752441188/84D2D636-027E-484D-B886-1BFEE0B9F5CD_1_201_a_ca4hrv.jpg'
        },
        {
          title: 'Wall Clocks',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752441196/F0CFF91C-3B7B-4AA9-AECE-35A6DA417194_1_201_a_w5rmde.jpg'
        },
        {
          title: 'Resin Trays',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752441176/2E1812EC-BB3C-4C7D-8480-C1539B7A0FBB_1_201_a_xc2yjx.jpg'
        },
        {
          title: 'Rangoli Art',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752440782/6F66291E-3673-47F4-8989-701EBB8BB8BE_1_201_a_uxx8zk.jpg'
        },
        {
          title: 'Pattachitra Panels',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752441169/65B82642-5A77-4A31-88BC-B36E2B5DB7DE_1_201_a_e7bed1.jpg'
        },
        {
          title: 'Krishna Embroidery',
          image: 'https://res.cloudinary.com/downe8107/image/upload/v1752441212/2E077407-F784-4515-8960-988FB394B218_1_201_a_p1as8c.jpg'
        }
      ].map((item, index) => (
        <div key={index} className={styles.mobileExploreCard}>
          <div className={styles.mobileExploreCardInner}>
            <img
              src={item.image}
              alt={item.title}
              className={styles.mobileExploreImage}
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x300/333/666?text=Image+Not+Found')}
            />
            <div className={styles.mobileExploreCardContent}>
              <h3 className={styles.mobileExploreCardTitle}>{item.title}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Subtle accent elements */}
    <div style={{
      position: 'absolute',
      bottom: '10%',
      right: '5%',
      width: '180px',
      height: '180px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)',
      borderRadius: '50%',
      zIndex: 1
    }}></div>
    
    <div style={{
      position: 'absolute',
      top: '15%',
      left: '8%',
      width: '120px',
      height: '120px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 70%)',
      borderRadius: '50%',
      zIndex: 1
    }}></div>
    
    {/* Corner accent */}
    <div style={{
      position: 'absolute',
      top: '40px',
      left: '40px',
      width: '60px',
      height: '60px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 2
    }}></div>
    
    <div style={{
      position: 'absolute',
      bottom: '40px',
      right: '40px',
      width: '60px',
      height: '60px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      zIndex: 2
    }}></div>
    
    {/* View all button */}
    <div style={{
      textAlign: 'center',
      marginTop: '3.5rem',
      position: 'relative',
      zIndex: 2
    }}>
      <Link href="/products" style={{
        display: 'inline-block',
        padding: '0.9rem 2.5rem',
        background: 'transparent',
        color: '#fff',
        fontSize: '0.85rem',
        fontWeight: 300,
        letterSpacing: '0.1em',
        textDecoration: 'none',
        textTransform: 'uppercase',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s ease'
      }}>
        View All Collections
      </Link>
    </div>
  </section>
  
  {/* Featured Discoveries Section - Random products from API */}
<section className={`${styles.mobileFeaturedSection} ${styles.mobileOnly}`}>
  {/* Section header */}
  <div className={styles.mobileFeaturedHeader}>
    <div className={styles.mobileFeaturedHeaderLine} />
    <h2 className={styles.mobileFeaturedTitle}>Featured Discoveries</h2>
    <div className={styles.mobileFeaturedHeaderLine} />
    <p className={styles.mobileFeaturedDescription}>
      Handpicked selections from our latest collection, curated just for you
    </p>
  </div>

  {/* Replace the grid with our new stacked carousel */}
  <MobileFeaturedCarousel products={featuredProducts} />

  {/* View all button */}
  <div style={{
    textAlign: 'center',
    marginTop: '2.5rem',
    position: 'relative',
    zIndex: 2
  }}>
    <Link href="/products" style={{
      display: 'inline-block',
      padding: '0.9rem 2.5rem',
      background: '#000',
      color: '#fff',
      fontSize: '0.85rem',
      fontWeight: 400,
      letterSpacing: '0.1em',
      textDecoration: 'none',
      textTransform: 'uppercase',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s ease'
    }}>
      View All Products
    </Link>
  </div>

  {/* Subtle accent elements */}
  <div style={{
    position: 'absolute',
    bottom: '10%',
    right: '5%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    zIndex: 1
  }}></div>
  
  <div style={{
    position: 'absolute',
    top: '15%',
    left: '8%',
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    zIndex: 1
  }}></div>
</section>



{/* Artistry in Every Layer Section - Redesigned - Desktop Only */}
<section className={`${styles.artistrySection} ${styles.desktopOnly}`}>
  <div 
    className={styles.artistryBackground}
    style={{
      backgroundImage: `linear-gradient(to right, rgba(248, 248, 248, 0.95), rgba(248, 248, 248, 0.8)), url('${getImageUrl('collectionwall.png')}')`
    }}
  >
    <img 
      src={getImageUrl('DSC01366.JPG')}
      alt="Resin art creation process" 
      className={styles.artistryFeatureImage} 
      data-aos="fade-left"
    />
    
    <div className={styles.artistryContent}>
      {/* Section Header with description */}
      <div className={styles.sectionHeader} data-aos="fade-in">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Artistry in Every Layer</h2>
        <div className={styles.headerLine}></div>
      </div>
      
      <div className={styles.artistryQuote} data-aos="fade-up">
        Our resin art combines premium materials with meticulous craftsmanship to create pieces that capture light, color, and imagination in ways that will endure for generations.
      </div>
      
      <div className={styles.artistryCards}>
        {/* Card 1 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="100">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <path d="M32 8C32 8 16 24 16 40C16 48.8366 23.1634 56 32 56C40.8366 56 48 48.8366 48 40C48 24 32 8 32 8Z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 44C34.2091 44 36 42.2091 36 40C36 37.7909 32 32 32 32C32 32 28 37.7909 28 40C28 42.2091 29.7909 44 32 44Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>Museum-Grade Resin</h3>
          <p className={styles.artistryCardText}>Hand-mixed for crystal clarity and vibrant hues that endure.</p>
        </div>
        
        {/* Card 2 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="200">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <path d="M8 24L32 32L56 24" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 32L32 40L56 32" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 40L32 48L56 40" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 16L16 22L32 28L48 22L32 16Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>Precision Pouring</h3>
          <p className={styles.artistryCardText}>Controlled, bubble-free layers for a seamless, mirror-smooth surface.</p>
        </div>
        
        {/* Card 3 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="300">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <circle cx="32" cy="32" r="16" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 16V8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 56V48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 32H8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M56 32H48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M48 16L44 20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 44L16 48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M48 48L44 44" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 20L16 16" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 24V32H40" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>UV-Resistant Gloss</h3>
          <p className={styles.artistryCardText}>Anti-yellowing top coat protects color and shine from sun exposure.</p>
        </div>
      </div>
    </div>
  </div>
</section>

</main>

)

}