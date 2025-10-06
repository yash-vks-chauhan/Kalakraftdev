import { useState, useEffect, useRef, TouchEvent, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
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
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Motion values for smooth dragging
  const x = useMotionValue(0);
  const dragX = useMotionValue(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Touch tracking
  const touchStartRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

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

  // Update progress bar based on current index
  const updateProgressBar = useCallback(() => {
    if (!progressRef.current || imageUrls.length <= 1) return;
    
    const progress = currentIndex / (imageUrls.length - 1);
    progressRef.current.style.transform = `scaleX(${progress})`;
  }, [currentIndex, imageUrls.length]);

  // Update slider position when current index changes
  useEffect(() => {
    const targetX = -currentIndex * 100;
    animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.4
    });
    updateProgressBar();
  }, [currentIndex, x, updateProgressBar]);

  // Handle navigation
  const handlePrev = useCallback(() => {
    if (currentIndex > 0 && !isDragging) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, isDragging]);

  const handleNext = useCallback(() => {
    if (currentIndex < imageUrls.length - 1 && !isDragging) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, imageUrls.length, isDragging]);

  // Improved touch handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!imageUrls || imageUrls.length <= 1) return;
    
    const touch = e.touches[0];
    touchStartRef.current = touch.clientX;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);
    
    // Reset drag value
    dragX.set(0);
  }, [imageUrls, dragX]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || !imageUrls || imageUrls.length <= 1) return;
    
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current;
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    
    // Apply resistance at edges
    let adjustedDelta = deltaX;
    if ((currentIndex === 0 && deltaX > 0) || 
        (currentIndex === imageUrls.length - 1 && deltaX < 0)) {
      // Softer resistance - only 50% reduction instead of 66%
      adjustedDelta = deltaX * 0.5;
    }
    
    // Convert to percentage
    const dragPercentage = (adjustedDelta / containerWidth) * 100;
    dragX.set(dragPercentage);
    
    // Update progress bar smoothly during drag
    if (progressRef.current && imageUrls.length > 1) {
      const currentProgress = currentIndex / (imageUrls.length - 1);
      const dragProgress = -adjustedDelta / containerWidth / (imageUrls.length - 1);
      const newProgress = Math.max(0, Math.min(1, currentProgress + dragProgress));
      progressRef.current.style.transform = `scaleX(${newProgress})`;
    }
  }, [currentIndex, imageUrls, dragX]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    const deltaX = dragX.get();
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const threshold = (containerWidth * 0.15) / containerWidth * 100; // 15% threshold as percentage
    const velocity = Math.abs(deltaX) / (Date.now() - startTimeRef.current);
    
    // Reset drag
    dragX.set(0);
    
    // Determine if we should change slides
    if (Math.abs(deltaX) > threshold || velocity > 0.5) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        setCurrentIndex(currentIndex - 1);
      } else if (deltaX < 0 && currentIndex < imageUrls.length - 1) {
        // Swipe left - go to next
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    // Update progress bar
    updateProgressBar();
  }, [currentIndex, imageUrls.length, dragX, updateProgressBar]);

  // Handle manual image navigation with tap
  const handleImageTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrls || imageUrls.length <= 1 || isDragging) return;
    
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
  }, [imageUrls, currentIndex, isDragging]);

  const handleImageLoad = useCallback((index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  }, []);

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

  // Calculate the transform combining base position and drag
  const combinedX = useTransform([x, dragX], ([baseX, drag]) => `${(baseX as number) + (drag as number)}%`);

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
    <motion.div 
      className={styles.productImagesContainer}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        duration: 0.8
      }}
    >
      <motion.div 
        ref={containerRef}
        className={styles.imageContainer}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 20,
          duration: 0.9,
          delay: 0.2
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageTap}
      >
        <motion.div 
          className={styles.imageSlider}
          style={{ 
            x: combinedX,
            scale: isDragging ? 0.985 : 1
          }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 400,
              damping: 30
            }
          }}
        >
          {imageUrls.map((url, index) => (
            <motion.div 
              key={index} 
              className={styles.imageSlide}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: index === currentIndex ? 0 : 10
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
                duration: 0.6,
                delay: index * 0.1
              }}
            >
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
                  quality={75}
                  draggable={false}
                  onLoad={() => handleImageLoad(index)}
                  style={{ 
                    objectFit: 'contain',
                    mixBlendMode: getBlendMode(url)
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
        
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
      </motion.div>
      
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
    </motion.div>
  );
} 