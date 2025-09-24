'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import styles from './mobile-new-product.module.css'

export default function MobileNewProductClient() {
  const router = useRouter()

  useEffect(() => {
    // Force client-side navigation to the actual component
    const timer = setTimeout(() => {
      router.replace('/dashboard/admin/products/new/mobile/client')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading product creation...</div>
    </div>
  )
}
