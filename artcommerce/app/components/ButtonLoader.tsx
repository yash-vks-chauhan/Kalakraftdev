import React from 'react'
import styles from './ButtonLoader.module.css'

interface ButtonLoaderProps {
  size?: 'small' | 'medium'
  color?: 'white' | 'dark'
}

export default function ButtonLoader({ size = 'small', color = 'white' }: ButtonLoaderProps) {
  const sizeClass = size === 'small' ? styles.small : styles.medium
  const colorClass = color === 'white' ? styles.white : styles.dark

  return (
    <div className={`${styles.buttonLoader} ${sizeClass} ${colorClass}`}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  )
}
