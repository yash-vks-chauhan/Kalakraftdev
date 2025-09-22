import React from 'react'
import { useAsyncState } from '../hooks/useAsyncState'
import { useEffect } from 'react'

interface Product {
  id: string
  name: string
  price: number
  imageUrls: string[]
  // Add other product properties as needed
}

interface BestSellersProps {
  styles: any // CSS modules styles
}

const BestSellersSection = ({ styles }: BestSellersProps) => {
  const bestSellersState = useAsyncState<Product[]>([])

  // Format price function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price)
  }

  // Fetch best sellers
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        bestSellersState.setLoading()
        const response = await fetch('/api/products/best-sellers?limit=4')
        const data = await response.json()
        
        if (data.products && Array.isArray(data.products)) {
          bestSellersState.setSuccess(data.products)
        } else {
          bestSellersState.setSuccess([])
        }
      } catch (err) {
        console.error('Error fetching best sellers:', err)
        bestSellersState.setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchBestSellers()
  }, [])

  if (bestSellersState.loading) {
    return (
      <section className={styles.bestSellersSection} data-aos="fade-up">
        <div className={styles.sectionHeader} data-aos="fade-up">
          <div className={styles.headerLine}></div>
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <div className={styles.headerLine}></div>
        </div>
        <div className={styles.bestSellersLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading best sellers...</p>
        </div>
      </section>
    )
  }

  if (bestSellersState.error || !bestSellersState.data.length) {
    return null // Hide section if no data
  }

  return (
    <section className={styles.bestSellersSection} data-aos="fade-up">
      {/* Section Header */}
      <div className={styles.sectionHeader} data-aos="fade-up">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.headerLine}></div>
      </div>

      <div className={styles.bestSellersDescription} data-aos="fade-up" data-aos-delay="100">
        <p>Discover our most loved creations, chosen by customers like you. These handcrafted pieces have won hearts and found their way into homes across the country.</p>
      </div>

      {/* Best Sellers Layout - Desktop */}
      <div className={`${styles.bestSellersDesktop} ${styles.desktopOnly}`} data-aos="fade-up" data-aos-delay="200">
        {bestSellersState.data.map((product, index) => (
          <div key={product.id} className={styles.bestSellerCard} data-aos="fade-up" data-aos-delay={`${300 + (index * 100)}`}>
            {/* Product card content */}
            <div className={styles.bestSellerImageContainer}>
              <img 
                src={product.imageUrls[0]} 
                alt={product.name}
                className={styles.bestSellerImage}
              />
            </div>
            <div className={styles.bestSellerInfo}>
              <h3 className={styles.bestSellerTitle}>{product.name}</h3>
              <p className={styles.bestSellerPrice}>{formatPrice(product.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BestSellersSection
