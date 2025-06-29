'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './product_details.module.css'
import ProductImages from '../../components/ProductImages'
import AddToCartButton from '../../components/AddToCartButton'
import WishlistButton from '../../components/WishlistButton'
import { useAuth } from '../../contexts/AuthContext'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  averageRating: number
  reviewCount: number
}

export default function ProductDetailsComponent() {
  const router = useRouter()
  const { token } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Extract product ID from URL
    const productId = window.location.pathname.split('/').pop()
    
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error('Failed to load product')
        const data = await res.json()
        setProduct(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error loading product</h2>
        <p>{error || 'Product not found'}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className={styles.productDetails}>
      <div className={styles.productGallery}>
        <ProductImages imageUrls={product.images} name={product.name} />
      </div>
      
      <div className={styles.productInfo}>
        <h1 className={styles.productName}>{product.name}</h1>
        
        <div className={styles.productMeta}>
          <div className={styles.rating}>
            <span>★ {product.averageRating.toFixed(1)}</span>
            <span className={styles.reviewCount}>
              ({product.reviewCount} reviews)
            </span>
          </div>
          <div className={styles.price}>
            ${product.price.toFixed(2)}
          </div>
        </div>

        <div className={styles.description}>
          {product.description}
        </div>

        <div className={styles.stockInfo}>
          {product.stock > 0 ? (
            <span className={styles.inStock}>
              In Stock ({product.stock} available)
            </span>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>

        <div className={styles.actions}>
          <AddToCartButton 
            productId={product.id}
            stockQuantity={product.stock}
          />
          <WishlistButton 
            productId={product.id}
            className={styles.wishlist}
          />
        </div>
      </div>
    </div>
  )
} 