'use client'

import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import ButtonLoader from './ButtonLoader'

type Props = {
  productId: number
  initialQuantity?: number
  stockQuantity?: number
}

export default function AddToCartButton({
  productId,
  initialQuantity = 1,
  stockQuantity,
}: Props) {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()

  const [quantity, setQuantity] = useState(initialQuantity)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  const isOutOfStock = stockQuantity !== undefined && stockQuantity <= 0
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (isOutOfStock) {
      setError('This product is out of stock')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await addToCart(productId, quantity)

      setShowPopup(true)
      setTimeout(() => setShowPopup(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Could not add to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 relative">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="flex items-center space-x-2">
        <label htmlFor={`qty-${productId}`} className="text-gray-700">
          Qty:
        </label>
        <input
          id={`qty-${productId}`}
          type="number"
          min={1}
          max={stockQuantity}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          className="w-16 border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          disabled={isOutOfStock}
        />

        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className={clsx(
            'px-4 py-2 rounded text-white transition-colors',
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : isOutOfStock
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-black hover:bg-gray-900'
          )}
        >
          {loading ? <ButtonLoader size="small" color="white" /> : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>

      {isLowStock && !error && (
        <p className="text-amber-600 text-sm mt-2">
          Only {stockQuantity} items left in stock!
        </p>
      )}

      {showPopup && (
        <div className="absolute top-0 right-0 mt-[-1.5rem] mr-0 bg-black text-white text-sm px-3 py-1 rounded shadow-lg">
          Added to cart!
        </div>
      )}
    </div>
  )
}