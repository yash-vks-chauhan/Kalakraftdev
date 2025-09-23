// File: app/checkout/page.tsx

import { Suspense } from 'react'
import CheckoutClient from './CheckoutClient'
import styles from './checkout.module.css'

function CheckoutFallback() {
  return (
    <main className={styles.centeredContainer}>
      <p className={styles.loadingText}>
        <span className={styles.loadingSpinner}></span>
        Loading checkout...
      </p>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  )
}
