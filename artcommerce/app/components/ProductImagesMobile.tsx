import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
  
  // Motion values for smooth drag interactions
  const x = useMotionValue(0);
  const dragProgress = useTransform(x, [-300, 0, 300], [-1, 0, 1]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Optimized swipe thresholds for better UX
  const SWIPE_THRESHOLD = 40;
  const SWIPE_VELOCITY_THRESHOLD = 400;

  // Initialize image loading states
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;
    
    // Preload images for smoother experience
    imageUrls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
    
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
    handleResize(); // Initial call
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset motion value when index changes
  useEffect(() => {
    animate(x, -currentIndex * 100, { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    });
  }, [currentIndex, x]);

  // Navigation functions
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

  // Enhanced drag handling
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((_, info) => {
    const { offset, velocity } = info;
    const swipeDistance = Math.abs(offset.x);
    const swipeVelocity = Math.abs(velocity.x);

    // Convert offset to percentage-based detection
    const swipeThresholdPercent = 30; // 30% of container width
    const velocityThreshold = 500;

    // Improved swipe detection with velocity consideration
    if (swipeDistance > swipeThresholdPercent || swipeVelocity > velocityThreshold) {
      if (offset.x > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (offset.x < 0 && currentIndex < imageUrls.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    // Smooth transition back to position
    setTimeout(() => setIsDragging(false), 100);
  }, [currentIndex, imageUrls.length]);

  // Image load handler
  const handleImageLoad = useCallback((index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  }, []);

  // Tap navigation for better UX
  const handleImageTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrls || imageUrls.length <= 1 || isDragging) return;
    
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const tapX = e.nativeEvent.offsetX;
    
    // Enhanced tap zones
    if (tapX > containerWidth * 0.75 && currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (tapX < containerWidth * 0.25 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [imageUrls, isDragging, currentIndex]);

  // Determine optimal blend mode for images
  const getBlendMode = (url: string): MixBlendMode => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('clock') || 
        lowerUrl.includes('light') || 
        lowerUrl.includes('white') ||
        lowerUrl.includes('tray')) {
      return 'multiply';
    }
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

  return (
    <motion.div 
      className={styles.productImagesContainer}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.6
      }}
    >
      <motion.div 
        ref={containerRef}
        className={styles.imageContainer}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 20,
          duration: 0.7,
          delay: 0.1
        }}
        onClick={handleImageTap}
      >
        <motion.div 
          className={styles.imageSlider}
          drag="x"
          dragConstraints={{ 
            left: -(imageUrls.length - 1) * 100, 
            right: 0 
          }}
          dragElastic={0.15}
          dragTransition={{ 
            bounceStiffness: 600, 
            bounceDamping: 25,
            power: 0.2
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ 
            x: useTransform(x, (value) => `${value}%`),
            width: `${imageUrls.length * 100}%`
          }}
        >
          {imageUrls.map((url, index) => (
            <motion.div 
              key={index} 
              className={styles.imageSlide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: index === currentIndex ? 0 : 3
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                duration: 0.5
              }}
            >
              <motion.div 
                className={styles.imageWrapper}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 30
                }}
              >
                <Image
                  src={url}
                  alt={`${name} - Image ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className={styles.productImage}
                  priority={index === 0}
                  onLoad={() => handleImageLoad(index)}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                
                {/* Elegant loading state */}
                {!imageLoaded[index] && (
                  <motion.div 
                    className={styles.imageLoader}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <motion.div 
                      className={styles.loaderSpinner}
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Smooth progress indicator */}
      {imageUrls.length > 1 && (
        <motion.div 
          className={styles.progressContainer}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <div className={styles.progressBar}>
            <motion.div 
              className={styles.progressFill}
              animate={{ 
                scaleX: (currentIndex + 1) / imageUrls.length 
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.3
              }}
            />
          </div>
          
          {/* Animated counter */}
          <motion.div 
            className={styles.imageCounter}
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 25
            }}
          >
            <span className={styles.currentNumber}>{currentIndex + 1}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.totalNumber}>{imageUrls.length}</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
