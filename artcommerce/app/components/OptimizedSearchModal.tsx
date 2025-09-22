'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import OptimizedSearch from './OptimizedSearch'
import styles from './SearchModal.module.css'

interface OptimizedSearchModalProps {
  open: boolean
  onClose: (instantClose?: any) => void
}

export default function OptimizedSearchModal({ open, onClose }: OptimizedSearchModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.searchContainer}>
              <OptimizedSearch
                placeholder="Search products..."
                onResultsChange={(results) => {
                  // Handle search results
                  console.log('Search results:', results)
                }}
                showMetrics={process.env.NODE_ENV === 'development'}
                className={styles.searchInput}
              />
            </div>
            
            {/* Close button */}
            <button
              onClick={() => onClose()}
              className={styles.closeButton}
              aria-label="Close search"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
