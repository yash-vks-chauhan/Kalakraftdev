'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProductImagesMobile from '../../components/ProductImagesMobile';
import { useCart } from '../../contexts/CartContext';
import WishlistButton from '../../components/WishlistButton';
import styles from './mobile_product_details.module.css';

// Elegant animation variants for page entrance with luxurious timing
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: 50,
    rotateX: 3
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -30,
    rotateX: -2,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
}

// Smooth animation variants for content sections with elegant flow
const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.97
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 250,
      damping: 25,
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Professional accordion animation with smooth height transitions and elegant content reveal
const accordionVariants = {
  closed: {
    height: 0,
    opacity: 0,
    scale: 0.98,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  open: {
    height: "auto",
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Elegant content reveal animation for accordion items
const accordionContentVariants = {
  closed: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Staggered animation for list items in accordion
const accordionListVariants = {
  open: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  closed: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
}

// Individual list item animation
const accordionItemVariants = {
  closed: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2
    }
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Icon rotation animation
const iconVariants = {
  closed: {
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  open: {
    rotate: 180,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Gallery container animation variants
const galleryVariants = {
  closed: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Individual gallery item animation
const galleryItemVariants = {
  closed: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      duration: 0.6
    }
  }
}

// Gallery image animation with elegant entrance
const galleryImageVariants = {
  closed: {
    opacity: 0,
    scale: 1.1,
    filter: "blur(10px)",
    transition: {
      duration: 0.3
    }
  },
  open: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      delay: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Luxurious animation variants for product cards in carousel
const carouselCardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.85,
    y: 60,
    rotateY: 5
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  price: number;
  currency: string;
  imageUrls: string[];
  stockQuantity: number;
  category: { id: number; name: string; slug: string } | null;
  specifications?: string | null;
  careInstructions?: string | null;
  stylingIdeaImages?: ({ url: string; text?: string } | string)[] | null;
  isNew?: boolean;
  avgRating?: number;
}

interface MobileProductDetailsProps {
  product: Product;
  avgRating: number;
  ratingCount: number;
  similarProducts?: Product[];
}

export default function MobileProductDetails({ 
  product, 
  avgRating, 
  ratingCount,
  similarProducts: initialSimilarProducts = []
}: MobileProductDetailsProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>(initialSimilarProducts);
  const [shareSuccess, setShareSuccess] = useState<boolean | null>(null);
  const [shareMethod, setShareMethod] = useState<'webshare' | 'clipboard' | null>(null);
  
  // Carousel state for similar products
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [carouselItemsPerView, setCarouselItemsPerView] = useState(2);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Similar product image states
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});
  const [touchStartPositions, setTouchStartPositions] = useState<Record<number, number>>({});
  const [touchEndPositions, setTouchEndPositions] = useState<Record<number, number>>({});
  const [isSwipingStates, setIsSwipingStates] = useState<Record<number, boolean>>({});
  const [swipeDistances, setSwipeDistances] = useState<Record<number, number>>({});
  const productRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerWidths = useRef<Record<number, number>>({});
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    specifications: false,
    care: false,
    styling: true, // Keep styling expanded by default
  });

  // Format price with commas for thousands
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price);
  };

  // Fetch similar products
  useEffect(() => {
    if (initialSimilarProducts.length > 0) {
      setSimilarProducts(initialSimilarProducts);
      return;
    }
    
    if (product?.category?.slug) {
      fetch(`/api/products?category=${product.category.slug}`)
        .then(r => r.json())
        .then(j => {
          const others = (j.products || [])
            .filter((p: any) => p.id !== product.id)
            .slice(0, 8) // Get more products for the carousel
            .map((p: any) => {
              let urls: string[] = [];
              try {
                urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]');
              } catch {
                urls = [];
              }
              
              // Check if product is new (less than 14 days old)
              const isNew = p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
              
              return { ...p, imageUrls: urls, isNew };
            });
          setSimilarProducts(others);
        })
        .catch(console.error);
    }
  }, [product, initialSimilarProducts]);

  // Initialize image indices for similar products
  useEffect(() => {
    if (similarProducts.length > 0) {
      const initialIndices: Record<number, number> = {};
      similarProducts.forEach(p => {
        initialIndices[p.id] = 0;
      });
      setCurrentImageIndices(initialIndices);
    }
  }, [similarProducts]);

  // Carousel touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Product image swipe handlers
  const handleProductTouchStart = (e: React.TouchEvent, productId: number) => {
    const product = similarProducts.find(p => p.id === productId);
    if (!product || product.imageUrls.length <= 1) return;
    
    // Store container width for calculations
    containerWidths.current[productId] = productRefs.current[productId]?.offsetWidth || 0;
    
    const clientX = e.targetTouches[0].clientX;
    setTouchStartPositions(prev => ({ ...prev, [productId]: clientX }));
    setTouchEndPositions(prev => ({ ...prev, [productId]: clientX }));
    setIsSwipingStates(prev => ({ ...prev, [productId]: true }));
    setSwipeDistances(prev => ({ ...prev, [productId]: 0 }));
    
    // Prevent parent carousel from scrolling
    e.stopPropagation();
  };
  
  const handleProductTouchMove = (e: React.TouchEvent, productId: number) => {
    const product = similarProducts.find(p => p.id === productId);
    if (!product || !isSwipingStates[productId] || product.imageUrls.length <= 1) return;
    
    // Prevent default to avoid page scrolling while swiping
    e.preventDefault();
    e.stopPropagation();
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEndPositions(prev => ({ ...prev, [productId]: currentTouch }));
    
    // Calculate how far the user has swiped
    const distance = currentTouch - touchStartPositions[productId];
    const currentIndex = currentImageIndices[productId] || 0;
    
    // Apply resistance at the edges
    let finalDistance = distance;
    if ((currentIndex === 0 && distance > 0) || 
        (currentIndex === product.imageUrls.length - 1 && distance < 0)) {
      // Apply resistance at edges - finger moves 3x more than image
      finalDistance = distance / 3;
    }
    
    setSwipeDistances(prev => ({ ...prev, [productId]: finalDistance }));
  };
  
  const handleProductTouchEnd = (productId: number) => {
    const product = similarProducts.find(p => p.id === productId);
    if (!product || !isSwipingStates[productId] || product.imageUrls.length <= 1) return;
    
    setIsSwipingStates(prev => ({ ...prev, [productId]: false }));
    
    const touchStart = touchStartPositions[productId];
    const touchEnd = touchEndPositions[productId];
    
    if (!touchStart || !touchEnd) {
      setSwipeDistances(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = containerWidths.current[productId] * 0.2; // 20% of container width
    const currentIndex = currentImageIndices[productId] || 0;
    
    if (Math.abs(distance) < minSwipeDistance) {
      // Not swiped far enough, snap back
      setSwipeDistances(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    
    if (distance > 0 && currentIndex < product.imageUrls.length - 1) {
      // Swiped left, go to next image
      setCurrentImageIndices(prev => ({ ...prev, [productId]: currentIndex + 1 }));
    } else if (distance < 0 && currentIndex > 0) {
      // Swiped right, go to previous image
      setCurrentImageIndices(prev => ({ ...prev, [productId]: currentIndex - 1 }));
    }
    
    // Reset values
    setTouchStartPositions(prev => ({ ...prev, [productId]: 0 }));
    setTouchEndPositions(prev => ({ ...prev, [productId]: 0 }));
    setSwipeDistances(prev => ({ ...prev, [productId]: 0 }));
  };
  
  // Calculate transform style for real-time finger tracking
  const getProductImageTransform = (productId: number) => {
    const currentIndex = currentImageIndices[productId] || 0;
    
    if (isSwipingStates[productId]) {
      // During swipe, follow finger exactly
      const containerWidth = containerWidths.current[productId] || 0;
      const percentageOffset = containerWidth ? (swipeDistances[productId] / containerWidth) * 100 : 0;
      return {
        transform: `translateX(calc(-${currentIndex * 100}% + ${percentageOffset}%))`,
        transition: 'none'
      };
    }
    
    // When not swiping, use smooth transition
    return {
      transform: `translateX(-${currentIndex * 100}%)`,
      transition: 'transform 0.3s ease'
    };
  };

  // Handle wishlist button click to prevent navigation
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle share button click
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a more descriptive share text
    const shareTitle = `${product.name} | Kalakraft`;
    const shareText = `Check out ${product.name} - ${product.currency}${product.price.toFixed(2)} on Kalakraft!`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        setShareSuccess(true);
        setShareMethod('webshare');
        setTimeout(() => {
          setShareSuccess(null);
          setShareMethod(null);
        }, 3000);
      } catch (err) {
        console.error('Error sharing:', err);
        setShareSuccess(false);
        setShareMethod('webshare');
        setTimeout(() => {
          setShareSuccess(null);
          setShareMethod(null);
        }, 3000);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${window.location.href}`);
        setShareSuccess(true);
        setShareMethod('clipboard');
        setTimeout(() => {
          setShareSuccess(null);
          setShareMethod(null);
        }, 3000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        setShareSuccess(false);
        setShareMethod('clipboard');
        setTimeout(() => {
          setShareSuccess(null);
          setShareMethod(null);
        }, 3000);
      }
    }
  }, [product.name, product.currency, product.price, setShareSuccess, setShareMethod]);

  // Listen for share event from the navbar
  useEffect(() => {
    const handleShareEvent = () => {
      handleShare({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
    };
    
    window.addEventListener('shareProduct', handleShareEvent);
    
    return () => {
      window.removeEventListener('shareProduct', handleShareEvent);
    };
  }, [product, handleShare]); // Include handleShare in dependencies

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => {
      // Create a new state object with all sections closed
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof typeof expandedSections] = false;
        return acc;
      }, {} as typeof expandedSections);
      
      // Toggle the selected section (if it was already open, it will remain closed)
      newState[section] = !prev[section];
      
      return newState;
    });
  };

  // Format specifications text
  const formatSpecifications = (text: string) => {
    if (!text) return [];
    
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      // Check if it's a key-value pair (contains : or -)
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className={styles.specRow}>
            <span className={styles.specKey}>{key.trim()}</span>
            <span className={styles.specValue}>{value}</span>
          </div>
        );
      } else if (trimmed.startsWith('-')) {
        return (
          <div key={index} className={styles.specBullet}>
            {trimmed.substring(1).trim()}
          </div>
        );
      } else {
        return (
          <div key={index} className={styles.specText}>
            {trimmed}
          </div>
        );
      }
    }).filter(Boolean);
  };

  // Format care instructions text
  const formatCareInstructions = (text: string) => {
    if (!text) return [];
    
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      // Check if it's a bullet point (starts with -)
      if (trimmed.startsWith('-')) {
        return (
          <div key={index} className={styles.careBullet}>
            {trimmed.substring(1).trim()}
          </div>
        );
      } else {
        return (
          <div key={index} className={styles.careText}>
            {trimmed}
          </div>
        );
      }
    }).filter(Boolean);
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await addToCart(product.id, qty);
      setAdded(true);
      
      // Reset the added state after 3 seconds
      setTimeout(() => {
        setAdded(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error adding to cart');
    }
  };

  // Calculate visible carousel items and update active index
  const updateCarouselActiveIndex = useCallback(() => {
    if (!carouselRef.current || similarProducts.length === 0) return;
    
    const scrollPosition = carouselRef.current.scrollLeft;
    const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
    const itemWidth = carouselRef.current.scrollWidth / similarProducts.length;
    const viewportWidth = carouselRef.current.clientWidth;
    
    // Calculate scroll progress (0 to 1)
    const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0;
    setScrollProgress(progress);
    
    // Calculate how many items are visible in the viewport
    const itemsPerView = Math.max(1, Math.floor(viewportWidth / itemWidth));
    setCarouselItemsPerView(itemsPerView);
    
    // Calculate which item is most visible (centered)
    const activeIndex = Math.min(
      Math.floor(scrollPosition / itemWidth),
      similarProducts.length - itemsPerView
    );
    setActiveCarouselIndex(activeIndex);
  }, [similarProducts.length]);

  // Add scroll event listener to track carousel position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const handleScroll = () => {
      updateCarouselActiveIndex();
    };
    
    carousel.addEventListener('scroll', handleScroll);
    
    // Initial calculation
    updateCarouselActiveIndex();
    
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, [similarProducts, updateCarouselActiveIndex]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      updateCarouselActiveIndex();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCarouselActiveIndex]);

  // Scroll to a specific item in the carousel
  const scrollToItem = (index: number) => {
    if (!carouselRef.current) return;
    
    const itemWidth = carouselRef.current.scrollWidth / similarProducts.length;
    carouselRef.current.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
  };

  return (
    <motion.div 
      className={styles.mobileProductContainer}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Product Images - Full width with transparent background */}
      <motion.div 
        className={styles.productImageWrapper}
        variants={sectionVariants}
      >
        <ProductImagesMobile 
          imageUrls={product.imageUrls} 
          name={product.name} 
        />
        {/* Low Stock Banner - Only show for products with low stock (5 or less) */}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <motion.div 
            className={styles.cardLowStock}
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
          >
            Only {product.stockQuantity} left
          </motion.div>
        )}
      </motion.div>
      
      {/* Share feedback toast */}
      <AnimatePresence>
        {shareSuccess !== null && (
          <motion.div 
            className={styles.shareToast}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {shareSuccess 
              ? (shareMethod === 'webshare' 
                ? 'Product shared successfully!' 
                : 'Product link copied to clipboard!')
              : (shareMethod === 'webshare'
                ? 'Failed to share product'
                : 'Failed to copy product link')}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Product Info - Overlapping the image slightly with rounded corners */}
      <motion.div 
        className={styles.productInfo}
        variants={sectionVariants}
      >
        {/* Category */}
        {product.category && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href={`/products?category=${product.category.slug}`} className={styles.category}>
              {product.category.name}
            </Link>
          </motion.div>
        )}
        
        {/* Product Name and Wishlist Button */}
        <motion.div 
          className={styles.productHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className={styles.productName}>{product.name}</h1>
          <div className={styles.headerWishlistContainer}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <WishlistButton productId={product.id} className={styles.headerWishlistButton} />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Variation (if applicable) - Moved up like in Gucci design */}
        <motion.div 
          className={styles.variation}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: 0.6, 
            type: "spring",
            stiffness: 200,
            damping: 25,
            duration: 0.8
          }}
        >
          <span className={styles.variationLabel}>Variation</span>
          <span className={styles.variationValue}>{product.shortDesc || 'Standard'}</span>
        </motion.div>
        
        {/* Price */}
        <motion.div 
          className={styles.priceContainer}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            delay: 0.8, 
            type: "spring", 
            stiffness: 180,
            damping: 20,
            duration: 0.9
          }}
        >
          <p className={styles.price}>
            <span className={styles.currency}>{product.currency}</span>
            {product.price.toFixed(2)}
          </p>
          
          {/* Rating */}
          {ratingCount > 0 && (
            <div className={styles.ratingContainer}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={i < Math.round(avgRating) ? styles.filledStar : styles.emptyStar}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.ratingCount}>({ratingCount})</span>
            </div>
          )}
        </motion.div>
        
        {/* Stock Status - Only show for out of stock or when stock is not low */}
        <div className={styles.stockStatus}>
          {product.stockQuantity <= 0 ? (
            <span className={styles.outOfStock}>Out of stock</span>
          ) : product.stockQuantity > 5 && (
            <span className={styles.inStock}>In stock: {product.stockQuantity} available</span>
          )}
        </div>
        
        {/* Add to Cart Form */}
        <motion.form 
          onSubmit={handleAddToCart} 
          className={styles.addToCartForm}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.quantityContainer}>
            <label htmlFor="quantity" className={styles.quantityLabel}>Quantity</label>
            <div className={styles.quantityControls}>
              <button 
                type="button" 
                className={styles.quantityButton}
                onClick={() => qty > 1 && setQty(qty - 1)}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="12" height="2" fill="currentColor"/>
                </svg>
              </button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max={product.stockQuantity}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className={styles.quantityInput}
                aria-label="Quantity"
              />
              <button 
                type="button" 
                className={styles.quantityButton}
                onClick={() => qty < product.stockQuantity && setQty(qty + 1)}
                disabled={qty >= product.stockQuantity}
                aria-label="Increase quantity"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect y="5" width="12" height="2" fill="currentColor"/>
                  <rect x="5" width="2" height="12" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              type="submit" 
              className={styles.addToCartButton}
              disabled={product.stockQuantity <= 0 || added}
            >
              {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
          </div>
          
          {error && <p className={styles.error}>{error}</p>}
        </motion.form>
        
        {/* Collapsible Sections */}
        <div className={styles.accordionSections}>
          {/* Description Section */}
          <motion.div 
            className={`${styles.accordionSection} ${expandedSections.description ? styles.expanded : ''}`}
            initial={false}
            animate={expandedSections.description ? "open" : "closed"}
          >
            <motion.button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('description')}
              aria-expanded={expandedSections.description}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <span className={styles.accordionTitle}>Description</span>
              <motion.span 
                className={styles.accordionIcon}
                variants={iconVariants}
                animate={expandedSections.description ? "open" : "closed"}
              >
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.span>
            </motion.button>
            
            <motion.div 
              className={`${styles.accordionContent} ${expandedSections.description ? styles.expanded : ''}`}
              variants={accordionVariants}
              initial="closed"
              animate={expandedSections.description ? "open" : "closed"}
              style={{ overflow: "hidden" }}
            >
              <motion.p 
                className={styles.description}
                variants={accordionContentVariants}
                initial="closed"
                animate={expandedSections.description ? "open" : "closed"}
              >
                {product.description}
              </motion.p>
            </motion.div>
          </motion.div>          {/* Specifications Section */}
          {product.specifications && (
            <motion.div 
              className={`${styles.accordionSection} ${expandedSections.specifications ? styles.expanded : ''}`}
              initial={false}
              animate={expandedSections.specifications ? "open" : "closed"}
            >
              <motion.button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('specifications')}
                aria-expanded={expandedSections.specifications}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.accordionTitle}>Specifications</span>
                <motion.span 
                  className={styles.accordionIcon}
                  variants={iconVariants}
                  animate={expandedSections.specifications ? "open" : "closed"}
                >
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              </motion.button>
              
              <motion.div 
                className={`${styles.accordionContent} ${expandedSections.specifications ? styles.expanded : ''}`}
                variants={accordionVariants}
                initial="closed"
                animate={expandedSections.specifications ? "open" : "closed"}
                style={{ overflow: "hidden" }}
              >
                <motion.div 
                  className={styles.specificationsList}
                  variants={accordionListVariants}
                  initial="closed"
                  animate={expandedSections.specifications ? "open" : "closed"}
                >
                  {formatSpecifications(product.specifications).map((spec, index) => (
                    <motion.div
                      key={index}
                      variants={accordionItemVariants}
                    >
                      {spec}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Care Instructions Section */}
          {product.careInstructions && (
            <motion.div 
              className={`${styles.accordionSection} ${expandedSections.care ? styles.expanded : ''}`}
              initial={false}
              animate={expandedSections.care ? "open" : "closed"}
            >
              <motion.button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('care')}
                aria-expanded={expandedSections.care}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.accordionTitle}>Care Instructions</span>
                <motion.span 
                  className={styles.accordionIcon}
                  variants={iconVariants}
                  animate={expandedSections.care ? "open" : "closed"}
                >
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              </motion.button>
              
              <motion.div 
                className={`${styles.accordionContent} ${expandedSections.care ? styles.expanded : ''}`}
                variants={accordionVariants}
                initial="closed"
                animate={expandedSections.care ? "open" : "closed"}
                style={{ overflow: "hidden" }}
              >
                <motion.div 
                  className={styles.careInstructionsList}
                  variants={accordionListVariants}
                  initial="closed"
                  animate={expandedSections.care ? "open" : "closed"}
                >
                  {formatCareInstructions(product.careInstructions).map((instruction, index) => (
                    <motion.div
                      key={index}
                      variants={accordionItemVariants}
                    >
                      {instruction}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Styling Inspiration Section */}
          {/* Styling Inspiration Gallery Section */}
          {product.stylingIdeaImages && product.stylingIdeaImages.length > 0 && (
            <motion.div 
              className={`${styles.accordionSection} ${expandedSections.styling ? styles.expanded : ''}`}
              initial={false}
              animate={expandedSections.styling ? "open" : "closed"}
            >
              <motion.button
                className={styles.accordionHeader}
                onClick={() => toggleSection('styling')}
                aria-expanded={expandedSections.styling}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.accordionTitle}>Styling Inspiration Gallery</span>
                <motion.span 
                  className={styles.accordionIcon}
                  variants={iconVariants}
                  animate={expandedSections.styling ? "open" : "closed"}
                >
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              </motion.button>
              <motion.div
                className={`${styles.accordionContent} ${expandedSections.styling ? styles.expanded : ''}`}
                variants={accordionVariants}
                initial="closed"
                animate={expandedSections.styling ? "open" : "closed"}
                style={{ overflow: "hidden", padding: expandedSections.styling ? '0' : undefined }}
              >
                <div className={styles.fullWidthSection}>
                  <motion.div 
                    className={styles.stylingGallery}
                    variants={galleryVariants}
                    initial="closed"
                    animate={expandedSections.styling ? "open" : "closed"}
                  >
                      {product.stylingIdeaImages.map((idea, index) => {
                        const image = typeof idea === 'string' ? { url: idea } : idea;
                        const defaultCaptions = [
                          "Tradition reimagined – detailed Indian craftsmanship in its purest form.",
                          "Elevate your table setting with this elegant piece, adorned with gold accents and crystal embellishments — the perfect blend of art and function.",
                          "Delicate beauty meets functionality — a handcrafted piece paired with soft-toned tableware and dried florals for a refined, romantic aesthetic."
                        ];

                        return (
                          <motion.div 
                            key={index} 
                            className={styles.galleryItem}
                            variants={galleryItemVariants}
                          >
                            <motion.div 
                              className={styles.galleryImageWrap}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.img 
                                src={image.url} 
                                alt={`Styling idea ${index + 1}`} 
                                className={styles.galleryImage} 
                                loading="lazy"
                                variants={galleryImageVariants}
                              />
                              <motion.div 
                                className={styles.galleryOverlay}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                              >
                                <motion.span 
                                  className={styles.galleryLabel}
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ delay: 0.5 + (index * 0.1) }}
                                >
                                  Featured Styling
                                </motion.span>
                              </motion.div>
                            </motion.div>
                            <motion.div 
                              className={styles.galleryText}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + (index * 0.1) }}
                            >
                              <motion.p 
                                className={styles.galleryCaption}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + (index * 0.1) }}
                              >
                                {image.text || defaultCaptions[index % defaultCaptions.length]}
                              </motion.p>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* You might also like section - Horizontal carousel with swipeable product cards */}
      {similarProducts.length > 0 && (
        <motion.div 
          className={styles.similarProductsSection}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.h2 
            className={styles.similarProductsTitle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            You might also like
          </motion.h2>
          
          <motion.div 
            className={styles.similarProductsCarousel}
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{
              scrollSnapType: 'x mandatory',
              scrollPaddingLeft: '0'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            {similarProducts.map((similarProduct, index) => (
              <motion.div 
                key={similarProduct.id} 
                className={styles.cardWrapper}
                style={{ scrollSnapAlign: 'start' }}
                variants={carouselCardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ delay: 1.1 + (index * 0.1) }}
              >
                <Link href={`/products/${similarProduct.id}`} className={styles.card}>
                  <div 
                    className={styles.imageContainer}
                    ref={el => productRefs.current[similarProduct.id] = el}
                    onTouchStart={(e) => handleProductTouchStart(e, similarProduct.id)}
                    onTouchMove={(e) => handleProductTouchMove(e, similarProduct.id)}
                    onTouchEnd={() => handleProductTouchEnd(similarProduct.id)}
                  >
                    <div 
                      className={styles.imageSlider} 
                      style={getProductImageTransform(similarProduct.id)}
                    >
                      {similarProduct.imageUrls.map((url, index) => (
                        <div key={index} className={styles.imageSlide}>
                          <img 
                            src={url}
                            alt={`${similarProduct.name} - Image ${index + 1}`}
                            className={styles.image}
                            loading="lazy"
                            draggable="false"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {similarProduct.imageUrls.length === 0 && (
                      <div className={styles.noImage}>No image</div>
                    )}
                    
                    {similarProduct.isNew && <span className={styles.badge}>New</span>}
                    {similarProduct.stockQuantity === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
                    {similarProduct.stockQuantity > 0 && similarProduct.stockQuantity <= 5 && (
                      <div className={styles.cardLowStock}>Only {similarProduct.stockQuantity} left</div>
                    )}
                    
                    {/* Image indicators */}
                    {similarProduct.imageUrls.length > 1 && (
                      <div className={styles.imageIndicators}>
                        {similarProduct.imageUrls.map((_, index) => (
                          <div 
                            key={index} 
                            className={`${styles.indicator} ${index === (currentImageIndices[similarProduct.id] || 0) ? styles.activeIndicator : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.info}>
                    {similarProduct.category && (
                      <div className={styles.categoryTag}>
                        {similarProduct.category.name}
                      </div>
                    )}
                    <h3 className={styles.name}>{similarProduct.name}</h3>
                    
                    
                    <div className={styles.priceRow}>
                      <p className={styles.price}>{formatPrice(similarProduct.price)}</p>
                      {similarProduct.avgRating && similarProduct.avgRating > 0 && (
                        <p className={styles.productRating}>
                          <span className={styles.starFilled}>★</span> 
                          <span className={styles.ratingValue}>{similarProduct.avgRating.toFixed(1)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                
                <div className={styles.wishlistContainer} onClick={handleWishlistClick}>
                  <WishlistButton 
                    productId={similarProduct.id} 
                    className={`${styles.wishlistButton} ${styles.blackWishlist}`}
                    preventNavigation={true}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Single line carousel pagination indicator */}
          {similarProducts.length > carouselItemsPerView && (
            <div className={styles.carouselPagination}>
              <div 
                className={styles.paginationIndicatorActive} 
                style={{ 
                  width: `${100 / Math.ceil(similarProducts.length / carouselItemsPerView)}px`,
                  transform: `translateX(${scrollProgress * (100 - (100 / Math.ceil(similarProducts.length / carouselItemsPerView)))}px)`
                }}
              />
            </div>
          )}
          
          {/* Link to view more similar products in this category */}
          {product.category && (
            <div className={styles.viewAllSimilarWrapper}>
              <Link href={`/products?category=${product.category.slug}`} className={styles.viewAllSimilarLink}>
                View all {product.category.name} products →
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}