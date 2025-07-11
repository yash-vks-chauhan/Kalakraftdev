import { useState, useEffect, useRef, TouchEvent } from "react";
import Image from "next/image";
import styles from "./ProductImagesMobile.module.css";

export default function ProductImagesMobile({ 
  imageUrls, 
  name 
}: { 
  imageUrls: string[]; 
  name: string 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef<number>(0);

  // Preload images and initialize loaded state array
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;
    
    // Preload all images
    imageUrls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
    
    // Initialize image loaded state array
    setImageLoaded(new Array(imageUrls.length).fill(false));
  }, [imageUrls]);

  // Update container width on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerWidthRef.current = containerRef.current.offsetWidth;
        
        // Update carousel position when resizing
        updateCarouselPosition(currentIndex, true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call to set width
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentIndex]);

  // Update carousel position when current index changes
  useEffect(() => {
    updateCarouselPosition(currentIndex);
  }, [currentIndex]);

  const updateCarouselPosition = (index: number, immediate = false) => {
    if (!carouselRef.current || containerWidthRef.current === 0) return;
    
    const offset = -index * containerWidthRef.current;
    
    if (immediate) {
      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = `translateX(${offset}px)`;
      // Force reflow to ensure the transition is removed before setting it back
      void carouselRef.current.offsetWidth;
      carouselRef.current.style.transition = '';
    } else {
      carouselRef.current.style.transform = `translateX(${offset}px)`;
    }
    
    setSwipeOffset(offset);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex === imageUrls.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current) {
      containerWidthRef.current = containerRef.current.offsetWidth;
    }
    
    if (carouselRef.current) {
      // Remove transition during active swiping for immediate response
      carouselRef.current.style.transition = 'none';
    }
    
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping || !imageUrls || imageUrls.length <= 1) return;
    
    // Prevent default to avoid page scrolling while swiping
    e.preventDefault();
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate drag distance
    const dragDistance = currentTouch - touchStart;
    
    // Apply drag to carousel
    if (carouselRef.current) {
      const newOffset = swipeOffset + dragDistance;
      carouselRef.current.style.transform = `translateX(${newOffset}px)`;
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (!carouselRef.current || !touchStart || !touchEnd || containerWidthRef.current === 0) {
      // Reset to current position
      updateCarouselPosition(currentIndex);
      return;
    }
    
    // Add transition back for smooth movement
    carouselRef.current.style.transition = 'transform 0.3s ease';
    
    // Calculate swipe distance and direction
    const distance = touchStart - touchEnd;
    const swipeThreshold = containerWidthRef.current * 0.2; // 20% of container width
    
    if (Math.abs(distance) < swipeThreshold) {
      // Not swiped far enough, snap back to current slide
      updateCarouselPosition(currentIndex);
    } else {
      // Determine direction and update index
      if (distance > 0) {
        // Swiped left, go to next
        handleNext();
      } else {
        // Swiped right, go to previous
        handlePrev();
      }
    }
    
    // Reset touch values
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleTouchCancel = () => {
    setIsSwiping(false);
    updateCarouselPosition(currentIndex);
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={styles.productImagesContainer}>
        <div className={styles.imageContainer}>
          <div className={styles.noImagePlaceholder}>
            <span>No image available</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productImagesContainer}>
      <div 
        ref={containerRef}
        className={styles.imageContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div 
          ref={carouselRef}
          className={`${styles.carousel} ${isTransitioning ? styles.transitioning : ''} ${isSwiping ? styles.swiping : ''}`}
        >
          {imageUrls.map((url, index) => (
            <div key={index} className={styles.carouselItem}>
              <div className={styles.imageInnerWrapper}>
                <Image
                  src={url}
                  alt={`${name} - Image ${index + 1}`}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  className={`${styles.mainImage} ${imageLoaded[index] ? styles.loaded : ''}`}
                  quality={100}
                  draggable="false"
                  onLoad={() => handleImageLoad(index)}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className={`${styles.navigationButton} ${styles.prev}`}
              aria-label="Previous image"
              disabled={isTransitioning}
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navigationButton} ${styles.next}`}
              aria-label="Next image"
              disabled={isTransitioning}
            >
              →
            </button>
          </>
        )}

        {/* Page indicator lines */}
        {imageUrls.length > 1 && (
          <div className={styles.pageIndicator}>
            {imageUrls.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicatorDot} ${index === currentIndex ? styles.active : ""}`}
                onClick={() => !isTransitioning && setCurrentIndex(index)}
                aria-label={`View image ${index + 1}`}
                disabled={isTransitioning}
              />
            ))}
          </div>
        )}

        {/* Current image counter */}
        {imageUrls.length > 1 && (
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>
    </div>
  );
} 