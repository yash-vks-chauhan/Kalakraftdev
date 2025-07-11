import { useState, useEffect, useRef, TouchEvent } from "react";
import Image from "next/image";
import styles from "./ProductImagesMobile.module.css";

type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 
  'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 
  'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

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
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
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
        
        // Update slider position when resizing
        updateSliderPosition(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call to set width
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentIndex]);

  // Update slider position when current index changes
  useEffect(() => {
    updateSliderPosition(true);
    updateProgressBar();
  }, [currentIndex]);

  const updateSliderPosition = (animate: boolean) => {
    if (!sliderRef.current) return;
    
    if (animate) {
      sliderRef.current.style.transition = 'transform 0.3s ease';
    } else {
      sliderRef.current.style.transition = 'none';
    }
    
    sliderRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Reset swipe distance
    setSwipeDistance(0);
  };

  // Update the progress bar based on current index
  const updateProgressBar = () => {
    if (!progressRef.current || imageUrls.length <= 1) return;
    
    const progress = (currentIndex / (imageUrls.length - 1)) * 100;
    const scaleX = currentIndex / (imageUrls.length - 1);
    
    progressRef.current.style.transform = `scaleX(${scaleX})`;
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!imageUrls || imageUrls.length <= 1) return;
    
    if (containerRef.current) {
      containerWidthRef.current = containerRef.current.offsetWidth;
    }
    
    if (sliderRef.current) {
      // Remove transition during active swiping for immediate response
      sliderRef.current.style.transition = 'none';
    }
    
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
    setIsSwiping(true);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping || !imageUrls || imageUrls.length <= 1) return;
    
    // Prevent default to avoid page scrolling while swiping
    e.preventDefault();
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate how far the user has swiped
    const distance = currentTouch - touchStart;
    
    // Apply resistance at the edges
    let finalDistance = distance;
    if ((currentIndex === 0 && distance > 0) || 
        (currentIndex === imageUrls.length - 1 && distance < 0)) {
      // Apply resistance at edges - finger moves 3x more than image
      finalDistance = distance / 3;
    }
    
    setSwipeDistance(finalDistance);
    
    // Apply real-time dragging effect to the slider
    if (sliderRef.current) {
      const offset = -currentIndex * 100;
      const percentageOffset = containerWidthRef.current ? (finalDistance / containerWidthRef.current) * 100 : 0;
      sliderRef.current.style.transform = `translateX(calc(${offset}% + ${percentageOffset}%))`;
    }
    
    // Update progress bar during swipe for smooth transition
    if (progressRef.current && imageUrls.length > 1) {
      const totalProgress = imageUrls.length - 1;
      const currentProgress = currentIndex;
      const swipeProgress = containerWidthRef.current ? -finalDistance / containerWidthRef.current : 0;
      const newProgress = Math.max(0, Math.min(1, (currentProgress + swipeProgress) / totalProgress));
      
      progressRef.current.style.transform = `scaleX(${newProgress})`;
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (!sliderRef.current || !touchStart || !touchEnd || containerWidthRef.current === 0) {
      updateSliderPosition(true);
      updateProgressBar();
      return;
    }
    
    // Add transition back for smooth movement
    sliderRef.current.style.transition = 'transform 0.3s ease';
    
    // Calculate swipe distance and direction
    const distance = touchStart - touchEnd;
    const swipeThreshold = containerWidthRef.current * 0.2; // 20% of container width
    
    if (Math.abs(distance) < swipeThreshold) {
      // Not swiped far enough, snap back to current slide
      updateSliderPosition(true);
    } else {
      // Determine direction and update index
      if (distance > 0 && currentIndex < imageUrls.length - 1) {
        // Swiped left, go to next
        setCurrentIndex(currentIndex + 1);
      } else if (distance < 0 && currentIndex > 0) {
        // Swiped right, go to previous
        setCurrentIndex(currentIndex - 1);
      } else {
        // At the edge, snap back
        updateSliderPosition(true);
      }
    }
    
    // Reset touch values
    setTouchStart(0);
    setTouchEnd(0);
    setSwipeDistance(0);
    
    // Update progress bar
    updateProgressBar();
  };

  const handleTouchCancel = () => {
    setIsSwiping(false);
    updateSliderPosition(true);
    updateProgressBar();
  };

  // Handle manual image navigation with tap
  const handleImageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrls || imageUrls.length <= 1) return;
    
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const tapX = e.nativeEvent.offsetX;
    
    // Tap on right third of image - go next
    if (tapX > containerWidth * 0.7 && currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    // Tap on left third of image - go previous
    else if (tapX < containerWidth * 0.3 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Determine if the image is a product that needs special handling
  const isProductWithBackground = (url: string) => {
    // Check if the image URL contains certain keywords that indicate it's a product
    return url.toLowerCase().includes('clock') || 
           url.toLowerCase().includes('tray') || 
           url.toLowerCase().includes('pot') ||
           url.toLowerCase().includes('decor') ||
           url.toLowerCase().includes('rangoli') ||
           url.toLowerCase().includes('resin');
  };

  // Get the appropriate blend mode based on image type
  const getBlendMode = (url: string): MixBlendMode => {
    const lowerUrl = url.toLowerCase();
    // For pink/light colored items, isolation works better
    if (lowerUrl.includes('pink') || 
        lowerUrl.includes('light') || 
        lowerUrl.includes('white') ||
        lowerUrl.includes('tray')) {
      return 'multiply';
    }
    // For dark items
    return 'multiply';
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

  // Calculate progress percentage for the progress bar
  const progressPercentage = imageUrls.length > 1 
    ? (currentIndex / (imageUrls.length - 1)) * 100 
    : 100;

  return (
    <div className={styles.productImagesContainer}>
      <div 
        ref={containerRef}
        className={styles.imageContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleImageTap}
      >
        <div 
          ref={sliderRef}
          className={styles.imageSlider}
        >
          {imageUrls.map((url, index) => (
            <div key={index} className={styles.imageSlide}>
              <div 
                className={styles.imageWrapper}
                style={{ backgroundColor: '#f0f0f0' }}
              >
                <div className={styles.imageBackground}></div>
                <Image
                  src={url}
                  alt={`${name} - Image ${index + 1}`}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  className={`${styles.mainImage} ${imageLoaded[index] ? styles.loaded : ''}`}
                  quality={100}
                  draggable={false}
                  onLoad={() => handleImageLoad(index)}
                  style={{ 
                    objectFit: 'contain',
                    mixBlendMode: getBlendMode(url)
                  }}
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
              disabled={currentIndex === 0}
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navigationButton} ${styles.next}`}
              aria-label="Next image"
              disabled={currentIndex === imageUrls.length - 1}
            >
              →
            </button>
          </>
        )}

        {/* Current image counter */}
        {imageUrls.length > 1 && (
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>
      
      {/* Progress bar indicator */}
      {imageUrls.length > 1 && (
        <div className={styles.pageIndicator}>
          <div 
            ref={progressRef} 
            className={styles.progressBar}
            style={{ transform: `scaleX(${currentIndex / (imageUrls.length - 1)})` }}
          ></div>
        </div>
      )}
    </div>
  );
} 