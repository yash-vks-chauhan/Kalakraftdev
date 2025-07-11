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
  const [swipeDistance, setSwipeDistance] = useState(0);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef<number>(0);

  // Preload images for smoother transitions
  useEffect(() => {
    if (!imageUrls || imageUrls.length <= 1) return;
    
    // Preload all images
    imageUrls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, [imageUrls]);

  const handlePrev = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIdx) => (prevIdx === 0 ? imageUrls.length - 1 : prevIdx - 1));
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIdx) => (prevIdx === imageUrls.length - 1 ? 0 : prevIdx + 1));
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: TouchEvent) => {
    // Store container width for calculations
    if (imageRef.current) {
      containerWidthRef.current = imageRef.current.offsetWidth;
    }
    
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
    setSwipeDistance(0);
    
    // Remove transition during active swiping for immediate response
    if (imageRef.current) {
      imageRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping || !imageUrls || imageUrls.length <= 1) return;
    
    // Prevent default to avoid page scrolling while swiping
    e.preventDefault();
    
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Apply real-time dragging effect only to the image
    if (imageRef.current) {
      const dragDistance = e.targetTouches[0].clientX - touchStart;
      setSwipeDistance(dragDistance);
      
      // Apply resistance at the edges
      let finalDistance = dragDistance;
      if ((currentIndex === 0 && dragDistance > 0) || 
          (currentIndex === imageUrls.length - 1 && dragDistance < 0)) {
        // Apply resistance at edges - finger moves 3x more than image
        finalDistance = dragDistance / 3;
      }
      
      // Use translate3d for hardware acceleration
      imageRef.current.style.transform = `translate3d(${finalDistance}px, 0, 0)`;
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (!imageRef.current || !touchStart || !touchEnd) {
      return;
    }
    
    // Reset transform with smooth transition
    imageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    
    // Determine if swipe was significant enough to change slides
    const distance = touchStart - touchEnd;
    const swipeThreshold = containerWidthRef.current * 0.2; // 20% of container width
    
    if (Math.abs(distance) < swipeThreshold) {
      // Not swiped far enough, snap back
      imageRef.current.style.transform = '';
    } else {
      if (distance > 0 && currentIndex < imageUrls.length - 1) {
        // Swiped left, go to next image
        handleNext();
      } else if (distance < 0 && currentIndex > 0) {
        // Swiped right, go to previous image
        handlePrev();
      } else {
        // At the edge, snap back
        imageRef.current.style.transform = '';
      }
    }
    
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
    setSwipeDistance(0);
  };

  // Reset transform when touch is cancelled
  const handleTouchCancel = () => {
    setIsSwiping(false);
    if (imageRef.current) {
      imageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
      imageRef.current.style.transform = '';
    }
    setSwipeDistance(0);
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
        className={styles.imageContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div 
          ref={imageRef}
          className={`${styles.imageWrapper} ${isTransitioning ? styles.transitioning : ''}`}
        >
          <Image
            src={imageUrls[currentIndex]}
            alt={`${name} - Image ${currentIndex + 1}`}
            fill
            sizes="100vw"
            priority={currentIndex === 0}
            className={styles.mainImage}
            quality={100} // Ensure high quality for better transparency
          />
        </div>
        
        {/* Navigation buttons - simplified for Gucci style */}
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

        {/* Page indicator lines - like in Gucci design */}
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

        {/* Current image counter - in bottom right corner */}
        {imageUrls.length > 1 && (
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>
    </div>
  );
} 