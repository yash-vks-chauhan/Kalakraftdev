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
              className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-900 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Cart</h1>
        <p className="text-gray-600 text-lg">Review and manage your selected items</p>
      </div>
      <div className="space-y-6">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="border-2 border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Product Image - Clickable */}
            <div className="w-full md:w-1/4 cursor-pointer group">
              <Link href={`/products/${item.product.id}`}>
                {Array.isArray(item.product.imageUrls) &&
                item.product.imageUrls.length > 0 ? (
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

            {/* Product Info */}
            <div className="flex-1 w-full md:w-1/2 space-y-3">
              <Link href={`/products/${item.product.id}`} className="block group">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:underline transition-colors duration-200">
                  {item.product.name}
                </h2>
              </Link>
              
              {/* Price and Stock Status */}
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  ₹{item.product.price.toFixed(2)} each
                </p>
                
                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  {item.product.stockQuantity > 0 ? (
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

            {/* Quantity & Remove */}
            <div className="flex flex-col items-center w-full md:w-1/4 space-y-4">
              <div className="text-center">
                <label htmlFor={`qty-${item.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  max={item.product.stockQuantity > 0 ? item.product.stockQuantity : 1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartItem(item.id, parseInt(e.target.value, 10))
                  }
                  className="w-20 text-center border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  disabled={item.product.stockQuantity === 0}
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
          <p className="text-2xl font-bold text-gray-900">
            Subtotal: ₹{subtotal.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
          </p>
        </div>
        <Link
          href="/checkout"
          className="mt-4 md:mt-0 inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-900 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          Proceed to Checkout
        </Link>
      </div>
    </main>
  )
}