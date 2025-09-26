import React from 'react'

interface BestSellersHeaderProps {
  styles: any
}

const BestSellersHeader = ({ styles }: BestSellersHeaderProps) => {
  return (
    <>
      <div className={styles.sectionHeader} data-aos="fade-up">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.headerLine}></div>
      </div>

      <div className={styles.bestSellersDescription} data-aos="fade-up" data-aos-delay="100">
        <p>Discover our most loved creations, chosen by customers like you. These handcrafted pieces have won hearts and found their way into homes across the country.</p>
      </div>
    </>
  )
}

export default BestSellersHeader
