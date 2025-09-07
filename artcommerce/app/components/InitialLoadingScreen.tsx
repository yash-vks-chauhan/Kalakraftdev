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
        {/* Minimal spinner */}
        <div className={styles.spinner}>
          <div className={styles.spinnerRing}></div>
        </div>
        
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src={getImageUrl('logo.png')}
            alt="Kalakraft Logo"
            width={100}
            height={33}
            className={styles.logo}
            priority
          />
        </div>
        
        {/* Loading message */}
        <p className={styles.loadingMessage}>{message}</p>
      </div>
    </div>
  )
}
