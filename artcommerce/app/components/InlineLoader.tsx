import React from 'react'
import styles from './InlineLoader.module.css'

interface InlineLoaderProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  className?: string
}

export default function InlineLoader({ size = 'small', message, className = '' }: InlineLoaderProps) {
  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium

  return (
    <div className={`${styles.container} ${className}`}>
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
        {message && <div className={styles.plText}>{message}</div>}
      </div>
    </div>
  )
}
