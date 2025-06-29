'use client'

import { useEffect, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from './mobile.module.css'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'

export default function MobileCart() {
  const { user } = useAuth()
  const router = useRouter()
  const { cartItems, updateCartItem, removeFromCart } = useCart()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  if (!user) return null
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading your cart...</p>
    </div>
  )

  if (cartItems.length === 0) {
    return (
      <div className={styles.mobileCartEmpty}>
        <div className={styles.emptyCartIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven&apos;t added any items yet</p>
        <Link href="/products" className={styles.browseButton}>
          Browse Products
        </Link>
      </div>
    )
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  )

  return (
    <div className={styles.mobileCart}>
      <div className={styles.cartHeader}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Your Cart</h1>
        <div></div>
      </div>

      <div className={styles.cartItems}>
        {cartItems.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <div className={styles.cartItemImage}>
              {Array.isArray(item.product.imageUrls) &&
              item.product.imageUrls.length > 0 ? (
                <Image
                  src={item.product.imageUrls[0]}
                  alt={item.product.name}
                  width={80}
                  height={80}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.noImage}>
                  <span>No image</span>
                </div>
              )}
            </div>

            <div className={styles.cartItemDetails}>
              <div className={styles.cartItemInfo}>
                <h3>{item.product.name}</h3>
                <p className={styles.cartItemPrice}>
                  {item.product.currency} {item.product.price.toFixed(2)}
                </p>
              </div>

              <div className={styles.cartItemActions}>
                <div className={styles.quantityControl}>
                  <button 
                    onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className={styles.quantityButton}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button 
                    onClick={() => updateCartItem(item.id, item.quantity + 1)}
                    className={styles.quantityButton}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className={styles.removeButton}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cartSummary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{cartItems[0].product.currency} {subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      <div className={styles.checkoutActions}>
        <Link href="/checkout" className={styles.checkoutButton}>
          Proceed to Checkout
        </Link>
        <Link href="/products" className={styles.continueShoppingButton}>
          Continue Shopping
        </Link>
      </div>
    </div>
  )
} 