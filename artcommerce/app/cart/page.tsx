// File: app/cart/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { cartItems, updateCartItem, removeFromCart } = useCart()
  const [loading, setLoading] = useState(true)

  // Redirect small screens to the dedicated mobile cart
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const viewportWidth = window.innerWidth
        if (viewportWidth < 1024) {
          router.replace('/cart/mobile')
        }
      } catch (e) {
        console.error('Cart redirect error', e)
      }
    }
  }, [router])

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  if (!user) return null
  if (loading) return <p className="text-center mt-8">Loading your cart…</p>

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
            <p className="text-gray-600 text-lg">Your cart is empty</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
            <Link 
              href="/products" 
              className="relative inline-block overflow-hidden rounded-lg border-2 border-black px-8 py-3 font-semibold text-black group"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Browse Products</span>
              <span className="absolute inset-0 translate-x-[-100%] bg-black transition-transform duration-300 ease-out group-hover:translate-x-0" />
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  )

  return (
    <main className="container mx-auto px-4 pt-6 pb-28 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Your Cart</h1>
        <p className="text-gray-600 text-base md:text-lg">Review and manage your selected items</p>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden" data-testid="mobile-cart-layout">
        <ul className="bg-white rounded-2xl border-2 border-gray-200 divide-y divide-gray-200">
          {cartItems.map((item) => {
            const isOut = (item.product.stockQuantity ?? 0) === 0
            const maxQty = item.product.stockQuantity && item.product.stockQuantity > 0 ? item.product.stockQuantity : undefined
            const handleDecrease = () => {
              const next = Math.max(1, item.quantity - 1)
              if (next !== item.quantity) updateCartItem(item.id, next)
            }
            const handleIncrease = () => {
              const next = item.quantity + 1
              if (maxQty !== undefined) {
                if (next <= maxQty) updateCartItem(item.id, next)
              } else {
                updateCartItem(item.id, next)
              }
            }
            return (
              <li key={item.id} className="flex items-center gap-4 p-4">
                <Link href={`/products/${item.product.id}`} className="shrink-0">
                  {Array.isArray(item.product.imageUrls) && item.product.imageUrls[0] ? (
                    <Image
                      src={item.product.imageUrls[0]}
                      alt={item.product.name}
                      width={96}
                      height={96}
                      className="h-20 w-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.product.id}`} className="block">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{item.product.name}</h2>
                  </Link>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">₹{item.product.price.toFixed(2)}</span>
                    <span className={`text-xs ${isOut ? 'text-red-600' : 'text-gray-500'}`}>
                      {isOut ? 'Out of stock' : 'In stock'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border-2 border-black overflow-hidden">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={handleDecrease}
                        disabled={isOut || item.quantity <= 1}
                        className="px-3 py-1 text-black disabled:opacity-40"
                      >
                        −
                      </button>
                      <input
                        id={`qty-${item.id}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={maxQty}
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-12 text-center text-black bg-white border-l-2 border-r-2 border-black focus:outline-none"
                        disabled={isOut}
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={handleIncrease}
                        disabled={isOut || (maxQty !== undefined && item.quantity >= maxQty)}
                        className="px-3 py-1 text-white bg-black disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 inline-flex items-center text-sm text-red-600 hover:text-red-700"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1h-3.5l-1-1h-3l-1 1H6a1 1 0 00-1 1v1z" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Sticky checkout bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-lg font-semibold text-gray-900">₹{subtotal.toFixed(2)}</p>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 font-semibold"
            >
              Checkout
            </Link>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom)' }} />
        </div>
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="hidden lg:block">
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border-2 border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-full md:w-1/4 cursor-pointer group">
                <Link href={`/products/${item.product.id}`}>
                  {Array.isArray(item.product.imageUrls) && item.product.imageUrls.length > 0 ? (
                    <div className="relative overflow-hidden rounded-lg border-2 border-gray-100 group-hover:border-gray-300 transition-all duration-200">
                      <Image
                        src={item.product.imageUrls[0]}
                        alt={item.product.name}
                        width={300}
                        height={300}
                        className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </Link>
              </div>

              <div className="flex-1 w-full md:w-1/2 space-y-3">
                <Link href={`/products/${item.product.id}`} className="block group">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:underline transition-colors duration-200">
                    {item.product.name}
                  </h2>
                </Link>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    ₹{item.product.price.toFixed(2)} each
                  </p>
                  <div className="flex items-center space-x-2">
                    {item.product.stockQuantity && item.product.stockQuantity > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center w-full md:w-1/4 space-y-4">
                <div className="text-center">
                  <label htmlFor={`qty-${item.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    id={`qty-${item.id}`}
                    type="number"
                    min={1}
                    max={item.product.stockQuantity && item.product.stockQuantity > 0 ? item.product.stockQuantity : 1}
                    value={item.quantity}
                    onChange={(e) => updateCartItem(item.id, parseInt(e.target.value, 10))}
                    className="w-20 text-center border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                    disabled={!(item.product.stockQuantity && item.product.stockQuantity > 0)}
                  />
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p className="text-sm text-gray-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
          </div>
          <Link
            href="/checkout"
            className="mt-4 md:mt-0 relative inline-block overflow-hidden rounded-lg border-2 border-black px-8 py-3 font-semibold text-black group"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Proceed to Checkout</span>
            <span className="absolute inset-0 translate-x-[-100%] bg-black transition-transform duration-300 ease-out group-hover:translate-x-0" />
          </Link>
        </div>
      </div>
    </main>
  )
}