'use client'

import { useEffect, useState, useRef } from 'react'
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

// 🌟 ULTIMATE ADVANCED MOBILE CAROUSEL - With Cutting-Edge Innovations 🌟
const MobileFeaturedCarousel = ({ products = [] }) => {
  // Core state management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  
  // Advanced interaction states
  const [isPinching, setIsPinching] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [liftedCardIndex, setLiftedCardIndex] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [deviceTilt, setDeviceTilt] = useState({ x: 0, y: 0 });
  const [timeWarpMode, setTimeWarpMode] = useState('normal');
  const [kaleidoscopeMode, setKaleidoscopeMode] = useState(false);
  const [liquidMorphIntensity, setLiquidMorphIntensity] = useState(0);
  
  // Physics simulation states
  const [magneticField, setMagneticField] = useState(0);
  const [fluidRipples, setFluidRipples] = useState([]);
  const [springTensions, setSpringTensions] = useState(new Array(4).fill(0));
  const [particleSystem, setParticleSystem] = useState([]);
  const [lightingPosition, setLightingPosition] = useState({ x: 0, y: 0 });
  
  // Refs for advanced interactions
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  const startPos = useRef(0);
  const lastPos = useRef(0);
  const startTime = useRef(0);
  const longPressTimer = useRef(null);
  const animationFrame = useRef(null);
  const particleCanvas = useRef(null);
  const lastTouchDistance = useRef(0);
  const gestureCenter = useRef({ x: 0, y: 0 });
  
  // Format price to INR
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // 🌊 ADVANCED PHYSICS SIMULATIONS 🌊
  
  // Magnetic Field Simulation
  const calculateMagneticForce = (cardIndex, targetIndex, distance) => {
    const strength = 150 / (distance + 1);
    const direction = cardIndex < targetIndex ? 1 : -1;
    return strength * direction * Math.exp(-distance * 0.5);
  };

  // Fluid Dynamics Simulation
  const createRipple = (centerX, centerY, intensity = 1) => {
    const newRipple = {
      id: Date.now() + Math.random(),
      x: centerX,
      y: centerY,
      radius: 0,
      intensity,
      opacity: 1,
      createdAt: Date.now()
    };
    setFluidRipples(prev => [...prev, newRipple]);
  };

  // Spring-Mass System
  const calculateSpringForce = (cardIndex, displacement) => {
    const k = 0.1; // Spring constant
    const damping = 0.95;
    return -k * displacement * damping;
  };

  // Liquid Morphing Mathematics
  const calculateLiquidDeformation = (offset, velocity) => {
    const amplitude = Math.min(Math.abs(offset) * 0.1, 20);
    const frequency = velocity * 0.01;
    return {
      clipPath: `polygon(
        ${5 + amplitude * Math.sin(frequency)}% ${2 + amplitude * 0.3}%,
        ${95 - amplitude * Math.sin(frequency + 1)}% ${3 + amplitude * 0.2}%,
        ${97 - amplitude * Math.sin(frequency + 2)}% ${97 - amplitude * 0.4}%,
        ${3 + amplitude * Math.sin(frequency + 3)}% ${98 - amplitude * 0.1}%
      )`,
      borderRadius: `${20 + amplitude * 0.5}px ${20 - amplitude * 0.3}px ${20 + amplitude * 0.4}px ${20 - amplitude * 0.2}px`
    };
  };

  // 🎆 PARTICLE SYSTEM 🎆
  
  const createParticle = (x, y, type = 'golden') => {
    return {
      id: Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      maxLife: 60 + Math.random() * 40,
      size: 2 + Math.random() * 3,
      type,
      angle: Math.random() * Math.PI * 2,
      rotation: Math.random() * 0.1 - 0.05
    };
  };

  const updateParticles = () => {
    setParticleSystem(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.99,
        vy: particle.vy * 0.99 + 0.1, // Gravity
        life: particle.life + 1,
        angle: particle.angle + particle.rotation
      })).filter(particle => particle.life < particle.maxLife)
    );
  };

  // 💡 DYNAMIC LIGHTING SYSTEM 💡
  
  const calculateLightingEffects = (cardIndex, cardPosition) => {
    const isActive = cardIndex === currentIndex;
    const intensity = isActive ? 1 : 0.3 + (1 / (Math.abs(cardIndex - currentIndex) + 1)) * 0.7;
    
    return {
      spotlight: `radial-gradient(circle at ${lightingPosition.x}% ${lightingPosition.y}%, 
        rgba(255, 255, 255, ${intensity * 0.3}) 0%, 
        rgba(255, 255, 255, ${intensity * 0.1}) 30%, 
        transparent 60%)`,
      ambientGlow: `0 0 ${30 * intensity}px rgba(255, 215, 0, ${intensity * 0.4})`,
      shadowProjection: `0 ${50 + 20 * intensity}px ${80 * intensity}px rgba(0, 0, 0, ${0.3 * intensity})`
    };
  };

  // Use default products if none provided
  const displayProducts = products.length > 0 ? products : [
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
    }
  ];

  // 🎭 ADVANCED GESTURE & INTERACTION SYSTEMS 🎭
  
  // Multi-Touch Gesture Detection
  const handleMultiTouch = (touches) => {
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      gestureCenter.current = { x: centerX, y: centerY };
      
      if (lastTouchDistance.current > 0) {
        const pinchDelta = distance - lastTouchDistance.current;
        if (Math.abs(pinchDelta) > 5) {
          setIsPinching(true);
          if (pinchDelta > 0) {
            // Pinch out - peek behind cards
            setLiquidMorphIntensity(prev => Math.min(prev + 0.1, 1));
          } else {
            // Pinch in - return to normal
            setLiquidMorphIntensity(prev => Math.max(prev - 0.1, 0));
          }
        }
        
        // Two-finger rotation
        const angle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
        setRotationAngle(angle);
      }
      
      lastTouchDistance.current = distance;
    }
  };

  // Long Press Detection
  const handleLongPressStart = (cardIndex) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      setLiftedCardIndex(cardIndex);
      // Create particles around lifted card
      for (let i = 0; i < 20; i++) {
        const particle = createParticle(
          gestureCenter.current.x + (Math.random() - 0.5) * 100,
          gestureCenter.current.y + (Math.random() - 0.5) * 100,
          'shimmer'
        );
        setParticleSystem(prev => [...prev, particle]);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);
    setLiftedCardIndex(null);
  };

  // 📱 DEVICE ORIENTATION & TILT NAVIGATION 📱
  
  useEffect(() => {
    const handleDeviceOrientation = (event) => {
      if (event.gamma && event.beta) {
        setDeviceTilt({
          x: Math.max(-30, Math.min(30, event.gamma)) / 30, // Normalize to -1 to 1
          y: Math.max(-30, Math.min(30, event.beta - 90)) / 30
        });
        
        // Update lighting position based on tilt
        setLightingPosition({
          x: 50 + (event.gamma || 0) * 1.5,
          y: 50 + ((event.beta || 90) - 90) * 1.5
        });
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      return () => window.removeEventListener('deviceorientation', handleDeviceOrientation);
    }
  }, []);

  // 🌀 ADVANCED ANIMATION LOOPS 🌀
  
  useEffect(() => {
    const animate = () => {
      // Update particle system
      updateParticles();
      
      // Update ripples
      setFluidRipples(prev => 
        prev.map(ripple => ({
          ...ripple,
          radius: ripple.radius + 2,
          opacity: Math.max(0, ripple.opacity - 0.02)
        })).filter(ripple => ripple.opacity > 0)
      );
      
      // Update spring tensions
      setSpringTensions(prev => 
        prev.map((tension, index) => {
          const targetIndex = currentIndex;
          const distance = Math.abs(index - targetIndex);
          const force = calculateSpringForce(index, distance * 10);
          return tension + force;
        })
      );
      
      // Update magnetic field
      setMagneticField(prev => {
        const targetField = isDragging ? 1 : 0;
        return prev + (targetField - prev) * 0.1;
      });
      
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [currentIndex, isDragging]);

  // Auto-play with advanced timing
  useEffect(() => {
    if (autoPlay && !isDragging && displayProducts.length > 1 && !isTransitioning && !isLongPressing) {
      const interval = timeWarpMode === 'slow' ? 8000 : timeWarpMode === 'fast' ? 2000 : 4000;
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
      }, interval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, isDragging, displayProducts.length, isTransitioning, isLongPressing, timeWarpMode]);

  // 🌊 ADVANCED FLUID & PHYSICS INTERACTIONS 🌊
  
  // Enhanced rubber band with fluid dynamics
  const applyAdvancedRubberBand = (offset, velocity = 0) => {
    const maxDrag = 120;
    if (Math.abs(offset) <= maxDrag) return offset;
    
    const excess = Math.abs(offset) - maxDrag;
    const fluidResistance = Math.pow(excess / 100, 0.7);
    const damped = maxDrag + excess * (0.2 + fluidResistance * 0.1);
    return offset > 0 ? damped : -damped;
  };

  // Pause/resume with advanced controls
  const pauseAutoPlay = () => {
    setAutoPlay(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const resumeAutoPlay = () => {
    if (!isDragging && !isTransitioning && !isLongPressing && !isPinching) {
      setAutoPlay(true);
    }
  };
  
  // 🎭 ULTIMATE TOUCH EVENT SYSTEM 🎭
  
  const handleAdvancedTouchStart = (e) => {
    pauseAutoPlay();
    
    // Handle multi-touch
    if (e.touches.length > 1) {
      handleMultiTouch(e.touches);
      return;
    }
    
    setIsDragging(true);
    startPos.current = e.touches[0].clientX;
    lastPos.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setDragOffset(0);
    
    // Create ripple effect
    const rect = carouselRef.current.getBoundingClientRect();
    const centerX = e.touches[0].clientX - rect.left;
    const centerY = e.touches[0].clientY - rect.top;
    createRipple(centerX, centerY, 0.8);
    
    // Start long press detection
    const cardIndex = currentIndex;
    handleLongPressStart(cardIndex);
    
    // Create touch particles
    for (let i = 0; i < 5; i++) {
      const particle = createParticle(centerX, centerY, 'touch');
      setParticleSystem(prev => [...prev, particle]);
    }
  };
  
  const handleAdvancedTouchMove = (e) => {
    if (e.touches.length > 1) {
      handleMultiTouch(e.touches);
      return;
    }
    
    if (!isDragging) return;
    
    const currentPos = e.touches[0].clientX;
    const rawOffset = currentPos - startPos.current;
    const velocity = Math.abs(currentPos - lastPos.current);
    
    // Apply advanced fluid resistance
    const constrainedOffset = applyAdvancedRubberBand(rawOffset, velocity);
    
    // Update liquid morphing based on movement
    setLiquidMorphIntensity(Math.min(Math.abs(velocity) * 0.05, 1));
    
    // Magnetic field interaction
    const magneticInfluence = calculateMagneticForce(currentIndex, currentIndex + 1, Math.abs(rawOffset) / 50);
    const finalOffset = constrainedOffset + magneticInfluence * magneticField;
    
    lastPos.current = currentPos;
    setDragOffset(finalOffset);
    
    // Update lighting position
    const rect = carouselRef.current.getBoundingClientRect();
    setLightingPosition({
      x: ((currentPos - rect.left) / rect.width) * 100,
      y: 50
    });
    
    // Cancel long press on movement
    handleLongPressEnd();
    
    e.preventDefault();
  };
  
  const handleAdvancedTouchEnd = () => {
    if (!isDragging) return;
    
    setIsPinching(false);
    lastTouchDistance.current = 0;
    handleLongPressEnd();
    
    const totalDistance = lastPos.current - startPos.current;
    const swipeTime = Date.now() - startTime.current;
    const velocity = Math.abs(totalDistance) / swipeTime;
    
    // Time warp mode affects thresholds
    const baseThreshold = 50;
    const threshold = timeWarpMode === 'slow' ? baseThreshold * 0.7 : 
                     timeWarpMode === 'fast' ? baseThreshold * 1.5 : baseThreshold;
    const quickSwipeThreshold = 0.6;
    
    // Enhanced decision logic with physics
    const shouldNext = totalDistance < -threshold || 
                      (totalDistance < -25 && velocity > quickSwipeThreshold);
    const shouldPrev = totalDistance > threshold || 
                      (totalDistance > 25 && velocity > quickSwipeThreshold);
    
    if (shouldNext || shouldPrev) {
      setIsTransitioning(true);
      
      // Time warp transition effect
      const transitionDuration = timeWarpMode === 'slow' ? 1200 : 
                                timeWarpMode === 'fast' ? 200 : 500;
      
      if (shouldNext) {
        setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
      }
      
      // Advanced transition with effects
      setTimeout(() => {
        setDragOffset(0);
        setIsDragging(false);
        setLiquidMorphIntensity(0);
        setTimeout(() => {
          setIsTransitioning(false);
          resumeAutoPlay();
        }, transitionDuration);
      }, 50);
    } else {
      // Harmonic return animation
      setDragOffset(0);
      setLiquidMorphIntensity(0);
      setTimeout(() => {
        setIsDragging(false);
        resumeAutoPlay();
      }, 400);
    }
  };

  // Navigate to specific card
  const goToCard = (index) => {
    if (index === currentIndex || isTransitioning || isDragging) return;
    
    pauseAutoPlay();
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
      resumeAutoPlay();
    }, 600);
  };
  
  // 🎨✨ ULTIMATE ADVANCED CARD STYLING SYSTEM ✨🎨
  const getAdvancedCardStyle = (index) => {
    let position = index - currentIndex;
    if (position < 0) position += displayProducts.length;
    if (position >= displayProducts.length) position -= displayProducts.length;
    
    // 🧮 Advanced Physics Calculations
    let cardOffset = 0;
    let cardRotation = 0;
    let cardScale = 1;
    let cardTiltX = deviceTilt.x * 15;
    let cardTiltY = deviceTilt.y * 10;
    
    // Base physics response
    if (isDragging && position === 0) {
      cardOffset = dragOffset;
      cardRotation = dragOffset * 0.03;
      cardScale = 1 - Math.abs(dragOffset) * 0.0003;
    } else if (isDragging && position === 1 && dragOffset < 0) {
      cardOffset = Math.max(-35, dragOffset * 0.5);
    } else if (isDragging && position === displayProducts.length - 1 && dragOffset > 0) {
      cardOffset = Math.min(35, dragOffset * 0.5);
    }
    
    // Magnetic field influences
    const magneticInfluence = magneticField * calculateMagneticForce(index, currentIndex, Math.abs(position));
    cardOffset += magneticInfluence;
    
    // Spring system affects
    const springInfluence = springTensions[index] || 0;
    cardTiltY += springInfluence * 0.5;
    
    // Long press lift effect
    const isLifted = liftedCardIndex === index;
    const liftOffset = isLifted ? -50 : 0;
    const liftScale = isLifted ? 1.1 : 1;
    
    // Liquid morphing calculations
    const liquidDeform = calculateLiquidDeformation(dragOffset, Math.abs(cardOffset));
    
    // Lighting calculations
    const lighting = calculateLightingEffects(index, position);
    
    // 🎭 Origami folding effect (activated on specific gestures)
    const foldIntensity = isPinching ? liquidMorphIntensity : 0;
    const foldRotation = foldIntensity * 180;
    
    // 🌈 Holographic glass calculations
    const holographicHue = (position * 60 + Date.now() * 0.1) % 360;
    const depthColorShift = position * 20; // Cooler colors as they go back
    
    const style: React.CSSProperties = {
      position: 'absolute',
      width: '85%',
      maxWidth: '320px',
      transformOrigin: 'center center',
      willChange: 'transform, filter, clip-path, border-radius',
      backfaceVisibility: 'hidden',
      cursor: position === 0 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      // 🌊 Liquid morphing shape
      clipPath: liquidMorphIntensity > 0.1 ? liquidDeform.clipPath : 'none',
      borderRadius: liquidMorphIntensity > 0.1 ? liquidDeform.borderRadius : '20px',
      overflow: 'hidden',
    };
    
    // ⚡ Dynamic transition system
    if (isDragging && position === 0) {
      style.transition = 'none';
    } else if (isTransitioning) {
      const duration = timeWarpMode === 'slow' ? '1.2s' : timeWarpMode === 'fast' ? '0.2s' : '0.6s';
      style.transition = `all ${duration} cubic-bezier(0.23, 1, 0.32, 1)`;
    } else {
      style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    
    // 🌟 Advanced positioning with all effects combined
    if (position === 0) {
      // 👑 FRONT CARD - Maximum effects
      style.transform = `
        translateX(${cardOffset}px) 
        translateY(${liftOffset}px)
        translateZ(50px) 
        rotateY(${cardRotation + cardTiltX + foldRotation}deg) 
        rotateX(${cardTiltY}deg)
        scale(${cardScale * liftScale})
      `;
      style.zIndex = 100 + (isLifted ? 50 : 0);
      style.opacity = 1;
      style.boxShadow = `
        ${lighting.shadowProjection},
        ${lighting.ambientGlow},
        0 30px 60px rgba(0, 0, 0, 0.25),
        0 20px 30px rgba(0, 0, 0, 0.15),
        inset 0 0 120px rgba(255, 255, 255, 0.1)
      `;
      // 🌈 Holographic border
      style.border = `2px solid`;
      style.borderImage = `linear-gradient(45deg, 
        hsl(${holographicHue}, 70%, 60%), 
        hsl(${holographicHue + 120}, 70%, 60%), 
        hsl(${holographicHue + 240}, 70%, 60%)) 1`;
      // 💡 Dynamic lighting overlay
      style.backgroundImage = lighting.spotlight;
      
    } else if (position === 1) {
      // Right visible edge with advanced effects
      style.transform = `
        translateX(${40 + cardOffset}px) 
        translateY(8px)
        translateZ(35px) 
        rotateY(${-12 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.92)
      `;
      style.zIndex = 90;
      style.opacity = 0.8;
      style.boxShadow = `
        ${lighting.shadowProjection},
        0 20px 40px rgba(0, 0, 0, 0.15),
        0 12px 20px rgba(0, 0, 0, 0.1)
      `;
      style.border = `1px solid hsl(${holographicHue + depthColorShift}, 50%, 70%)`;
      style.filter = `hue-rotate(${depthColorShift}deg) brightness(0.9)`;
      
    } else if (position === 2) {
      // More visible right edge
      style.transform = `
        translateX(65px) 
        translateY(16px)
        translateZ(20px) 
        rotateY(${-18 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.84)
      `;
      style.zIndex = 80;
      style.opacity = 0.65;
      style.boxShadow = `0 15px 30px rgba(0, 0, 0, 0.12), 0 8px 15px rgba(0, 0, 0, 0.08)`;
      style.border = `1px solid hsl(${holographicHue + depthColorShift * 2}, 40%, 75%)`;
      style.filter = `hue-rotate(${depthColorShift * 2}deg) brightness(0.8)`;
      
    } else if (position === 3) {
      // Far right edge
      style.transform = `
        translateX(85px) 
        translateY(24px)
        translateZ(5px)
        rotateY(${-22 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.76)
      `;
      style.zIndex = 70;
      style.opacity = 0.4;
      style.boxShadow = `0 12px 25px rgba(0, 0, 0, 0.1)`;
      style.filter = `hue-rotate(${depthColorShift * 3}deg) brightness(0.7) blur(0.5px)`;
      
    } else if (position === displayProducts.length - 1) {
      // Left visible edge
      style.transform = `
        translateX(${-40 + cardOffset}px) 
        translateY(8px)
        translateZ(35px) 
        rotateY(${12 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.92)
      `;
      style.zIndex = 90;
      style.opacity = 0.8;
      style.boxShadow = `
        ${lighting.shadowProjection},
        0 20px 40px rgba(0, 0, 0, 0.15),
        0 12px 20px rgba(0, 0, 0, 0.1)
      `;
      style.border = `1px solid hsl(${holographicHue - depthColorShift}, 50%, 70%)`;
      style.filter = `hue-rotate(${-depthColorShift}deg) brightness(0.9)`;
      
    } else if (position === displayProducts.length - 2) {
      // More visible left edge
      style.transform = `
        translateX(-65px) 
        translateY(16px)
        translateZ(20px) 
        rotateY(${18 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.84)
      `;
      style.zIndex = 80;
      style.opacity = 0.65;
      style.boxShadow = `0 15px 30px rgba(0, 0, 0, 0.12), 0 8px 15px rgba(0, 0, 0, 0.08)`;
      style.border = `1px solid hsl(${holographicHue - depthColorShift * 2}, 40%, 75%)`;
      style.filter = `hue-rotate(${-depthColorShift * 2}deg) brightness(0.8)`;
      
    } else if (position === displayProducts.length - 3) {
      // Far left edge
      style.transform = `
        translateX(-85px) 
        translateY(24px)
        translateZ(5px)
        rotateY(${22 + cardTiltX}deg) 
        rotateX(${cardTiltY}deg)
        scale(0.76)
      `;
      style.zIndex = 70;
      style.opacity = 0.4;
      style.boxShadow = `0 12px 25px rgba(0, 0, 0, 0.1)`;
      style.filter = `hue-rotate(${-depthColorShift * 3}deg) brightness(0.7) blur(0.5px)`;
      
    } else {
      // Hidden cards - dimensional portal effect
      style.transform = `
        translateX(${position > displayProducts.length / 2 ? -110 : 110}px) 
        translateY(32px)
        translateZ(-10px)
        rotateY(${position > displayProducts.length / 2 ? 25 : -25}deg) 
        scale(0.68)
      `;
      style.zIndex = 60;
      style.opacity = 0;
      style.filter = 'blur(2px)';
      style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.06)';
    }
    
    // 🎪 Kaleidoscope mode overlay
    if (kaleidoscopeMode) {
      style.filter = (style.filter || '') + ` saturate(1.5) contrast(1.2) hue-rotate(${position * 90}deg)`;
      style.background = `conic-gradient(from ${holographicHue}deg, transparent, rgba(255,255,255,0.1), transparent)`;
    }
    
    return style;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 🎮 ULTIMATE CONTROL PANEL 🎮 */}
      <div style={{
        position: 'absolute',
        top: '-70px',
        left: '0',
        right: '0',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0 20px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Left controls */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => autoPlay ? pauseAutoPlay() : resumeAutoPlay()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
            }}
          >
            {autoPlay ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={() => setTimeWarpMode(prev => 
              prev === 'normal' ? 'slow' : prev === 'slow' ? 'fast' : 'normal'
            )}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
            }}
          >
            {timeWarpMode === 'slow' ? '🐌 Slow' : timeWarpMode === 'fast' ? '⚡ Fast' : '🕐 Normal'}
          </button>
          
          <button
            onClick={() => setKaleidoscopeMode(!kaleidoscopeMode)}
            style={{
              background: kaleidoscopeMode ? 'rgba(255, 200, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
            }}
          >
            🎨 Kaleid
          </button>
        </div>

        {/* Right indicators */}
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          fontSize: '0.6rem',
          color: '#666',
        }}>
          {isDragging && <span>🤏 Dragging</span>}
          {isLongPressing && <span>📌 Lifted</span>}
          {isPinching && <span>🔍 Pinching</span>}
          {Math.abs(deviceTilt.x) > 0.1 && <span>📱 Tilting</span>}
        </div>
      </div>

      {/* 🎆 PARTICLE SYSTEM CANVAS 🎆 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 150,
        overflow: 'hidden',
      }}>
        {particleSystem.map(particle => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              opacity: Math.max(0, 1 - particle.life / particle.maxLife),
              transform: `rotate(${particle.angle}rad)`,
              background: particle.type === 'golden' ? 
                'radial-gradient(circle, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.4))' :
                particle.type === 'shimmer' ? 
                'radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(200, 200, 255, 0.5))' :
                'radial-gradient(circle, rgba(0, 150, 255, 0.7), rgba(100, 200, 255, 0.3))',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.3)',
              transition: 'none',
            }}
          />
        ))}
      </div>

      {/* 🌊 FLUID RIPPLE EFFECTS 🌊 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 140,
        overflow: 'hidden',
      }}>
        {fluidRipples.map(ripple => (
          <div
            key={ripple.id}
            style={{
              position: 'absolute',
              left: `${ripple.x - ripple.radius}px`,
              top: `${ripple.y - ripple.radius}px`,
              width: `${ripple.radius * 2}px`,
              height: `${ripple.radius * 2}px`,
              borderRadius: '50%',
              border: `2px solid rgba(255, 255, 255, ${ripple.opacity * 0.4})`,
              background: `radial-gradient(circle, 
                rgba(255, 255, 255, ${ripple.opacity * 0.1}) 0%, 
                transparent 70%)`,
              opacity: ripple.opacity,
              transform: 'scale(1)',
              transition: 'none',
            }}
          />
        ))}
      </div>

      {/* 💡 DYNAMIC LIGHTING OVERLAY 💡 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 130,
        background: `radial-gradient(
          circle at ${lightingPosition.x}% ${lightingPosition.y}%, 
          rgba(255, 255, 255, 0.1) 0%, 
          rgba(255, 255, 255, 0.05) 30%, 
          transparent 60%
        )`,
        mixBlendMode: 'overlay',
      }} />

      <div 
        ref={carouselRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          zIndex: 3,
          perspective: '1000px',
          perspectiveOrigin: 'center center',
          transformStyle: 'preserve-3d',
        }}
        onTouchStart={handleAdvancedTouchStart}
        onTouchMove={handleAdvancedTouchMove}
        onTouchEnd={handleAdvancedTouchEnd}
        onMouseEnter={pauseAutoPlay}
        onMouseLeave={resumeAutoPlay}
      >
        {displayProducts.map((product, index) => (
          <div key={product.id} style={getAdvancedCardStyle(index)}>
            <Link href={`/products/${product.id}`} style={{
              textDecoration: 'none',
              display: 'block',
              height: '100%',
              width: '100%',
              background: '#fff',
              color: '#000',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1/1.1',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #fafafa 0%, #f8f8f8 100%)',
              }}>
                <img 
                  src={product.imageUrls[0]} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.3s ease-out',
                  }}
                />
                
                {/* Simplified badges */}
                {product.isNew && (
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                  }}>
                    New
                  </div>
                )}
                
                {product.stockQuantity === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#000',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                  }}>
                    Out of Stock
                  </div>
                )}
                
                {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '15px',
                    left: '15px',
                    backgroundColor: 'rgba(255, 107, 107, 0.9)',
                    color: 'white',
                    fontSize: '0.6rem',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                  }}>
                    Only {product.stockQuantity} left
                  </div>
                )}
              </div>
              
              <div style={{
                padding: '18px 20px 20px',
                background: '#fff',
                position: 'relative',
              }}>
                {product.category && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#888',
                    marginBottom: '8px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    {product.category.name}
                  </div>
                )}
                
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0 0 12px 0',
                  lineHeight: 1.3,
                  color: '#000',
                }}>
                  {product.name}
                </h3>
                
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#000',
                  letterSpacing: '-0.02em',
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
            width: `${((currentIndex + 1) / displayProducts.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #000, #333)',
            transition: 'width 0.3s ease',
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
          {currentIndex + 1} of {displayProducts.length}
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
        const availableProducts = data.products
          .filter(p => p.isActive && p.imageUrls && p.imageUrls.length > 0)
          .map(p => ({
            ...p,
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
          }))
          .slice(0, 8); // Limit to 8 products
          
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