// File: app/dashboard/wishlist/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useWishlist } from '../../contexts/WishlistContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from './wishlist.module.css'

type AnimationType = 'removing' | 'moving';

export default function DashboardWishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()
  const router = useRouter()
  const [isAddingToCart, setIsAddingToCart] = useState<{[key: number]: boolean}>({})
  const [stockInfo, setStockInfo] = useState<{[key: number]: number}>({})
  const [animatingItems, setAnimatingItems] = useState<{[id: number]: AnimationType}>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchStockInfo() {
      if (wishlistItems.length === 0) return
      
      const stockData: {[key: number]: number} = {}
      for (const item of wishlistItems) {
        try {
          const res = await fetch(`/api/products/${item.productId}`)
          if (res.ok) {
            const data = await res.json()
            stockData[item.productId] = data.product?.stockQuantity ?? 0
          }
        } catch (error) {
          console.error(`Error fetching stock for product ${item.productId}:`, error)
          stockData[item.productId] = 0
        }
      }
      setStockInfo(stockData)
    }
    
    fetchStockInfo()
  }, [wishlistItems])

  const handleAddToCart = (itemId: number, productId: number) => {
    // Immediately set visual state for animation and button loading
    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
    setAnimatingItems(prev => ({ ...prev, [itemId]: 'moving' }));

    // After animation, perform the actual logic
    setTimeout(async () => {
      const success = await addToCart(productId, 1);
      if (success) {
        // This will update the context, re-render the list, and the item will be gone.
        await removeFromWishlist(productId);
      } else {
        // If it fails, revert the visual state by removing the animation class
        setAnimatingItems(prev => {
          const newState = { ...prev };
          delete newState[itemId];
          return newState;
        });
      }
      // Always clean up the "adding to cart" status for the button
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }, 700); // Duration matches the 'moving' animation
  };

  const handleRemoveFromWishlist = (itemId: number, productId: number) => {
    // Start the exit animation
    setAnimatingItems(prev => ({ ...prev, [itemId]: 'removing' }));

    // After animation, call the removal function from the context
    setTimeout(() => {
      removeFromWishlist(productId);
      // No need to clean up animatingItems state, as the component will be unmounted
    }, 500); // Duration matches the 'removing' animation
  };

  const getStockStatus = (productId: number) => {
    const stock = stockInfo[productId]
    if (stock === undefined) return null 

    if (stock <= 0) {
      return <span className={`${styles.stockStatus} ${styles.stockOut}`}>Out of stock</span>
    } else if (stock < 5) {
      return <span className={`${styles.stockStatus} ${styles.stockLow}`}>Low stock: {stock} left</span>
    } else {
      return <span className={`${styles.stockStatus} ${styles.stockIn}`}>In stock</span>
    }
  }

  if (authLoading || wishlistLoading) {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner} style={{width: '50px', height: '50px', borderLeftColor: '#111827'}}></div>
        </div>
    )
  }
  
  if (!user) {
      return null
  }

  if (wishlistItems.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Your Wishlist is a Blank Canvas</h2>
          <p className={styles.emptyText}>
            Fill it with beautiful items you love. Start exploring our collections and add your favorites here.
          </p>
          <Link href="/products" className={styles.browseLink}>
            Find Your Favorites
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Wishlist</h1>
        <span className={styles.itemCount}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className={styles.grid}>
        {wishlistItems.map((item) => {
            const stock = stockInfo[item.productId]
            const isOutOfStock = stock !== undefined && stock <= 0
            const adding = isAddingToCart[item.productId]
            const animationType = animatingItems[item.id]

            const getAnimationClass = () => {
                if (!animationType) return '';
                return animationType === 'moving' ? styles.cardMovingToCart : styles.cardRemoving;
            }

            return (
                <div 
                    key={item.id} 
                    className={`${styles.card} ${getAnimationClass()}`}
                >
                    <div className={styles.imageWrapper}>
                        <Image
                        src={item.product.imageUrls[0] || '/placeholder.png'}
                        alt={item.product.name}
                        fill
                        className={styles.image}
                        />
                        <button
                            onClick={() => handleRemoveFromWishlist(item.id, item.productId)}
                            className={styles.removeBtn}
                            aria-label="Remove from wishlist"
                            disabled={!!animationType}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className={styles.cardContent}>
                        <h3 className={styles.productName}>{item.product.name}</h3>
                        <p className={styles.productPrice}>₹{item.product.price.toFixed(2)}</p>
                        {getStockStatus(item.productId)}
                        <div className={styles.actions}>
                        <button
                            onClick={() => handleAddToCart(item.id, item.productId)}
                            disabled={adding || isOutOfStock || !!animationType}
                            className={`${styles.addToCartBtn} ${isOutOfStock ? styles.disabled : styles.primary}`}
                        >
                            {adding ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    <span>Adding...</span>
                                </>
                            ) : isOutOfStock ? 'Out of Stock' : 'Add to Cart'
                            }
                        </button>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      <div className={styles.browseMoreContainer}>
        <Link href="/products" className={styles.browseLink}>
          Explore More Products
        </Link>
      </div>
    </main>
  )
}