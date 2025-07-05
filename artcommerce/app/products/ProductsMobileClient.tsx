'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'

export default function ProductsMobileClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        // Normalize image URLs
        const normalized = (Array.isArray(data.products) ? data.products : []).map((p) => {
          let urls = []
          try {
            urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
          } catch {
            urls = []
          }
          return { ...p, imageUrls: urls }
        })
        setProducts(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.list}>
      {products.map((prod) => (
        <Link href={`/products/${prod.id}`} key={prod.id} className={styles.card}>
          <div className={styles.imageContainer}>
            {prod.imageUrls[0] ? (
              <img src={prod.imageUrls[0]} alt={prod.name} className={styles.image} />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{prod.name}</h3>
            <p className={styles.price}>₹{prod.price.toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
} 