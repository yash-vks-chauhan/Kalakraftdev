import React, { useState } from 'react'
import Link from 'next/link'
import { Product } from './hooks/useBestSellers'
import { formatPrice, getFallbackImageUrl, handleImageError } from './utils'

interface BestSellersDesktopProps {
  products: Product[]
  styles: any
}

const BestSellersDesktop = ({ products, styles }: BestSellersDesktopProps) => {
  const [imageLoadStates, setImageLoadStates] = useState<{ [key: string]: 'loading' | 'loaded' | 'error' }>({})

  const handleImageLoad = (productId: string) => {
    setImageLoadStates(prev => ({ ...prev, [productId]: 'loaded' }))
  }

  const handleImageLoadError = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoadStates(prev => ({ ...prev, [productId]: 'error' }))
    handleImageError(e)
  }

  return (
    <div className={`${styles.bestSellersDesktop} ${styles.desktopOnly}`} data-aos="fade-up" data-aos-delay="200">
      {products.map((product, index) => (
        <div key={product.id} className={styles.bestSellerCard} data-aos="fade-up" data-aos-delay={`${300 + (index * 100)}`}>
          <Link href={`/products/${product.id}`}>
            <div className={styles.bestSellerImageContainer}>
              {imageLoadStates[product.id] === 'loading' && (
                <div className={styles.imageLoadingSkeleton}></div>
              )}
              <img 
                src={product.imageUrls[0] || getFallbackImageUrl()} 
                alt={product.name}
                className={`${styles.bestSellerImage} ${imageLoadStates[product.id] === 'loaded' ? styles.imageLoaded : ''}`}
                onLoad={() => handleImageLoad(product.id)}
                onError={(e) => handleImageLoadError(product.id, e)}
              />
            </div>
            <div className={styles.bestSellerInfo}>
              <h3 className={styles.bestSellerTitle}>{product.name}</h3>
              <p className={styles.bestSellerPrice}>{formatPrice(product.price)}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default BestSellersDesktop
