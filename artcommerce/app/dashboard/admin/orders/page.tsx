'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import styles from './orders.module.css'

interface OrderSummary {
  id: number
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  paymentMethod: string
  paymentStatus: string
  user: { fullName: string; email: string }
  shippingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
}

const ALL_STATUSES = ['all','pending','accepted','shipped','delivered','cancelled']
const ALL_PAYMENTS = ['all','unpaid','paypal','credit card','cod']

export default function AdminOrdersPage() {
  const { token, user } = useAuth()
  const search = useSearchParams()
  const filterUid = search.get('userId')
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>('week')
  const [metrics, setMetrics] = useState<{
    ordersPerDay: { date: string; count: number }[]
    paymentBreakdown: { method: string; value: number }[]
  } | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [payFilter, setPayFilter] = useState<string>('all')

  useEffect(() => {
    if (user?.role !== 'admin') return

    const url = `/api/orders${filterUid ? '?userId=' + filterUid : ''}`

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Failed to load orders (${r.status}): ${text}`);
        }
        return r.json();
      })
      .then(data => setOrders(data.orders || []))
      .catch(err => {
        console.error(err);
        setOrders([]);
      })
      .finally(() => setLoading(false))
  }, [token, user, filterUid])

  useEffect(() => {
    if (user?.role !== 'admin') return
    
    fetch(`/api/admin/metrics?period=${period}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => setMetrics(data))
      .catch(console.error)
  }, [token, user, period])

  useEffect(() => {
    if (user?.role !== 'admin') return
    const evtSource = new EventSource('/api/orders/stream')
    evtSource.onmessage = evt => {
      const { type, order } = JSON.parse(evt.data)
      if (type === 'created') {
        setOrders(prev => [order, ...prev])
      } else if (type === 'updated') {
        setOrders(prev => prev.map(o => o.id === order.id ? order : o))
      }
    }
    return () => evtSource.close()
  }, [user?.role])

  if (user?.role !== 'admin') {
    return <p className="p-8">Unauthorized</p>
  }
  if (loading) return <p className="p-8">Loading all orders…</p>

  let displayed = orders

  if (filterStatus !== 'all') {
    displayed = displayed.filter(o => o.status === filterStatus)
  }
  if (fromDate) {
    const fromTs = new Date(fromDate).getTime()
    displayed = displayed.filter(o => new Date(o.createdAt).getTime() >= fromTs)
  }
  if (toDate) {
    const toTs = new Date(toDate).getTime() + 24*60*60*1000
    displayed = displayed.filter(o => new Date(o.createdAt).getTime() < toTs)
  }
  if (searchText.trim()) {
    const q = searchText.trim().toLowerCase()
    displayed = displayed.filter(o =>
      o.user.fullName.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q)
    )
  }
  if (payFilter !== 'all') {
    if (payFilter === 'unpaid') {
      displayed = displayed.filter(o => o.paymentStatus === 'unpaid')
    } else {
      displayed = displayed.filter(o => o.paymentMethod === payFilter)
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders Management</h1>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search Customer</label>
          <input
            type="text"
            placeholder="Name or email..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Payment</label>
          <select
            value={payFilter}
            onChange={e => setPayFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {ALL_PAYMENTS.map(p => (
              <option key={p} value={p}>
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={async () => {
          try {
            const res = await fetch('/api/orders/export', {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'orders.csv'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          } catch (err: any) {
            alert('Export failed: ' + err.message)
          }
        }}
        className={styles.exportButton}
      >
        Export CSV
      </button>

      {metrics && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Orders in Last 7 Days</h3>
            <BarChart width={400} height={200} data={metrics.ordersPerDay}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4ade80" />
            </BarChart>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Payment Method Breakdown</h3>
            {metrics.paymentBreakdown.length === 0 ? (
              <p className={styles.noDataText}>No payment data available.</p>
            ) : (
              <PieChart width={300} height={250}>
                <Pie
                  data={metrics.paymentBreakdown}
                  dataKey="value"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.method}
                >
                  {metrics.paymentBreakdown.map((entry, idx) => (
                    <Cell
                      key={entry.method}
                      fill={['#4ade80', '#60a5fa', '#facc15', '#f87171'][idx % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            )}
          </div>
        </div>
      )}

      <div className={styles.ordersList}>
        {displayed.map(o => (
          <div key={o.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <div className={styles.orderNumber}>#{o.orderNumber}</div>
                <div className={styles.orderDate}>
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={styles.orderAmount}>
                ₹{o.totalAmount.toFixed(2)}
              </div>
            </div>

            <div className={styles.customerInfo}>
              <div className={styles.customerName}>{o.user.fullName}</div>
              <div className={styles.customerEmail}>{o.user.email}</div>
              <div className={styles.shippingAddress}>
                {o.shippingAddress.line1}, {o.shippingAddress.city},{' '}
                {o.shippingAddress.postalCode}, {o.shippingAddress.country}
              </div>
            </div>

            <div className={styles.orderActions}>
              <span className={`${styles.statusBadge} ${styles[o.status.toLowerCase()]}`}>
                {o.status}
              </span>
              <Link
                href={`/dashboard/orders/${o.id}`}
                className={styles.viewLink}
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}