import React from 'react'

interface BestSellersErrorProps {
  error: string
  onRetry: () => void
  styles: any
}

const BestSellersError = ({ error, onRetry, styles }: BestSellersErrorProps) => {
  return (
    <section className={styles.bestSellersSection} data-aos="fade-up">
      <div className={styles.sectionHeader} data-aos="fade-up">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.headerLine}></div>
      </div>
      
      <div className={styles.bestSellersError}>
        <div className={styles.errorContent}>
          <p>Unable to load best sellers at the moment.</p>
          <p className={styles.errorDetails}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  )
}

export default BestSellersError
