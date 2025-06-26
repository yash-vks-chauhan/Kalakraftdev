import Image from 'next/image'
import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinnerContainer}>
        <Image
          src="/images/loading.png"
          alt="Loading..."
          width={60}
          height={60}
          className={styles.spinner}
        />
      </div>
    </div>
  )
} 