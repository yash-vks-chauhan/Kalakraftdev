'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import Link from 'next/link'
import styles from './mobile.module.css'
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react'

interface Address {
  id: number
  label: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
}

export default function MobileCheckout() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { cartItems, clearCart } = useCart()

  // Address book state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError, setAddrError] = useState<string|null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(user?.defaultAddressId || null)
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
  
  // Accordion state
  const [openSection, setOpenSection] = useState('shipping')

  // Load addresses when component mounts
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadAddresses() {
      setLoading(true)
      try {
        const res = await fetch('/api/addresses', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setAddresses(json.addresses)
        // If no address is selected yet and we have addresses, select the first one
        if (selectedAddressId === null && json.addresses.length) {
          setSelectedAddressId(json.addresses[0].id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAddresses()
  }, [user, router, token, selectedAddressId])

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
      const res = await fetch('/api/coupons/redeem', {
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
      setCouponMessage(`Coupon applied!`)
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
    setAddrLoading(true)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddr),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddrError(json.error || 'Failed to save address')
        return
      }
      setAddresses([ json.address, ...addresses ])
      setSelectedAddressId(json.address.id)
      setNewAddr({ label:'', line1:'', line2:'', city:'', postalCode:'', country:'' })
      setShowAddForm(false)
      setAddrError(null)
    } catch (error: any) {
      setAddrError(error.message || 'Failed to save address')
    } finally {
      setAddrLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading checkout...</p>
      </div>
    )
  }

  // Show empty cart message
  if (cartItems.length === 0) {
    return (
      <div className={styles.mobileCartEmpty}>
        <div className={styles.emptyCartIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Add items to your cart before checkout</p>
        <Link href="/products" className={styles.browseButton}>
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.mobileCheckout}>
      <div className={styles.checkoutHeader}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Checkout</h1>
        <div></div>
      </div>

      <div className={styles.checkoutContent}>
        {/* Order Summary Accordion */}
        <div className={styles.checkoutAccordion}>
          <div 
            className={styles.accordionHeader} 
            onClick={() => setOpenSection(openSection === 'summary' ? '' : 'summary')}
          >
            <h2>Order Summary</h2>
            {openSection === 'summary' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {openSection === 'summary' && (
            <div className={styles.accordionContent}>
              <div className={styles.orderItems}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div className={styles.orderItemInfo}>
                      <span className={styles.orderItemName}>{item.product.name}</span>
                      <span className={styles.orderItemQuantity}>× {item.quantity}</span>
                    </div>
                    <span className={styles.orderItemPrice}>
                      {item.product.currency} {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shipping Address Accordion */}
        <div className={styles.checkoutAccordion}>
          <div 
            className={styles.accordionHeader} 
            onClick={() => setOpenSection(openSection === 'shipping' ? '' : 'shipping')}
          >
            <h2>Shipping Address</h2>
            {openSection === 'shipping' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {openSection === 'shipping' && (
            <div className={styles.accordionContent}>
              <div className={styles.addressList}>
                {addresses.map((address) => (
                  <div 
                    key={address.id}
                    className={`${styles.addressCard} ${selectedAddressId === address.id ? styles.selectedAddress : ''}`}
                    onClick={() => setSelectedAddressId(address.id)}
                  >
                    {selectedAddressId === address.id && (
                      <div className={styles.addressCheckmark}>
                        <Check size={16} />
                      </div>
                    )}
                    <div className={styles.addressLabel}>{address.label}</div>
                    <div className={styles.addressDetails}>
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.postalCode}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                ))}
                
                <button 
                  className={styles.addAddressButton}
                  onClick={() => setShowAddForm(!showAddForm)}
                  type="button"
                >
                  <Plus size={16} />
                  Add New Address
                </button>
                
                {showAddForm && (
                  <form onSubmit={handleSaveNewAddress} className={styles.addressForm}>
                    <div className={styles.formField}>
                      <label htmlFor="label">Address Label</label>
                      <input
                        id="label"
                        type="text"
                        value={newAddr.label}
                        onChange={(e) => setNewAddr({...newAddr, label: e.target.value})}
                        placeholder="Home, Work, etc."
                        required
                      />
                    </div>
                    
                    <div className={styles.formField}>
                      <label htmlFor="line1">Address Line 1</label>
                      <input
                        id="line1"
                        type="text"
                        value={newAddr.line1}
                        onChange={(e) => setNewAddr({...newAddr, line1: e.target.value})}
                        placeholder="Street address"
                        required
                      />
                    </div>
                    
                    <div className={styles.formField}>
                      <label htmlFor="line2">Address Line 2 (Optional)</label>
                      <input
                        id="line2"
                        type="text"
                        value={newAddr.line2}
                        onChange={(e) => setNewAddr({...newAddr, line2: e.target.value})}
                        placeholder="Apt, Suite, etc."
                      />
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formField}>
                        <label htmlFor="city">City</label>
                        <input
                          id="city"
                          type="text"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({...newAddr, city: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className={styles.formField}>
                        <label htmlFor="postalCode">Postal Code</label>
                        <input
                          id="postalCode"
                          type="text"
                          value={newAddr.postalCode}
                          onChange={(e) => setNewAddr({...newAddr, postalCode: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className={styles.formField}>
                      <label htmlFor="country">Country</label>
                      <input
                        id="country"
                        type="text"
                        value={newAddr.country}
                        onChange={(e) => setNewAddr({...newAddr, country: e.target.value})}
                        required
                      />
                    </div>
                    
                    {addrError && <p className={styles.errorText}>{addrError}</p>}
                    
                    <div className={styles.formActions}>
                      <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={addrLoading}
                      >
                        {addrLoading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Accordion */}
        <div className={styles.checkoutAccordion}>
          <div 
            className={styles.accordionHeader} 
            onClick={() => setOpenSection(openSection === 'payment' ? '' : 'payment')}
          >
            <h2>Payment Method</h2>
            {openSection === 'payment' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {openSection === 'payment' && (
            <div className={styles.accordionContent}>
              <div className={styles.paymentOptions}>
                <div 
                  className={`${styles.paymentOption} ${paymentMethod === 'Credit Card' ? styles.selectedPayment : ''}`}
                  onClick={() => setPaymentMethod('Credit Card')}
                >
                  <div className={styles.paymentRadio}>
                    {paymentMethod === 'Credit Card' && <div className={styles.radioInner}></div>}
                  </div>
                  <div className={styles.paymentLabel}>Credit Card</div>
                </div>
                
                <div 
                  className={`${styles.paymentOption} ${paymentMethod === 'PayPal' ? styles.selectedPayment : ''}`}
                  onClick={() => setPaymentMethod('PayPal')}
                >
                  <div className={styles.paymentRadio}>
                    {paymentMethod === 'PayPal' && <div className={styles.radioInner}></div>}
                  </div>
                  <div className={styles.paymentLabel}>PayPal</div>
                </div>
                
                <div 
                  className={`${styles.paymentOption} ${paymentMethod === 'Cash on Delivery' ? styles.selectedPayment : ''}`}
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                >
                  <div className={styles.paymentRadio}>
                    {paymentMethod === 'Cash on Delivery' && <div className={styles.radioInner}></div>}
                  </div>
                  <div className={styles.paymentLabel}>Cash on Delivery</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coupon Code */}
        <div className={styles.couponSection}>
          <div className={styles.couponForm}>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className={styles.couponInput}
            />
            <button 
              type="button" 
              onClick={applyCoupon}
              disabled={couponLoading || !coupon.trim()}
              className={styles.couponButton}
            >
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          
          {couponMessage && (
            <p className={`${styles.couponMessage} ${couponMessage.includes('Failed') || couponMessage.includes('Invalid') ? styles.errorMessage : styles.successMessage}`}>
              {couponMessage}
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{cartItems[0].product.currency} {subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax (5%)</span>
            <span>{cartItems[0].product.currency} {tax.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>
              {shippingFee === 0 
                ? 'Free' 
                : `${cartItems[0].product.currency} ${shippingFee.toFixed(2)}`
              }
            </span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>- {cartItems[0].product.currency} {discount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>{cartItems[0].product.currency} {total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}
      </div>

      <div className={styles.checkoutActions}>
        <button 
          onClick={handleSubmit}
          className={styles.placeOrderButton}
          disabled={submitting || !selectedAddressId}
        >
          {formProcessing ? 'Processing...' : `Place Order • ${cartItems[0].product.currency} ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
</rewritten_file>