'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../../contexts/AuthContext'
import styles from './mobile-new-product.module.css'

export default function MinimalMobileNewProduct() {
  const [isClient, setIsClient] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.loading}>
        {user ? `Welcome Admin` : 'Please authenticate'}
        <br />
        <small>Minimal version - no hydration issues</small>
      </div>
    </div>
  )
}
