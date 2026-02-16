'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import OptimizedSearch from './OptimizedSearch'
import styles from './SearchModal.module.css'

interface OptimizedSearchModalProps {
  open: boolean
  onClose: (instantClose?: boolean) => void
}

function OptimizedSearchModalContent({ open, onClose }: OptimizedSearchModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
    }
  }, [])

  // Handle visibility state changes
  useEffect(() => {
    if (open) {
      setIsVisible(true)
    }
  }, [open])

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false)
  }, [])

  // Handle animation complete
  const handleAnimationComplete = useCallback(() => {
    if (!isVisible) {
      onClose(false)
    }
  }, [isVisible, onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Close on escape key with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [open, handleClose])

  // Early return after all hooks
  if (!mounted) return null

  const modalContent = (
    <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          className={styles.searchOverlay}
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <motion.div
            className={styles.searchModal}
            onClick={(e) => e.stopPropagation()}
            initial={{ 
              scaleY: 0, 
              opacity: 0, 
              y: -20,
              transformOrigin: 'top center'
            }}
            animate={{ 
              scaleY: 1, 
              opacity: 1, 
              y: 0,
              transformOrigin: 'top center'
            }}
            exit={{ 
              scaleY: 0, 
              opacity: 0, 
              y: -10,
              transformOrigin: 'top center'
            }}
            transition={{ 
              duration: 0.45, 
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 0.3 },
              y: { duration: 0.4 }
            }}
          >
            <div className={styles.searchHeader}>
              <div className={styles.logoContainer}>
                <img
                  src="/images/logo.png"
                  alt="Kalakraft"
                  className={styles.logoImage}
                  width={150}
                  height={40}
                />
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
                aria-label="Close search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.searchContent}>
              <div className={styles.searchContainer}>
                <OptimizedSearch
                  placeholder="SEARCH PRODUCTS..."
                  onResultsChange={(results) => {
                    // Handle search results
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Search results:', results)
                    }
                  }}
                  showMetrics={process.env.NODE_ENV === 'development'}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

// Wrapper component with Suspense boundary
export default function OptimizedSearchModal(props: OptimizedSearchModalProps) {
  return (
    <Suspense fallback={null}>
      <OptimizedSearchModalContent {...props} />
    </Suspense>
  )
}
