// @ts-nocheck
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
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  
  // Motion values for smooth animations
  const x = useMotionValue(0);
  const dragProgress = useTransform(x, [-300, 0, 300], [-1, 0, 1]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Smooth swipe threshold
  const SWIPE_THRESHOLD = 50;
  const SWIPE_VELOCITY_THRESHOLD = 500;

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
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call to set width
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset x position when currentIndex changes
  useEffect(() => {
    animate(x, 0, { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] });
  }, [currentIndex, x]);

  // Optimized navigation functions
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, imageUrls.length]);

  // Handle drag end with smooth snapping
  const handleDragEnd = useCallback((_, info) => {
    const { offset, velocity } = info;
    const swipeDistance = Math.abs(offset.x);
    const swipeVelocity = Math.abs(velocity.x);

    if (swipeDistance > SWIPE_THRESHOLD || swipeVelocity > SWIPE_VELOCITY_THRESHOLD) {
      if (offset.x > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (offset.x < 0 && currentIndex < imageUrls.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    setIsDragging(false);
  }, [currentIndex, imageUrls.length]);

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  }, []);

  // Handle tap navigation
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
  }, [imageUrls, isDragging, currentIndex]);

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
        onTouchCancel={handleTouchCancel}
        onClick={handleImageTap}
      >
        <motion.div 
          ref={sliderRef}
          className={styles.imageSlider}
          animate={{ 
            x: currentIndex * -100 + '%',
            scale: isSwiping ? 0.98 : 1
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.6
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
