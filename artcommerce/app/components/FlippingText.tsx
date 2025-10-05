'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlippingTextProps {
  words: string[]
  duration?: number // Duration each word is displayed
  className?: string
}

const FlippingText: React.FC<FlippingTextProps> = ({ 
  words, 
  duration = 3000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words.length, duration])

  return (
    <span className={`inline-block relative ${className}`} style={{ minWidth: '140px', textAlign: 'left' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ 
            rotateX: 90,
            opacity: 0,
            y: 20,
            scale: 0.8
          }}
          animate={{ 
            rotateX: 0,
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{ 
            rotateX: -90,
            opacity: 0,
            y: -20,
            scale: 0.8
          }}
          transition={{
            duration: 0.8,
            ease: [0.175, 0.885, 0.32, 1.275],
            type: "spring",
            stiffness: 200,
            damping: 25
          }}
          style={{
            display: 'inline-block',
            transformOrigin: 'center center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            perspective: '1000px'
          }}
          className="font-semibold bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default FlippingText
