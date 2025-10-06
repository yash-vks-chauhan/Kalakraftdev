'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Particles } from '../../components/ui/shadcn-io/particles';

interface ProductOpeningTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

const ProductOpeningTransition: React.FC<ProductOpeningTransitionProps> = ({
  isActive,
  onComplete,
  duration = 800
}) => {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowParticles(true);
      
      // Call onComplete after animation duration
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        setShowParticles(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, duration]);

  return (
    <AnimatePresence>
      {showParticles && (
        <>
          {/* Black particles overlay */}
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Particles
              className="absolute inset-0"
              quantity={80}
              staticity={30}
              ease={50}
              size={1.5}
              color="#000000"
              vx={0.5}
              vy={-0.3}
            />
          </motion.div>

          {/* White particles overlay */}
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Particles
              className="absolute inset-0"
              quantity={60}
              staticity={40}
              ease={60}
              size={1}
              color="#ffffff"
              vx={-0.3}
              vy={0.5}
            />
          </motion.div>

          {/* Center burst effect */}
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-black via-gray-500 to-white opacity-20 blur-xl" />
          </motion.div>

          {/* Elegant fade overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-gradient-to-br from-gray-50 via-white to-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.6, 0] }}
            transition={{ duration: 0.8, times: [0, 0.2, 0.5, 1] }}
          />

          {/* Sophisticated loading indicator */}
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="relative">
              {/* Outer ring */}
              <motion.div
                className="w-16 h-16 border-2 border-gray-200 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Inner ring */}
              <motion.div
                className="absolute top-1 left-1 w-14 h-14 border-2 border-t-black border-gray-100 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Center dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductOpeningTransition;
