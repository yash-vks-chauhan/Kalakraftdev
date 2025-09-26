import React from 'react'

interface BestSellersLoadingProps {
  styles: any
}

const BestSellersLoading = ({ styles }: BestSellersLoadingProps) => {
  return (
    <section className={styles.bestSellersSection} data-aos="fade-up">
      <div className={styles.sectionHeader} data-aos="fade-up">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.headerLine}></div>
      </div>
      
      {/* Desktop Skeleton */}
      <div className={`${styles.bestSellersDesktop} ${styles.desktopOnly}`}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className={styles.bestSellerCardSkeleton}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonPrice}></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile Skeleton */}
      <div className={`${styles.bestSellersMobileCarousel} ${styles.mobileOnly}`}>
        <div className={styles.mobileCarouselContainer}>
          <div className={styles.mobileCarouselWrapper}>
            <div className={styles.mobileCarouselSlide}>
              <div className={styles.mobileProductCardSkeleton}>
                <div className={styles.mobileSkeletonImageSection}>
                  <div className={styles.mobileSkeletonImage}></div>
                </div>
                <div className={styles.mobileSkeletonDetailsSection}>
                  <div className={styles.mobileSkeletonCategory}></div>
                  <div className={styles.mobileSkeletonTitle}></div>
                  <div className={styles.mobileSkeletonPrice}></div>
                  <div className={styles.mobileSkeletonActions}>
                    <div className={styles.mobileSkeletonButton}></div>
                    <div className={styles.mobileSkeletonWishlist}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BestSellersLoading
