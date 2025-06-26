//app/dashboard/orders/[id]/page.tsx
//order details page 
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import styles from '../order_details.module.css'
import React from 'react'

interface OrderItem {
  id: number
  productId: number
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    currency: string
    price: number
    imageUrls: string[] | {}
  }
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  couponCode?: string
  discountAmount?: number
  discountedTotal?: number
  shippingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  billingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderItems: OrderItem[]
  orderNotes: OrderNote[];
  user: { id: number; fullName: string; email: string };
}

interface OrderNote {
  id: number;
  text: string;
  createdAt: string;
  author: { id: number; fullName: string };
}


export default function OrderDetailsPage() {
  const params = useParams()
  const { user, token } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    async function loadData() {
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        router.replace('/auth/login')
        return
      }
      if (!res.ok) throw new Error('Failed to load order')
      const { order } = await res.json()
      setOrder(order)
      setNewStatus(order.status)
      const notesRes = await fetch(`/api/orders/${params.id}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (notesRes.ok) {
        const { notes } = await notesRes.json()
        setNotes(notes)
      }
    }
    loadData()
  }, [params.id, token, router])

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { order: updated } = await res.json()
      setOrder(updated)
      alert('Status updated and e-mail sent!')
    } catch (err: any) {
      alert('Failed to update status: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    const res = await fetch(`/api/orders/${order!.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: noteText.trim() }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      return alert(`Failed to add note: ${error}`)
    }
    const { note } = await res.json()
    setNotes(prev => [...prev, note])
    setNoteText('')
  }

  if (!order) {
    return (
      <main className={styles.orderDetailsContainer}>
        <h1 className={styles.orderNumber}>Order Details</h1>
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main className={styles.orderDetailsContainer}>
      <div className={styles.header}>
        <h1 className={styles.orderNumber}>Order #{order.orderNumber}</h1>
        <p className={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <p className={styles.totalCharged}>
        Total charged: ₹{order.totalAmount.toFixed(2)}
      </p>

      {order.discountAmount && order.discountAmount > 0 && (
        <div className={styles.discountInfo}>
          <p>
            <strong>Coupon used:</strong> {order.couponCode}{' '}
            <span style={{ color: '#e53e3e' }}>–₹{order.discountAmount.toFixed(2)}</span>
          </p>
        </div>
      )}

      {order.user && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Customer Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <p><strong>Name:</strong> {order.user.fullName}</p>
            </div>
            <div className={styles.infoItem}>
              <p><strong>Email:</strong> {order.user.email}</p>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Addresses & Payment</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <p><strong>Shipping Address:</strong></p>
            <p>{order.shippingAddress.line1}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
          <div className={styles.infoItem}>
            <p><strong>Billing Address:</strong></p>
            <p>{order.billingAddress.line1}</p>
            <p>
              {order.billingAddress.city}, {order.billingAddress.postalCode}
            </p>
            <p>{order.billingAddress.country}</p>
          </div>
          <div className={styles.infoItem}>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
            <p>
              <strong>Payment Status:</strong>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Order Status</h2>
        <div className={styles.statusContainer}>
          <p>
            <span className={styles.statusBadge}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
            </span>
          </p>
          {user?.role === 'admin' && (
            <form onSubmit={handleStatusUpdate} className={styles.statusForm}>
              <select
                name="status"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className={styles.statusSelect}
              >
                <option value="accepted">Accepted</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.updateButton}
              >
                {isLoading ? 'Updating…' : 'Update Status'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Items in Order</h2>
        <table className={styles.itemTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.orderItems ?? []).map(item => {
              const unitPrice = item.priceAtPurchase.toFixed(2)
              const lineTotal = (item.quantity * item.priceAtPurchase).toFixed(2)
              return (
                <React.Fragment key={item.id}>
                  <tr>
                    <td data-label="Product">{item.product.name}</td>
                    <td data-label="Qty" style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td data-label="Unit Price" style={{ textAlign: 'right' }}>₹ {unitPrice}</td>
                    <td data-label="Line Total" style={{ textAlign: 'right' }}>₹ {lineTotal}</td>
                  </tr>
                  {order.status === 'delivered' && (
                    <tr key={`${item.id}-rate`}>
                      <td colSpan={4} style={{ padding: '6px 0' }}>
                        <span style={{ marginRight: '8px' }}>Rate:</span>
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            style={{ marginRight: 4, cursor: 'pointer' }}
                            onClick={async ()=>{
                              const comment = prompt('Any feedback? (optional)', '') || '';
                              await fetch(`/api/products/${item.product.id}/review`,{
                                method:'POST',
                                headers:{
                                  'Content-Type':'application/json',
                                  Authorization:`Bearer ${token}`
                                },
                                body:JSON.stringify({ rating:n, comment, locale:navigator.language })
                              })
                              alert('Thanks for rating!')
                            }}
                          >{n}</button>
                        ))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          <tfoot>
            {order.orderItems?.length > 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}>
                  Subtotal:
                </td>
                <td style={{ textAlign: 'right' }}>
                  ₹ {order.subtotal.toFixed(2)}
                </td>
              </tr>
            )}
            {order.orderItems?.length > 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}>
                  Tax (5%):
                </td>
                <td style={{ textAlign: 'right' }}>
                  ₹ {order.tax.toFixed(2)}
                </td>
              </tr>
            )}
            {order.orderItems?.length > 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}>
                  Shipping Fee:
                </td>
                <td style={{ textAlign: 'right' }}>
                  ₹ {order.shippingFee.toFixed(2)}
                </td>
              </tr>
            )}
            {order.orderItems?.length > 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}>
                  Total:
                </td>
                <td style={{ textAlign: 'right' }}>
                  ₹ {order.totalAmount.toFixed(2)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </section>

      {/* ─── Notes & Audit Trail ──────────────────────────────────── */}
      <section className={styles.notesSection}>
        <h2 className={styles.sectionTitle}>Notes & Audit Trail</h2>
        {(order.orderNotes?.length ?? 0) === 0 ? (
          <p className={styles.noteText}>No notes yet.</p>
        ) : (
          <ul className={styles.noteList}>
            {order.orderNotes.map(note => (
              <li key={note.id} className={styles.noteItem}>
                <p className={styles.noteText}>{note.text}</p>
                <p className={styles.noteMeta}>
                  — {note.author.fullName},
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Admin-only: add new note */}
        {user?.role === 'admin' && (
          <form onSubmit={handleAddNote} className={styles.addNoteForm}>
            <input
              name="note"
              type="text"
              placeholder="Add a note…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className={styles.noteInput}
            />
            <button
              type="submit"
              className={styles.updateButton}
            >
              Add Note
            </button>
          </form>
        )}
      </section>

      <Link href="/dashboard/orders" className={styles.backLink}>
        ← Back to My Orders
      </Link>
    </main>
  )
}