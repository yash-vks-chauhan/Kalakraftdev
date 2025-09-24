'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../../contexts/AuthContext'
import styles from './mobile-new-product.module.css'

export default function SuperSimpleNewProduct() {
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted || !ready) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Please log in</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Create New Product</h1>
        <p>Super simple version - no hydration issues</p>
        <form style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Product Name"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <textarea 
              placeholder="Product Description"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="number" 
              placeholder="Price"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Product
          </button>
        </form>
      </div>
    </div>
  )
}
