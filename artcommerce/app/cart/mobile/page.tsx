'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function MobileCartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { cartItems, updateCartItem, removeFromCart, cartLoading } = useCart()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Record<number, boolean>>({})
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  if (!user) return null
  if (loading || cartLoading) {
    return (
      <main className="container mx-auto px-4 pt-20 pb-28">
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 bg-white">
              <div className="h-20 w-20 rounded-xl border border-black bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                <div className="h-8 w-44 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />
            </li>
          ))}
        </ul>
      </main>
    )
  }

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

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0), [cartItems])
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | null>(null)
  const estimatedShipping = 0
  const estimatedTaxRate = 0.18
  const discountAmount = useMemo(() => {
    if (!discountType) return 0
    return discountType === 'percentage' ? (subtotal * discount) / 100 : discount
  }, [discountType, discount, subtotal])
  const taxes = useMemo(() => Math.max(0, (subtotal - discountAmount) * estimatedTaxRate), [subtotal, discountAmount])
  const total = useMemo(() => Math.max(0, subtotal - discountAmount + estimatedShipping + taxes), [subtotal, discountAmount, taxes])

  return (
    <main className="container mx-auto px-4 pt-4 pb-28" data-testid="mobile-cart-page">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">Your Cart</h1>
        <p className="text-gray-600 text-sm mt-1">Review and manage your selected items</p>
      </div>

      <ul className="bg-white rounded-2xl border border-gray-300 divide-y divide-gray-200">
        {cartItems.map((item) => {
          const hasStockInfo = typeof item.product.stockQuantity === 'number'
          const isOut = hasStockInfo ? (item.product.stockQuantity as number) <= 0 : false
          const maxQty = hasStockInfo && (item.product.stockQuantity as number) > 0
            ? (item.product.stockQuantity as number)
            : undefined

          const handleDecrease = async () => {
            const next = Math.max(1, item.quantity - 1)
            if (next !== item.quantity) {
              setUpdating((prev) => ({ ...prev, [item.id]: true }))
              try {
                const ok = await updateCartItem(item.id, next)
                if (!ok) {
                  // Revert: refetch soft by router.refresh to fetch latest server state
                  router.refresh()
                }
              } finally {
                setUpdating((prev) => ({ ...prev, [item.id]: false }))
              }
            }
          }
          const handleIncrease = async () => {
            const next = item.quantity + 1
            const allowed = maxQty !== undefined ? next <= maxQty : true
            if (allowed) {
              setUpdating((prev) => ({ ...prev, [item.id]: true }))
              try {
                const ok = await updateCartItem(item.id, next)
                if (!ok) {
                  router.refresh()
                }
              } finally {
                setUpdating((prev) => ({ ...prev, [item.id]: false }))
              }
            }
          }

          const isUpdating = !!updating[item.id]
          const isBusy = isUpdating || removingId === item.id
          const showQtyError = hasStockInfo && maxQty !== undefined && item.quantity > (maxQty as number)

          return (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <Link href={`/products/${item.product.id}`} className="shrink-0">
                {Array.isArray(item.product.imageUrls) && item.product.imageUrls[0] ? (
                  <Image
                    src={item.product.imageUrls[0]}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover rounded-xl border border-black"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl border border-black bg-gray-50 flex items-center justify-center text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.product.id}`} className="block">
                  <h2
                    className="text-base font-semibold text-gray-900 leading-tight"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}
                  >
                    {item.product.name}
                  </h2>
                </Link>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{item.product.price.toFixed(2)} <span className="text-gray-400">×</span> {item.quantity}
                    <span className="ml-2 text-gray-500">=</span> <span className="ml-1">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {hasStockInfo && (
                    <span className={`text-xs ${isOut ? 'text-red-600' : 'text-gray-500'}`}>
                      {isOut ? 'Out of stock' : 'In stock'}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {isOut ? (
                    <span className="inline-flex items-center rounded-full border-2 border-red-600 text-red-600 px-3 py-2 text-xs font-semibold select-none">
                      Out of stock
                    </span>
                  ) : (
                  <div className="relative inline-flex items-center rounded-full border-2 border-black overflow-hidden shadow-sm">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={handleDecrease}
                      disabled={isOut || item.quantity <= 1 || isBusy}
                      className="px-5 py-2 text-black disabled:opacity-40 transition-all active:translate-y-0.5 active:scale-95 focus:outline-none hover:bg-gray-100 ring-offset-1 active:ring-2 active:ring-black"
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
                      onChange={async (e) => {
                        const nextVal = Math.max(1, parseInt(e.target.value, 10) || 1)
                        setUpdating((prev) => ({ ...prev, [item.id]: true }))
                        try {
                          const ok = await updateCartItem(item.id, nextVal)
                          if (!ok) {
                            router.refresh()
                          }
                        } finally {
                          setUpdating((prev) => ({ ...prev, [item.id]: false }))
                        }
                      }}
                      className="w-16 text-center text-black bg-white border-l-2 border-r-2 border-black focus:outline-none"
                      disabled={isOut || isBusy}
                    />
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={handleIncrease}
                      disabled={isOut || (maxQty !== undefined && item.quantity >= maxQty) || isBusy}
                      className="px-5 py-2 text-white bg-black disabled:opacity-40 transition-all active:translate-y-0.5 active:scale-95 focus:outline-none hover:bg-black/90 ring-offset-1 active:ring-2 active:ring-black"
                    >
                      +
                    </button>
                    {isUpdating && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                        <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent inline-block animate-spin" />
                      </div>
                    )}
                  </div>
                  )}
                  {showQtyError && (
                    <div className="ml-3 text-xs text-red-600">Max {maxQty as number} available</div>
                  )}
                  <button
                    onClick={async () => {
                      setRemovingId(item.id)
                      try {
                        await removeFromCart(item.id)
                      } finally {
                        setRemovingId(null)
                      }
                    }}
                    className="ml-4 inline-flex items-center gap-2 text-sm rounded-full border-2 border-black px-4 py-2 font-semibold text-black hover:bg-black hover:text-white active:translate-y-px transition-all disabled:opacity-50"
                    disabled={isBusy}
                    aria-label="Remove item"
                  >
                    {removingId === item.id ? (
                      <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent inline-block animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1h-3.5l-1-1h-3l-1 1H6a1 1 0 00-1 1v1z" />
                      </svg>
                    )}
                    <span className="sr-only">Remove</span>
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Order summary toggle above sticky bar */}
      <div className="fixed left-0 right-0 bg-white z-[1100]" style={{ bottom: '64px' }}>
        <div className="container mx-auto px-4 py-2 border-t-2 border-gray-200">
          <button
            onClick={() => setIsSummaryOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-medium"
          >
            <span>Order summary</span>
            <span>{isSummaryOpen ? '−' : '+'}</span>
          </button>
          {isSummaryOpen && (
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{discountAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-600">Shipping (est)</span><span>₹{estimatedShipping.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Taxes (est)</span><span>₹{taxes.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold pt-1 border-t"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              <button
                onClick={() => setPromoOpen(true)}
                className="mt-2 inline-flex items-center justify-center rounded-full border-2 border-black px-3 py-1 text-sm font-semibold"
              >
                {discountAmount > 0 ? 'Change promo code' : 'Apply promo code'}
              </button>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 py-2 flex items-center justify-between border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">₹{total.toFixed(2)}</p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 font-semibold"
          >
            Proceed to Checkout
          </Link>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>

      {/* Promo code bottom sheet */}
      {promoOpen && (
        <div className="fixed inset-0 z-[1200]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPromoOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t-2 border-black p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Promo code</h3>
              <button onClick={() => setPromoOpen(false)} className="text-sm">Close</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="flex-1 border-2 border-black px-3 py-2 rounded-md tracking-widest"
              />
              <button
                disabled={!promoCode || applyingPromo}
                onClick={async () => {
                  try {
                    setApplyingPromo(true)
                    const res = await fetch('/api/coupons/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode }) })
                    const data = await res.json()
                    if (res.ok) {
                      setDiscount(data.amount)
                      setDiscountType(data.type)
                      setPromoOpen(false)
                    } else {
                      alert(data.error || 'Invalid code')
                    }
                  } finally {
                    setApplyingPromo(false)
                  }
                }}
                className="inline-flex items-center justify-center rounded-full bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {applyingPromo ? 'Applying…' : (discountAmount > 0 ? 'Update' : 'Apply')}
              </button>
            </div>
            {discountAmount > 0 && (
              <button
                onClick={() => { setDiscount(0); setDiscountType(null); setPromoCode('') }}
                className="text-sm text-red-600 underline"
              >
                Remove promo code
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}


