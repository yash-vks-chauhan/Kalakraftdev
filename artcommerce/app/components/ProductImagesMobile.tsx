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
  
  const imageContainerRef = useRef<HTMLDivElement>(null);

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
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Apply real-time dragging effect if container ref exists
    if (imageContainerRef.current) {
      const dragDistance = e.targetTouches[0].clientX - touchStart;
      setSwipeDistance(dragDistance);
      
      // Limit the drag effect (don't allow dragging too far)
      const limitedDrag = Math.max(Math.min(dragDistance, 100), -100);
      imageContainerRef.current.style.transform = `translateX(${limitedDrag}px)`;
      imageContainerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Reset transform with smooth transition
    if (imageContainerRef.current) {
      imageContainerRef.current.style.transition = 'transform 0.3s ease-out';
      imageContainerRef.current.style.transform = '';
    }
    
    // Determine if swipe was significant enough to change slides
    const swipeThreshold = 75;
    if (touchStart - touchEnd > swipeThreshold) {
      // Swipe left
      handleNext();
    } else if (touchStart - touchEnd < -swipeThreshold) {
      // Swipe right
      handlePrev();
    }
    
    // Reset swipe distance
    setSwipeDistance(0);
  };

  // Reset transform when touch is cancelled
  const handleTouchCancel = () => {
    setIsSwiping(false);
    if (imageContainerRef.current) {
      imageContainerRef.current.style.transition = 'transform 0.3s ease-out';
      imageContainerRef.current.style.transform = '';
    }
    setSwipeDistance(0);
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={styles.imageContainer}>
        <div className={styles.noImagePlaceholder}>
          <span>No image available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productImagesContainer}>
      <div 
        className={`${styles.imageContainer} ${isTransitioning ? styles.transitioning : ''}`}
        ref={imageContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
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