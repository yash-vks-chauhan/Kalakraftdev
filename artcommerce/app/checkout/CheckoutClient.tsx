'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Link from 'next/link'
import styles from './checkout.module.css'

interface Address {
  id: number
  label: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
}

export default function CheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  const { cartItems, clearCart } = useCart()

  // Address book state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError, setAddrError] = useState<string|null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddr, setNewAddr] = useState({
    label: '', line1: '', line2: '', city: '', postalCode: '', country: ''
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Credit Card')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [formProcessing, setFormProcessing] = useState(false)

  // Initialize coupon from URL parameters (from mobile cart)
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon')
    const urlDiscountType = searchParams.get('discountType') as 'percentage' | 'flat' | null
    const urlDiscountAmount = searchParams.get('discountAmount')
    
    if (urlCoupon && urlDiscountType && urlDiscountAmount) {
      setCoupon(urlCoupon)
      setDiscount(parseFloat(urlDiscountAmount))
      setCouponMessage(`Coupon "${urlCoupon}" applied!`)
    }
  }, [searchParams])

  // Load addresses when component mounts
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadAddresses() {
      setAddrLoading(true)
      setAddrError(null)
      try {
        const res = await fetch('/api/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load addresses')
        
        setAddresses(data.addresses || [])
        // Only set selectedAddressId if it's not already set
        if (data.addresses?.length > 0 && !selectedAddressId) {
          const defaultAddr = data.addresses.find((a: Address) => a.id === user.defaultAddressId)
          setSelectedAddressId(defaultAddr?.id || data.addresses[0].id)
        }
      } catch (err: any) {
        setAddrError(err.message)
      } finally {
        setAddrLoading(false)
        setLoading(false)
      }
    }
    loadAddresses()
  }, [user, router, token])

  // Calculate order totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  )
  const tax = parseFloat((subtotal * 0.05).toFixed(2))
  const shippingFee = parseFloat((subtotal > 100 ? 0 : 10).toFixed(2))
  const total = parseFloat((subtotal + tax + shippingFee - discount).toFixed(2))

  // Apply coupon code
  async function applyCoupon() {
    setCouponMessage(null)
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: coupon.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply coupon')
      }
      // compute discount
      if (data.type === 'percentage') {
        setDiscount((subtotal + tax + shippingFee) * (data.amount / 100))
      } else {
        setDiscount(data.amount)
      }
      setCouponMessage(`Coupon "${data.code}" applied!`)
    } catch (err: any) {
      setCouponMessage(err.message)
      setDiscount(0)
    } finally {
      setCouponLoading(false)
    }
  }

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    setFormProcessing(true)

    if (!selectedAddressId) {
      setError('Please pick a shipping address')
      setSubmitting(false)
      setFormProcessing(false)
      return
    }

    try {
      const payload = {
        addressId: selectedAddressId,
        paymentMethod,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        ...(discount > 0 && coupon.trim() ? { couponCode: coupon.trim() } : {}),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Order failed')
      }

      // Store order number and clear cart with small delay to show processing state
      localStorage.setItem('lastOrderNumber', data.order.orderNumber)
      
      // Add a slight delay to show the processing animation
      setTimeout(() => {
        clearCart()
        router.push('/checkout/success')
      }, 800)
      
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
      setFormProcessing(false)
    }
  }

  // Save new address
  async function handleSaveNewAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!newAddr.line1 || !newAddr.city || !newAddr.postalCode || !newAddr.country) {
      setAddrError('Please fill in all required fields')
      return
    }

    setAddrLoading(true)
    setAddrError(null)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddr),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save address')
      
      setAddresses([data.address, ...addresses])
      setSelectedAddressId(data.address.id)
      setShowAddForm(false)
      setNewAddr({ label: '', line1: '', line2: '', city: '', postalCode: '', country: '' })
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setAddrLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <main className={styles.centeredContainer}>
        <p className={styles.loadingText}>
          <span className={styles.loadingSpinner}></span>
          Loading addresses...
        </p>
      </main>
    )
  }

  // Show empty cart message
  if (cartItems.length === 0) {
    return (
      <main className={styles.checkoutContainer}>
        <h1 className={styles.pageTitle}>Checkout</h1>
        <div className={styles.section}>
          <p className={styles.emptyCartText}>
            Your cart is empty.{' '}
            <Link href="/products" className={styles.emptyCartLink}>
              Browse products
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.checkoutContainer}>
      <h1 className={styles.pageTitle}>Checkout</h1>

      <div className={styles.section}>
        <form onSubmit={handleSubmit}>
          {/* Order Summary */}
          <div>
            <h2 className={styles.sectionTitle}>Order Summary</h2>
            
            {cartItems.map((item) => (
              <div key={item.id} className={styles.summaryItem}>
                <span>{item.product.name} × {item.quantity}</span>
                <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className={styles.divider}></div>
            
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className={styles.totalRow}>
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            
            <div className={styles.totalRow}>
              <span>Shipping</span>
              <span>₹{shippingFee.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className={`${styles.totalRow} ${styles.discountRow}`}>
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className={styles.finalTotal}>
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Payment Method */}
          <div>
            <h2 className={styles.sectionTitle}>Payment Method</h2>
            <div className={styles.formGroup}>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={styles.select}
                disabled={formProcessing}
              >
                <option>Credit Card</option>
                <option>PayPal</option>
                <option>Cash on Delivery</option>
              </select>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Coupon Code */}
          <div>
            <h2 className={styles.sectionTitle}>Coupon Code</h2>
            <div className={styles.formGroup}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter coupon code"
                  className={styles.input}
                  disabled={formProcessing || couponLoading}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className={styles.button}
                  disabled={formProcessing || couponLoading || !coupon.trim()}
                >
                  {couponLoading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      Applying...
                    </>
                  ) : 'Apply'}
                </button>
              </div>
              {couponMessage && (
                <p className={`${styles.message} ${couponMessage.includes('applied') ? styles.success : styles.error}`}>
                  {couponMessage}
                </p>
              )}
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Shipping Address */}
          <div>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>
            
            {addrError && <p className={styles.error}>{addrError}</p>}
            
            {addresses.length > 0 ? (
              <div>
                {addresses.map(a => (
                  <div 
                    key={a.id} 
                    className={`${styles.addressOption} ${selectedAddressId === a.id ? styles.addressOptionSelected : ''}`}
                    onClick={() => {
                      setSelectedAddressId(a.id);
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="shippingAddress"
                        value={a.id}
                        checked={selectedAddressId === a.id}
                        onChange={(e) => {
                          setSelectedAddressId(a.id);
                        }}
                        disabled={formProcessing}
                        style={{ marginRight: '8px', marginTop: '2px' }}
                      />
                      <div className={styles.addressInfo}>
                        <strong>{a.label}</strong>
                        <br />
                        {a.line1}
                        {a.line2 && <><br />{a.line2}</>}
                        <br />
                        {a.city}, {a.postalCode}, {a.country}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noAddresses}>No addresses found</p>
            )}
            
            <div className={styles.addressActions}>
              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className={styles.addAddressButton}
                  disabled={formProcessing}
                >
                  Add New Address
                </button>
              ) : (
                <div className={styles.addAddressForm}>
                  <h3 className={styles.formTitle}>Add New Address</h3>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Label (e.g., Home, Office)"
                      value={newAddr.label}
                      onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Address Line 1*"
                      value={newAddr.line1}
                      onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Address Line 2"
                      value={newAddr.line2}
                      onChange={e => setNewAddr({ ...newAddr, line2: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="City*"
                      value={newAddr.city}
                      onChange={e => setNewAddr({ ...newAddr, city: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Postal Code"
                      value={newAddr.postalCode}
                      onChange={e => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Country"
                      value={newAddr.country}
                      onChange={e => setNewAddr({ ...newAddr, country: e.target.value })}
                      className={styles.input}
                      disabled={addrLoading || formProcessing}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className={styles.button}
                      disabled={addrLoading || formProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewAddress}
                      className={styles.button}
                      disabled={addrLoading || formProcessing}
                    >
                      {addrLoading ? (
                        <>
                          <span className={styles.loadingSpinner}></span>
                          Saving...
                        </>
                      ) : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider}></div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting || formProcessing || cartItems.length === 0 || !selectedAddressId}
          >
            {submitting ? (
              <>
                <span className={styles.loadingSpinner}></span>
                {formProcessing ? 'Processing Order...' : 'Submitting...'}
              </>
            ) : (
              `Place Order - ₹${total.toFixed(2)}`
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
