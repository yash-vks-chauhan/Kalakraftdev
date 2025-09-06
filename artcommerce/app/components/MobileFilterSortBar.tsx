'use client'

import React, { useState, useEffect } from 'react'
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi'
import styles from './MobileFilterSortBar.module.css'

interface MobileFilterSortBarProps {
  onFilterClick: () => void
  onSortClick: () => void
  currentSort: string
}

export default function MobileFilterSortBar({
  onFilterClick,
  onSortClick,
  currentSort
}: MobileFilterSortBarProps) {
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      // Start sticking when scrolled past 100px (navbar height)
      setIsSticky(scrollTop > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div className={`${styles.filterSortBar} ${isSticky ? styles.sticky : ''}`}>
        <div className={styles.barContent}>
          <button 
            className={`${styles.sortButton}`}
            onClick={onSortClick}
          >
            <span className={styles.buttonIcon}>☰</span>
            <span className={styles.buttonText}>Sort By: {currentSort}</span>
            <FiChevronDown className={styles.chevron} />
          </button>
          
          <button 
            className={`${styles.filterButton}`}
            onClick={onFilterClick}
          >
            <FiFilter className={styles.buttonIcon} />
            <span className={styles.buttonText}>Filters</span>
          </button>
        </div>
      </div>
    </>
  )
}
