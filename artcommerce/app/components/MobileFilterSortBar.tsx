'use client'

import React, { useState, useEffect } from 'react'
import { FiFilter, FiChevronDown, FiX } from 'lucide-react'
import styles from './MobileFilterSortBar.module.css'

interface MobileFilterSortBarProps {
  onFilterClick: () => void
  onSortClick: () => void
  currentSort: string
  isFilterOpen: boolean
  isSortOpen: boolean
  onCloseFilter: () => void
  onCloseSort: () => void
  onSortSelect: (sortValue: string) => void
}

export default function MobileFilterSortBar({
  onFilterClick,
  onSortClick,
  currentSort,
  isFilterOpen,
  isSortOpen,
  onCloseFilter,
  onCloseSort,
  onSortSelect
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
            className={`${styles.sortButton} ${isSortOpen ? styles.active : ''}`}
            onClick={onSortClick}
          >
            <span className={styles.buttonIcon}>☰</span>
            <span className={styles.buttonText}>Sort By: {currentSort}</span>
            <FiChevronDown className={styles.chevron} />
          </button>
          
          <button 
            className={`${styles.filterButton} ${isFilterOpen ? styles.active : ''}`}
            onClick={onFilterClick}
          >
            <FiFilter className={styles.buttonIcon} />
            <span className={styles.buttonText}>Filters</span>
          </button>
        </div>
      </div>

      {/* Sort Dropdown */}
      {isSortOpen && (
        <div className={styles.dropdownOverlay} onClick={onCloseSort}>
          <div className={styles.sortDropdown} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dropdownHeader}>
              <h3>Sort By</h3>
              <button className={styles.closeButton} onClick={onCloseSort}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.sortOptions}>
              <button className={styles.sortOption} onClick={() => onSortSelect('')}>
                Recommended
              </button>
              <button className={styles.sortOption} onClick={() => onSortSelect('price-asc')}>
                Price: Low to High
              </button>
              <button className={styles.sortOption} onClick={() => onSortSelect('price-desc')}>
                Price: High to Low
              </button>
              <button className={styles.sortOption} onClick={() => onSortSelect('newest')}>
                Newest First
              </button>
              <button className={styles.sortOption} onClick={() => onSortSelect('oldest')}>
                Oldest First
              </button>
              <button className={styles.sortOption} onClick={() => onSortSelect('rating-desc')}>
                Rating: High to Low
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
