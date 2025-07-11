import { useState, useEffect, useRef, TouchEvent } from "react";
import Image from "next/image";
import styles from "./ProductImages.module.css";

export default function ProductImages({ imageUrls, name }: { imageUrls: string[]; name: string }) {
  const [mainIdx, setMainIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handlePrev = () => {
    setMainIdx((prevIdx) => (prevIdx === 0 ? imageUrls.length - 1 : prevIdx - 1));
  };

  const handleNext = () => {
    setMainIdx((prevIdx) => (prevIdx === imageUrls.length - 1 ? 0 : prevIdx + 1));
  };

  // Enhanced touch handlers for smoother swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartX.current || !isSwiping) return;
    
    touchEndX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    
    // Calculate how much to move during the swipe
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth;
      const maxOffset = containerWidth * 0.3; // Limit swipe to 30% of container width
      
      // Constrain the offset to avoid swiping too far
      let offset = diff;
      if (
        (mainIdx === 0 && diff < 0) || // First image, swiping right
        (mainIdx === imageUrls.length - 1 && diff > 0) // Last image, swiping left
      ) {
        offset = diff * 0.3; // Add resistance when at edges
      }
      
      // Limit the offset to maxOffset
      offset = Math.max(Math.min(offset, maxOffset), -maxOffset);
      
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    
    const diffX = touchStartX.current - touchEndX.current;
    
    // If the swipe is significant enough (more than 50px)
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swiped left, go to next image
        handleNext();
      } else {
        // Swiped right, go to previous image
        handlePrev();
      }
    }
    
    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  // Cancel swipe if touch is canceled
  const handleTouchCancel = () => {
    touchStartX.current = null;
    touchEndX.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={`${styles.imageContainer} ${styles.noImagePlaceholder}`}>
        <span className={styles.noImageText}>No image available</span>
      </div>
    );
  }

  // Mobile-specific Gucci-style gallery
  if (isMobile) {
    return (
      <div className={styles.mobileGalleryContainer}>
        <div 
          className={styles.mobileImageSlider}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          ref={sliderRef}
        >
          <div 
            className={styles.mobileSliderTrack} 
            style={{ 
              transform: `translateX(calc(${-mainIdx * 100}% - ${swipeOffset}px))`,
              width: `${imageUrls.length * 100}%`,
              transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {imageUrls.map((src, idx) => (
              <div key={idx} className={styles.mobileSlide}>
                <Image
                  src={src}
                  alt={`${name} (image ${idx + 1})`}
                  width={800}
                  height={800}
                  className={styles.mobileImage}
                  priority={idx === mainIdx}
                  unoptimized
                />
              </div>
            ))}
          </div>
          
          {/* Image counter in Gucci style */}
          <div className={styles.imageCounter}>
            {mainIdx + 1} / {imageUrls.length}
          </div>
          
          {/* Gucci-style image indicator at bottom */}
          <div className={styles.mobileImageIndicator}>
            <div className={styles.indicatorTrack}>
              <div 
                className={styles.indicatorProgress} 
                style={{ 
                  width: `${((mainIdx + 1) / imageUrls.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version remains unchanged
  return (
    <div className={styles.imageContainer}>
      {/* Main/displayed image */}
      <div className={styles.mainImageWrapper}>
        <Image
          src={imageUrls[mainIdx]}
          alt={`${name} (main image)`}
          width={800}
          height={600}
          className={styles.mainImage}
        />

        {/* Navigation Arrows */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className={`${styles.navigationButton} ${styles.prev}`}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navigationButton} ${styles.next}`}
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbnailStrip}>
        {imageUrls.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setMainIdx(idx)}
            className={`${styles.thumbnailButton} ${idx === mainIdx ? styles.active : ""}`}
          >
            <Image
              src={src}
              alt={`${name} (thumb ${idx + 1})`}
              width={100}
              height={75}
              className={styles.thumbnailImage}
            />
          </button>
        ))}
      </div>
    </div>
  );
} 