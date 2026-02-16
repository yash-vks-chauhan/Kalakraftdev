import styles from './productsMobile.module.css'

export default function MobileProductsSkeleton() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `
      }} />
      
      <div className={styles.container}>
        {/* Page header skeleton */}
        <div className={styles.pageHeader}>
          <div style={{ 
            height: '24px', 
            width: '150px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '4px',
            marginBottom: '8px'
          }}></div>
          <div style={{ 
            height: '14px', 
            width: '80px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '4px'
          }}></div>
        </div>
        
        {/* Filter/Sort bar skeleton */}
        <div style={{
          height: '48px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            height: '32px',
            width: '60px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '6px'
          }}></div>
          <div style={{
            height: '32px',
            width: '80px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '6px'
          }}></div>
        </div>
        
        {/* Product grid skeleton */}
        <div className={styles.list}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className={styles.productCardSkeleton}>
              <div className={styles.skeletonImageContainer}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.skeletonIndicators}>
                  <div className={styles.skeletonIndicator}></div>
                  <div className={styles.skeletonIndicator}></div>
                  <div className={styles.skeletonIndicator}></div>
                </div>
              </div>
              
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonCategory}></div>
                <div className={styles.skeletonName}></div>
                <div className={styles.skeletonPriceRow}>
                  <div className={styles.skeletonPrice}></div>
                  <div className={styles.skeletonRating}></div>
                </div>
              </div>
              
              <div className={styles.skeletonWishlistContainer}>
                <div className={styles.skeletonWishlistButton}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
