'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedParticles from './OptimizedParticles';
import { usePerformanceOptimization } from '../../lib/performanceUtils';
import '../../app/styles/performance.css';

interface OptimizedProductTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

const OptimizedProductTransition: React.FC<OptimizedProductTransitionProps> = ({
  isActive,
  onComplete,
  duration = 600 // Reduced from 800ms for snappier feel
}) => {
  const [showEffect, setShowEffect] = useState(false);
  const [particlesCompleted, setParticlesCompleted] = useState(0);
  
  // Get performance optimizations
  const { config, quality } = usePerformanceOptimization();

  // Memoized animation variants for better performance
  const overlayVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 0.4 },
    exit: { opacity: 0 }
  }), []);

  const burstVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0, rotate: 0 },
    visible: { 
      opacity: [0, 0.6, 0], 
      scale: [0, 1.2, 0], 
      rotate: [0, 180, 360] 
    }
  }), []);

  const loadingVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  }), []);

  // Handle particle completion
  const handleParticleComplete = useCallback(() => {
    setParticlesCompleted(prev => prev + 1);
  }, []);

  // Effect management
  useEffect(() => {
    if (isActive) {
      setShowEffect(true);
      setParticlesCompleted(0);
      
      // Complete transition when both particle systems are done
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        setShowEffect(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, duration]);

  // Early completion if both particle systems finish
  useEffect(() => {
    if (particlesCompleted >= 2 && showEffect) {
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        setShowEffect(false);
      }, 100); // Small delay for smooth transition

      return () => clearTimeout(timer);
    }
  }, [particlesCompleted, showEffect, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {showEffect && (
        <motion.div
          className="particle-container optimized-animation"
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {/* Optimized background overlay */}
          <motion.div
            className={`absolute inset-0 ${quality.useGradients ? 'bg-gradient-to-br from-gray-900/20 via-white/30 to-gray-100/20' : 'bg-white/20'} ${quality.useBlur ? 'backdrop-blur-sm' : ''} layout-stable`}
            variants={overlayVariants}
            transition={{ duration: 0.3 }}
          />

          {/* Black particles - adaptive quantity */}
          <div className="absolute inset-0 layout-stable">
            <OptimizedParticles
              quantity={quality.particleCount * 0.6} // 60% for black particles
              color="#000000"
              vx={0.8}
              vy={-0.5}
              size={1.2}
              duration={quality.animationDuration * 0.8}
              onComplete={handleParticleComplete}
            />
          </div>

          {/* White particles - adaptive quantity */}
          <div className="absolute inset-0 layout-stable">
            <OptimizedParticles
              quantity={quality.particleCount * 0.4} // 40% for white particles
              color="#ffffff"
              vx={-0.5}
              vy={0.8}
              size={0.8}
              duration={quality.animationDuration * 0.9}
              onComplete={handleParticleComplete}
            />
          </div>

          {/* Optimized center burst effect */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center layout-stable"
            variants={burstVariants}
            transition={{ 
              duration: 0.8, 
              times: [0, 0.4, 1],
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smoothness
            }}
          >
            <div className={`w-24 h-24 rounded-full ${quality.useGradients ? 'radial-gradient-optimized' : 'bg-gray-400/30'} ${quality.useBlur ? 'gpu-blur' : ''} optimized-animation`} />
          </motion.div>

          {/* Minimalist loading indicator */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center layout-stable"
            variants={loadingVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="relative optimized-animation">
              {/* Single rotating ring */}
              <motion.div
                className="w-8 h-8 border-2 border-transparent border-t-black/60 rounded-full smooth-transition"
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "linear",
                  repeatType: "loop"
                }}
              />
              
              {/* Pulsing center dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-1 h-1 bg-black/80 rounded-full optimized-animation"
                style={{ x: '-50%', y: '-50%' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OptimizedProductTransition;
