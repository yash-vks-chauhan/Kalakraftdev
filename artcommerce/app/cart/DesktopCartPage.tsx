'use client'

import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function DesktopCartPage() {
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
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-center">Your cart is empty.</p>
        <div className="text-center mt-6">
          <Link href="/products" className="text-blue-600 hover:underline">
            Browse Products
          </Link>
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
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-6">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 bg-white"
          >
            {/* Product Image */}
            <div className="w-full md:w-1/4">
              {Array.isArray(item.product.imageUrls) &&
              item.product.imageUrls.length > 0 ? (
                <Image
                  src={item.product.imageUrls[0]}
                  alt={item.product.name}
                  width={300}
                  height={300}
                  className="object-cover rounded"
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 w-full md:w-1/2">
              <h2 className="text-xl font-semibold">{item.product.name}</h2>
              <p className="text-gray-700">
                {item.product.currency} {item.product.price.toFixed(2)}
              </p>
            </div>

            {/* Quantity & Remove */}
            <div className="flex flex-col items-center w-full md:w-1/4 space-y-2">
              <label htmlFor={`qty-${item.id}`} className="text-gray-700">
                Quantity
              </label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateCartItem(item.id, parseInt(e.target.value, 10))
                }
                className="w-20 text-center border rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
              />
              <button
                onClick={() => removeFromCart(item.id)}
                className="mt-2 text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow">
        <p className="text-xl font-semibold">
          Subtotal: {cartItems[0].product.currency}{' '}
          {subtotal.toFixed(2)}
        </p>
        <Link
         href="/checkout"
          className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
        Proceed to Checkout
       </Link>
      </div>
    </main>
  )
} 