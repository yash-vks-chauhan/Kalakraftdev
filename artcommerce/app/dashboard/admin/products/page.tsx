// File: app/dashboard/admin/products/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './products-list.module.css'
import { FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { useRouter } from 'next/navigation'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
}

export default function AdminProductsPage() {
  const { user, token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || r.statusText)
        return r.json()
      })
      .then(json => setProducts(json.products))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [token, user])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    setIsTransitioning(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setProducts(products.filter(p => p.id !== id))
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message)
    } finally {
      setIsTransitioning(false)
    }
  }

  function handleEdit(id: number) {
    setIsTransitioning(true)
    router.push(`/dashboard/admin/products/${id}`)
  }

  function handleAddNew() {
    setIsTransitioning(true)
    router.push('/dashboard/admin/products/new')
  }

  if (isLoading || isTransitioning) return <LoadingSpinner />
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Products</h1>
        <button
          onClick={handleAddNew}
          className={styles.newButton}
        >
          + Add New Product
          <FiArrowRight className={styles.arrowIcon} />
        </button>
        <Link href="/dashboard/admin/products/highest-rated" className={styles.newButton} style={{marginLeft:'1rem'}}>
          ⭐ Highest Rated
          <FiArrowRight className={styles.arrowIcon} />
        </Link>
      </div>

      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.tableHeaderCell}>Product Name</th>
            <th className={styles.tableHeaderCell}>Price</th>
            <th className={styles.tableHeaderCell}>Stock</th>
            <th className={styles.tableHeaderCell}>Status</th>
            <th className={styles.tableHeaderCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={styles.tableRow}>
              <td className={styles.tableCell}>{p.name}</td>
              <td className={styles.tableCell}>
                <span className={styles.price}>
                  {p.currency} {typeof p.price === 'number' ? p.price.toFixed(2) : '0.00'}
                </span>
              </td>
              <td className={styles.tableCell}>{p.stockQuantity}</td>
              <td className={styles.tableCell}>
                <span className={p.isActive ? styles.statusActive : styles.statusInactive}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleEdit(p.id)}
                    className={styles.editButton}
                  >
                    <FiEdit2 />
                    Edit
                    <FiArrowRight className={styles.arrowIcon} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={styles.deleteButton}
                  >
                    <FiTrash2 />
                    Delete
                    <FiArrowRight className={styles.arrowIcon} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}