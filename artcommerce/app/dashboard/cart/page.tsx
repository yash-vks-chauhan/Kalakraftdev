// File: app/dashboard/cart/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './cart.module.css'

interface QuantityMap {
  [key: number]: number;
}

export default function DashboardCartPage() {
  const { user, token } = useAuth()
  const { cartItems, updateCartItem, removeFromCart } = useCart()
  const router = useRouter()
  const [quantities, setQuantities] = useState<QuantityMap>({})
  const [isUpdating, setIsUpdating] = useState<{[key: number]: boolean}>({})
  const [removingItemId, setRemovingItemId] = useState<number | null>(null)

  useEffect(() => {
    if (user === null) {
      router.replace('/auth/login')
    }
  }, [user, router])

  useEffect(() => {
    // Initialize quantities state with current cart item quantities
    const initialQuantities: QuantityMap = {}
    const initialUpdating: {[key: number]: boolean} = {}
    cartItems.forEach(item => {
      initialQuantities[item.id] = item.quantity
      initialUpdating[item.id] = false
    })
    setQuantities(initialQuantities)
    setIsUpdating(initialUpdating)
  }, [cartItems])

  const handleRemove = (itemId: number) => {
    setRemovingItemId(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
    }, 400); // Duration must match animation
  }

  const handleQuantityChange = async (itemId: number, newValue: string) => {
    const value = parseInt(newValue)
    if (value > 0) {
      // Find the cart item to check stock
      const cartItem = cartItems.find(item => item.id === itemId)
      if (!cartItem) return
      
      // Check if quantity exceeds available stock
      const stockQuantity = cartItem.product.stockQuantity || 0
      
      // First update local state for responsive UI
      setQuantities(prev => ({
        ...prev,
        [itemId]: value
      }))
      
      // Then update in the backend
      setIsUpdating(prev => ({ ...prev, [itemId]: true }))
      await updateCartItem(itemId, value)
      setIsUpdating(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const getStockInfo = (item: any) => {
    const stockQuantity = item.product.stockQuantity || 0
    
    if (stockQuantity <= 0) {
      return <span className={styles.outOfStock}>Out of stock</span>
    } else if (stockQuantity < 5) {
      return <span className={styles.lowStock}>Low stock: {stockQuantity} left</span>
    }
    
    return null
  }

  if (!user) {
    return null
  }

  if (cartItems.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyCartContainer}>
          <div className={styles.emptyCartIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.cartIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className={styles.emptyCartTitle}>Your cart is empty</h1>
          <p className={styles.emptyCartText}>Start shopping to add items to your cart</p>
          <Link href="/products" className={styles.browseButton}>
            <span>Browse Products</span>
          </Link>
        </div>
      </main>
    )
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Shopping Cart</h1>
        <span className={styles.itemCount}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cart Items */}
      <div className={styles.cartItems}>
        {cartItems.map((item) => (
          <div 
            key={item.id} 
            className={`${styles.cartItem} ${removingItemId === item.id ? styles.itemRemoving : ''}`}
          >
            {/* Product Image */}
            <Link href={`/products/${item.product.id}`} className={`${styles.productImageLink} ${styles.imageCol}`}>
              <div className={styles.productImageContainer}>
                {item.product.imageUrls[0] ? (
                  <img
                    src={item.product.imageUrls[0]}
                    alt={item.product.name}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.placeholderIcon}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>

            {/* Product Details */}
            <div className={`${styles.productInfo} ${styles.infoCol}`}>
              <Link href={`/products/${item.product.id}`} className={styles.productNameLink}>
                <h3 className={styles.productName}>{item.product.name}</h3>
              </Link>
              <div className={styles.productMeta}>
                <span className={styles.productPrice}>₹{item.product.price.toFixed(2)}</span>
                {getStockInfo(item)}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className={`${styles.quantitySection} ${styles.quantityCol}`}>
              <label className={styles.quantityLabel}>Qty</label>
              <input
                type="number"
                min={1}
                max={item.product.stockQuantity || 999}
                value={quantities[item.id] || item.quantity}
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                disabled={isUpdating[item.id]}
                className={`${styles.quantityInput} ${isUpdating[item.id] ? styles.updating : ''}`}
              />
            </div>

            {/* Remove Button */}
            <button
              onClick={() => handleRemove(item.id)}
              className={`${styles.removeButton} ${styles.removeCol}`}
              disabled={isUpdating[item.id] || removingItemId === item.id}
              title="Remove item"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.removeIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Summary & Checkout */}
      <div className={styles.summarySection}>
        <div className={styles.summaryContent}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Items</span>
            <span className={styles.summaryValue}>{cartItems.length}</span>
          </div>
        </div>
        
        <Link href="/checkout" className={styles.checkoutButton}>
          <span>Proceed to Checkout</span>
        </Link>
      </div>
    </main>
  )
}