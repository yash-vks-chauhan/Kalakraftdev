// File: app/checkout/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import styles from './success.module.css'

export default function SuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }
    const justPlaced = localStorage.getItem('lastOrderNumber')
    if (justPlaced) {
      setOrderNumber(justPlaced)
      // Trigger animations after component mounts
      setTimeout(() => setIsVisible(true), 100)
    }
  }, [user, router])

  if (!user || !orderNumber) {
    return (
      <main className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Preparing your confirmation...</p>
      </main>
    )
  }

  return (
    <main className={styles.successContainer}>
      {/* Animated Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingCircle} style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
        <div className={styles.floatingCircle} style={{ top: '20%', right: '10%', animationDelay: '0.5s' }}></div>
        <div className={styles.floatingCircle} style={{ bottom: '30%', left: '8%', animationDelay: '1s' }}></div>
        <div className={styles.floatingCircle} style={{ bottom: '15%', right: '20%', animationDelay: '1.5s' }}></div>
      </div>

      {/* Main Content Card */}
      <div className={`${styles.mainCard} ${isVisible ? styles.cardVisible : ''}`}>
        {/* Animated Success Icon */}
        <div className={styles.successIconContainer}>
          <div className={styles.successIconWrapper}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmark}></div>
            </div>
          </div>
          <div className={styles.successRipple}></div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
          <div className={styles.headerSection}>
            <h1 className={styles.mainTitle}>Order Confirmed!</h1>
            <p className={styles.subtitle}>
              🎉 Your order has been successfully placed and is on its way to you
            </p>
          </div>

          {/* Order Details Card */}
          <div className={styles.orderCard}>
            <div className={styles.orderCardHeader}>
              <div className={styles.orderIcon}>📦</div>
              <div className={styles.orderInfo}>
                <span className={styles.orderLabel}>Order Number</span>
                <span className={styles.orderNumber}>#{orderNumber}</span>
              </div>
            </div>
            <div className={styles.orderStatus}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>Processing</span>
            </div>
          </div>

          {/* Information Cards Grid */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📧</div>
              <div className={styles.infoContent}>
                <h3 className={styles.infoTitle}>Email Sent</h3>
                <p className={styles.infoText}>Confirmation details sent to your inbox</p>
              </div>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📱</div>
              <div className={styles.infoContent}>
                <h3 className={styles.infoTitle}>Track Order</h3>
                <p className={styles.infoText}>Monitor your order status anytime</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Link href="/dashboard/orders" className={styles.primaryButton}>
              <span className={styles.buttonIcon}>📊</span>
              <span>Track Order</span>
              <span className={styles.buttonArrow}>→</span>
            </Link>
            
            <Link href="/products" className={styles.secondaryButton}>
              <span className={styles.buttonIcon}>🛍️</span>
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Product Image (if available) */}
          <div className={styles.productImageSection}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/uploads/0cf791f8-471a-446a-aff0-c3432d184a8d.JPG" 
                alt="Product Image" 
                width={300} 
                height={200} 
                className={styles.productImage}
                priority
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.imageOverlay}>
                <span className={styles.overlayText}>Thank you for choosing us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Thank You Message */}
      <div className={`${styles.floatingMessage} ${isVisible ? styles.messageVisible : ''}`}>
        <div className={styles.messageContent}>
          <span className={styles.messageEmoji}>✨</span>
          <span className={styles.messageText}>We appreciate your business!</span>
        </div>
      </div>
    </main>
  )
}