import Image from 'next/image'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  overlay?: boolean
  size?: number
  message?: string
}

export default function LoadingSpinner({ overlay = false, size = 60, message }: LoadingSpinnerProps) {
  if (overlay) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinnerContainer}>
          <Image
            src="/images/loading.png"
            alt="Loading..."
            width={size}
            height={size}
            className={styles.spinner}
          />
          {message && <p className={styles.loadingMessage}>{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.spinnerContainer}>
      <Image
        src="/images/loading.png"
        alt="Loading..."
        width={size}
        height={size}
        className={styles.spinner}
      />
      {message && <p className={styles.loadingMessage}>{message}</p>}
    </div>
  )
} 