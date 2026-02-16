import React from 'react'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  overlay?: boolean
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export default function LoadingSpinner({ overlay = false, size = 'medium', message }: LoadingSpinnerProps) {
  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium

  if (overlay) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinnerContainer}>
          <div className={`${styles.pl} ${sizeClass}`}>
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plDot} />
            <div className={styles.plText}>{message || 'Loading…'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.spinnerContainer}>
      <div className={`${styles.pl} ${sizeClass}`}>
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plDot} />
        <div className={styles.plText}>{message || 'Loading…'}</div>
      </div>
    </div>
  )
} 