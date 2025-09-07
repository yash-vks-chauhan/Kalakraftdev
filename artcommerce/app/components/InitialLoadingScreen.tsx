import Image from 'next/image'
import { getImageUrl } from '../../lib/cloudinaryImages'
import styles from './InitialLoadingScreen.module.css'

interface InitialLoadingScreenProps {
  message?: string
}

export default function InitialLoadingScreen({ message = "Setting up for you..." }: InitialLoadingScreenProps) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src={getImageUrl('logo.png')}
            alt="Kalakraft Logo"
            width={120}
            height={40}
            className={styles.logo}
            priority
          />
        </div>
        
        {/* Animated dots */}
        <div className={styles.loadingDots}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
        
        {/* Loading message */}
        <p className={styles.loadingMessage}>{message}</p>
        
        {/* Subtle background pattern */}
        <div className={styles.backgroundPattern}></div>
      </div>
    </div>
  )
}
