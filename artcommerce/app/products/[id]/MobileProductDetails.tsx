'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductImagesMobile from '../../components/ProductImagesMobile';
import { useCart } from '../../contexts/CartContext';
import WishlistButton from '../../components/WishlistButton';
import styles from './mobile_product_details.module.css';

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
    <div className={styles.mobileProductContainer}>
      {/* Product Images - Full width with transparent background */}
      <div className={styles.productImageWrapper}>
        <ProductImagesMobile 
          imageUrls={product.imageUrls} 
          name={product.name} 
        />
        {/* Low Stock Banner - Only show for products with low stock (5 or less) */}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <div className={styles.cardLowStock}>
            Only {product.stockQuantity} left
          </div>
        )}
      </div>
      
      {/* Share feedback toast */}
      <div className={`${styles.shareToast} ${shareSuccess !== null ? styles.shareToastVisible : ''}`}>
        {shareSuccess 
          ? (shareMethod === 'webshare' 
            ? 'Product shared successfully!' 
            : 'Product link copied to clipboard!')
          : (shareMethod === 'webshare'
            ? 'Failed to share product'
            : 'Failed to copy product link')}
      </div>
      
      {/* Product Info - Overlapping the image slightly with rounded corners */}
      <div className={styles.productInfo}>
        {/* Category */}
        {product.category && (
          <Link href={`/products?category=${product.category.slug}`} className={styles.category}>
            {product.category.name}
          </Link>
        )}
        
        {/* Product Name and Wishlist Button */}
        <div className={styles.productHeader}>
          <h1 className={styles.productName}>{product.name}</h1>
          <div className={styles.headerWishlistContainer}>
            <WishlistButton productId={product.id} className={styles.headerWishlistButton} />
          </div>
        </div>
        
        {/* Variation (if applicable) - Moved up like in Gucci design */}
        <div className={styles.variation}>
          <span className={styles.variationLabel}>Variation</span>
          <span className={styles.variationValue}>{product.shortDesc || 'Standard'}</span>
        </div>
        
        {/* Price */}
        <div className={styles.priceContainer}>
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
        </div>
        
        {/* Stock Status - Only show for out of stock or when stock is not low */}
        <div className={styles.stockStatus}>
          {product.stockQuantity <= 0 ? (
            <span className={styles.outOfStock}>Out of stock</span>
          ) : product.stockQuantity > 5 && (
            <span className={styles.inStock}>In stock: {product.stockQuantity} available</span>
          )}
        </div>
        
        {/* Add to Cart Form */}
        <form onSubmit={handleAddToCart} className={styles.addToCartForm}>
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
        </form>
        
        {/* Collapsible Sections */}
        <div className={styles.accordionSections}>
          {/* Description Section */}
          <div className={styles.accordionSection}>
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('description')}
              aria-expanded={expandedSections.description}
            >
              <span className={styles.accordionTitle}>Description</span>
              <span className={styles.accordionIcon} style={{ transform: expandedSections.description ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            
            <div className={`${styles.accordionContent} ${expandedSections.description ? styles.expanded : ''}`}>
              <p className={styles.description}>{product.description}</p>
            </div>
          </div>
          
          {/* Specifications Section */}
          {product.specifications && (
            <div className={styles.accordionSection}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('specifications')}
                aria-expanded={expandedSections.specifications}
              >
                <span className={styles.accordionTitle}>Specifications</span>
                <span className={styles.accordionIcon} style={{ transform: expandedSections.specifications ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              
              <div className={`${styles.accordionContent} ${expandedSections.specifications ? styles.expanded : ''}`}>
                <div className={styles.specificationsList}>
                  {formatSpecifications(product.specifications)}
                </div>
              </div>
            </div>
          )}
          
          {/* Care Instructions Section */}
          {product.careInstructions && (
            <div className={styles.accordionSection}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('care')}
                aria-expanded={expandedSections.care}
              >
                <span className={styles.accordionTitle}>Care Instructions</span>
                <span className={styles.accordionIcon} style={{ transform: expandedSections.care ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              
              <div className={`${styles.accordionContent} ${expandedSections.care ? styles.expanded : ''}`}>
                <p className={styles.careInstructions}>{product.careInstructions}</p>
              </div>
            </div>
          )}
          
          {/* Styling Inspiration Gallery Section */}
          {product.stylingIdeaImages && product.stylingIdeaImages.length > 0 && (
            <div className={styles.accordionSection}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('styling')}
                aria-expanded={expandedSections.styling}
              >
                <span className={styles.accordionTitle}>Styling Inspiration Gallery</span>
                <span className={styles.accordionIcon} style={{ transform: expandedSections.styling ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              
              <div className={`${styles.accordionContent} ${expandedSections.styling ? styles.expanded : ''}`}>
                <div className={styles.stylingGallery}>
                  {product.stylingIdeaImages.map((item, index) => {
                    const imageObj = typeof item === 'string' ? { url: item, text: '' } : item;
                    const defaultCaptions = [
                      "Living Room: Creates a calming focal point that ties the space together",
                      "Office Setting: Adds artistic flair to professional environments",
                      "Dining Area: Complements mealtime with artistic elegance"
                    ];
                    
                    // Determine the label based on image count
                    let spaceLabel = "Living Space";
                    const imageCount = product.stylingIdeaImages?.length || 0;
                    if (imageCount === 1) {
                      spaceLabel = "Featured Styling";
                    } else if (imageCount === 2) {
                      spaceLabel = index === 0 ? "Living Space" : "Workspace";
                    } else {
                      spaceLabel = index === 0 ? "Living Space" : index === 1 ? "Workspace" : "Dining Area";
                    }
                    
                    return (
                      <div key={index} className={styles.galleryItem}>
                        <div className={styles.galleryImageWrap}>
                          <img 
                            src={imageObj.url} 
                            alt={`Styling inspiration ${index + 1}`} 
                            className={styles.galleryImage} 
                            loading="lazy" 
                          />
                          <div className={styles.galleryOverlay}>
                            <span className={styles.galleryLabel}>
                              {spaceLabel}
                            </span>
                          </div>
                        </div>
                        <div className={styles.galleryCaption}>
                          <p>{imageObj.text || defaultCaptions[index % defaultCaptions.length]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.stylingFooter}>
                  <p>Bring art into your everyday life with thoughtful placement and styling</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* You might also like section - Horizontal carousel with swipeable product cards */}
      {similarProducts.length > 0 && (
        <div className={styles.similarProductsSection}>
          <h2 className={styles.similarProductsTitle}>You might also like</h2>
          
          <div 
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
          >
            {similarProducts.map(similarProduct => (
              <div 
                key={similarProduct.id} 
                className={styles.cardWrapper}
                style={{ scrollSnapAlign: 'start' }}
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
                    
                    {/* Short description - only show if there's space and no rating */}
                    {similarProduct.shortDesc && (!similarProduct.avgRating || similarProduct.avgRating <= 0) && (
                      <p className={styles.shortDesc}>
                        {similarProduct.shortDesc.length > 60 
                          ? `${similarProduct.shortDesc.substring(0, 60)}...` 
                          : similarProduct.shortDesc}
                      </p>
                    )}
                    
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
              </div>
            ))}
          </div>
          
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
        </div>
      )}
    </div>
  );
}