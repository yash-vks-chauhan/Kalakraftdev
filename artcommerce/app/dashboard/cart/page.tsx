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
        <div className={styles.header}>
          <h1 className={styles.title}>Your Cart</h1>
        </div>
        <div className={styles.emptyCart}>
          <p className={styles.emptyCartText}>Your cart is empty.</p>
          <Link href="/products" className={styles.browseLink}>
            Browse products
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
      <div className={styles.header}>
        <h1 className={styles.title}>Your Cart</h1>
      </div>

      <ul className={styles.cartList}>
        {cartItems.map((item) => (
          <li 
            key={item.id} 
            className={`${styles.cartItem} ${removingItemId === item.id ? styles.itemRemoving : ''}`}
          >
            <div className={styles.productInfo}>
              {item.product.imageUrls[0] ? (
                <img
                  src={item.product.imageUrls[0]}
                  alt={item.product.name}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.imagePlaceholder}>No image</div>
              )}
              <div className={styles.productDetails}>
                <div className={styles.productName}>{item.product.name}</div>
                <div className={styles.productPrice}>
                  ${item.product.price.toFixed(2)} each
                </div>
                {getStockInfo(item)}
              </div>
            </div>

            <div className={styles.quantityControls}>
              <input
                type="number"
                min={1}
                max={item.product.stockQuantity || 999}
                value={quantities[item.id] || item.quantity}
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                disabled={isUpdating[item.id]}
                className={`${styles.quantityInput} ${isUpdating[item.id] ? styles.updating : ''}`}
              />
              <button
                onClick={() => handleRemove(item.id)}
                className={styles.removeButton}
                disabled={isUpdating[item.id] || removingItemId === item.id}
              >
                {isUpdating[item.id] ? 'Updating...' : 'Remove'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.subtotalSection}>
        <div className={styles.subtotalText}>
          Subtotal: ${subtotal.toFixed(2)}
        </div>
      </div>

      <Link
        href="/checkout"
        className={styles.checkoutButton}
      >
        Proceed to Checkout
      </Link>
    </main>
  )
}