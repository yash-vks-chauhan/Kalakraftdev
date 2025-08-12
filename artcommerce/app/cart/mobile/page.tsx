'use client'

import { useEffect, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function MobileCartPage() {
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
  if (loading) return <p className="text-center mt-8">Loading your cart…</p>

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
            <p className="text-gray-600 text-lg">Your cart is empty</p>
          </div>
          <div className="bg-white p-8 rounded-xl border-2 border-gray-200">
            <Link
              href="/products"
              className="block w-full text-center rounded-full border-2 border-black px-6 py-3 font-semibold text-black"
            >
              Browse Products
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
    <main className="container mx-auto px-4 pt-6 pb-28" data-testid="mobile-cart-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Cart</h1>
        <p className="text-gray-600 text-base">Review and manage your selected items</p>
      </div>

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
    </main>
  )
}


